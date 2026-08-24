import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index';
import { merchandisingAudit, productMerchandising, products } from '../../db/schema';
import { MerchandisingRecord } from '../../lib/merchandising-persistence';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listMerchandising(): Promise<MerchandisingRecord[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(productMerchandising);
  return rows.map((row) => ({
    productId: row.productId,
    featured: row.featured,
    bestsellerOverride: row.bestsellerOverride,
    bestsellerExcluded: row.bestsellerExcluded,
    newArrivalOverride: row.newArrivalOverride,
    hideFromHomepage: row.hideFromHomepage,
    merchandisingPriority: row.merchandisingPriority,
    merchandisingUpdatedAt: row.merchandisingUpdatedAt.toISOString(),
    merchandisingUpdatedBy: row.merchandisingUpdatedBy,
  }));
}

export async function upsertMerchandising(params: {
  productId: string;
  patch: Partial<Omit<MerchandisingRecord, 'productId' | 'merchandisingUpdatedAt'>>;
  actor: string;
  actorId?: string;
}): Promise<MerchandisingRecord> {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_UNAVAILABLE');
  }

  const [existing] = await db
    .select()
    .from(productMerchandising)
    .where(eq(productMerchandising.productId, params.productId))
    .limit(1);

  const next = {
    featured: params.patch.featured ?? existing?.featured ?? false,
    bestsellerOverride: params.patch.bestsellerOverride ?? existing?.bestsellerOverride ?? false,
    bestsellerExcluded: params.patch.bestsellerExcluded ?? existing?.bestsellerExcluded ?? false,
    newArrivalOverride: params.patch.newArrivalOverride ?? existing?.newArrivalOverride ?? false,
    hideFromHomepage: params.patch.hideFromHomepage ?? existing?.hideFromHomepage ?? false,
    merchandisingPriority: params.patch.merchandisingPriority ?? existing?.merchandisingPriority ?? 0,
    merchandisingUpdatedAt: new Date(),
    merchandisingUpdatedBy: params.actor,
  };

  await db
    .insert(productMerchandising)
    .values({
      productId: params.productId,
      ...next,
    })
    .onConflictDoUpdate({
      target: productMerchandising.productId,
      set: next,
    });

  try {
    await db
      .update(products)
      .set({
        isFeatured: next.featured,
        updatedAt: new Date(),
        updatedBy: params.actor,
      })
      .where(eq(products.id, params.productId));
  } catch {
    // Catalogue snapshot may include SKUs not yet present in Neon.
  }

  const action = Object.keys(params.patch).join(',') || 'MERCHANDISING_UPDATED';
  await db.insert(merchandisingAudit).values({
    id: newId('mla'),
    actor: params.actor,
    actorId: params.actorId,
    productId: params.productId,
    action,
    oldValue: existing ? JSON.stringify(existing) : null,
    newValue: JSON.stringify(next),
  });

  return {
    productId: params.productId,
    featured: next.featured,
    bestsellerOverride: next.bestsellerOverride,
    bestsellerExcluded: next.bestsellerExcluded,
    newArrivalOverride: next.newArrivalOverride,
    hideFromHomepage: next.hideFromHomepage,
    merchandisingPriority: next.merchandisingPriority,
    merchandisingUpdatedAt: next.merchandisingUpdatedAt.toISOString(),
    merchandisingUpdatedBy: next.merchandisingUpdatedBy,
  };
}
