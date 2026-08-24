import { eq } from 'drizzle-orm';
import { ShippingMethod } from '../../types';
import { getDb } from '../../db/index';
import { shippingMethods } from '../../db/schema';
import { INITIAL_SHIPPING_METHODS } from '../../lib/shipping-methods';

function fromPence(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  return Number(value) / 100;
}

function toPence(value: number | undefined): number | null {
  if (value == null) return null;
  return Math.round(value * 100);
}

export async function listShippingMethods(): Promise<ShippingMethod[]> {
  const db = getDb();
  if (!db) return INITIAL_SHIPPING_METHODS;
  const rows = await db.select().from(shippingMethods);
  if (rows.length === 0) {
    await seedShippingMethods();
    const seeded = await db.select().from(shippingMethods);
    return seeded.map(mapRow);
  }
  return rows.map(mapRow);
}

function mapRow(row: typeof shippingMethods.$inferSelect): ShippingMethod {
  return {
    id: row.id,
    name: row.name,
    zone: row.zone as ShippingMethod['zone'],
    carrier: row.carrier,
    price: Number(row.pricePence) / 100,
    freeShippingThreshold: fromPence(row.freeShippingThresholdPence),
    estimatedDays: row.estimatedDays,
    trackingAvailable: row.trackingAvailable,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export async function seedShippingMethods(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = new Date();
  for (const method of INITIAL_SHIPPING_METHODS) {
    await db
      .insert(shippingMethods)
      .values({
        id: method.id,
        name: method.name,
        zone: method.zone,
        carrier: method.carrier,
        pricePence: Math.round(method.price * 100),
        freeShippingThresholdPence: toPence(method.freeShippingThreshold),
        estimatedDays: method.estimatedDays,
        trackingAvailable: method.trackingAvailable,
        isActive: method.isActive,
        sortOrder: method.sortOrder || 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

export async function updateShippingMethodRecord(
  id: string,
  updates: Partial<ShippingMethod>
): Promise<ShippingMethod | null> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');
  const [existing] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
  if (!existing) return null;
  const next = {
    name: updates.name ?? existing.name,
    zone: updates.zone ?? existing.zone,
    carrier: updates.carrier ?? existing.carrier,
    pricePence: updates.price != null ? Math.round(updates.price * 100) : existing.pricePence,
    freeShippingThresholdPence:
      updates.freeShippingThreshold !== undefined
        ? toPence(updates.freeShippingThreshold)
        : existing.freeShippingThresholdPence,
    estimatedDays: updates.estimatedDays ?? existing.estimatedDays,
    trackingAvailable: updates.trackingAvailable ?? existing.trackingAvailable,
    isActive: updates.isActive ?? existing.isActive,
    sortOrder: updates.sortOrder ?? existing.sortOrder,
    updatedAt: new Date(),
  };
  await db.update(shippingMethods).set(next).where(eq(shippingMethods.id, id));
  const [row] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
  return row ? mapRow(row) : null;
}
