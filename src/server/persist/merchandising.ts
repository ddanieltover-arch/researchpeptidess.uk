import { MerchandisingRecord } from '../../lib/merchandising-persistence';
import { asIso, asRowArray, getNeonSqlOrNull, requireNeonSql } from '../neon-sql';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRow(row: Record<string, unknown>): MerchandisingRecord {
  return {
    productId: String(row.product_id || ''),
    featured: Boolean(row.featured),
    bestsellerOverride: Boolean(row.bestseller_override),
    bestsellerExcluded: Boolean(row.bestseller_excluded),
    newArrivalOverride: Boolean(row.new_arrival_override),
    hideFromHomepage: Boolean(row.hide_from_homepage),
    merchandisingPriority: Number(row.merchandising_priority || 0),
    merchandisingUpdatedAt: asIso(row.merchandising_updated_at),
    merchandisingUpdatedBy: row.merchandising_updated_by ? String(row.merchandising_updated_by) : null,
  };
}

export async function listMerchandising(): Promise<MerchandisingRecord[]> {
  const sql = getNeonSqlOrNull();
  if (!sql) return [];
  try {
    const rows = asRowArray(await sql`SELECT * FROM product_merchandising`);
    return rows.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function upsertMerchandising(params: {
  productId: string;
  patch: Partial<Omit<MerchandisingRecord, 'productId' | 'merchandisingUpdatedAt'>>;
  actor: string;
  actorId?: string;
}): Promise<MerchandisingRecord> {
  const sql = requireNeonSql();
  const existingRows = await sql`
    SELECT * FROM product_merchandising WHERE product_id = ${params.productId} LIMIT 1
  `;
  const existing = existingRows[0] as Record<string, unknown> | undefined;
  const next = {
    featured: params.patch.featured ?? Boolean(existing?.featured),
    bestsellerOverride: params.patch.bestsellerOverride ?? Boolean(existing?.bestseller_override),
    bestsellerExcluded: params.patch.bestsellerExcluded ?? Boolean(existing?.bestseller_excluded),
    newArrivalOverride: params.patch.newArrivalOverride ?? Boolean(existing?.new_arrival_override),
    hideFromHomepage: params.patch.hideFromHomepage ?? Boolean(existing?.hide_from_homepage),
    merchandisingPriority: params.patch.merchandisingPriority ?? Number(existing?.merchandising_priority || 0),
    merchandisingUpdatedAt: new Date(),
    merchandisingUpdatedBy: params.actor,
  };

  await sql`
    INSERT INTO product_merchandising (
      product_id, featured, bestseller_override, bestseller_excluded, new_arrival_override,
      hide_from_homepage, merchandising_priority, merchandising_updated_at, merchandising_updated_by
    ) VALUES (
      ${params.productId},
      ${next.featured},
      ${next.bestsellerOverride},
      ${next.bestsellerExcluded},
      ${next.newArrivalOverride},
      ${next.hideFromHomepage},
      ${next.merchandisingPriority},
      ${next.merchandisingUpdatedAt},
      ${next.merchandisingUpdatedBy}
    )
    ON CONFLICT (product_id) DO UPDATE SET
      featured = EXCLUDED.featured,
      bestseller_override = EXCLUDED.bestseller_override,
      bestseller_excluded = EXCLUDED.bestseller_excluded,
      new_arrival_override = EXCLUDED.new_arrival_override,
      hide_from_homepage = EXCLUDED.hide_from_homepage,
      merchandising_priority = EXCLUDED.merchandising_priority,
      merchandising_updated_at = EXCLUDED.merchandising_updated_at,
      merchandising_updated_by = EXCLUDED.merchandising_updated_by
  `;

  try {
    await sql`
      UPDATE products
      SET is_featured = ${next.featured}, updated_at = ${new Date()}, updated_by = ${params.actor}
      WHERE id = ${params.productId}
    `;
  } catch {
    // Catalogue snapshot may include SKUs not yet present in Neon.
  }

  const action = Object.keys(params.patch).join(',') || 'MERCHANDISING_UPDATED';
  await sql`
    INSERT INTO merchandising_audit (id, actor, actor_id, product_id, action, old_value, new_value)
    VALUES (
      ${newId('mla')},
      ${params.actor},
      ${params.actorId ?? null},
      ${params.productId},
      ${action},
      ${existing ? JSON.stringify(existing) : null},
      ${JSON.stringify(next)}
    )
  `;

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
