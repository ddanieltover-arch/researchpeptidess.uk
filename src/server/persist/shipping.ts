import { ShippingMethod } from '../../types';
import { INITIAL_SHIPPING_METHODS } from '../../lib/shipping-methods';
import { asRowArray, getNeonSqlOrNull, requireNeonSql } from '../neon-sql';

function fromPence(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  return Number(value) / 100;
}

function toPence(value: number | undefined): number | null {
  if (value == null) return null;
  return Math.round(value * 100);
}

function mapRow(row: Record<string, unknown>): ShippingMethod {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    zone: row.zone as ShippingMethod['zone'],
    carrier: String(row.carrier || ''),
    price: Number(row.price_pence || 0) / 100,
    freeShippingThreshold: fromPence(
      row.free_shipping_threshold_pence == null ? null : Number(row.free_shipping_threshold_pence)
    ),
    estimatedDays: String(row.estimated_days || ''),
    trackingAvailable: Boolean(row.tracking_available),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order || 0),
  };
}

export async function listShippingMethods(): Promise<ShippingMethod[]> {
  const sql = getNeonSqlOrNull();
  if (!sql) return INITIAL_SHIPPING_METHODS;
  try {
    const rows = asRowArray(await sql`SELECT * FROM shipping_methods ORDER BY sort_order ASC`);
    if (rows.length === 0) {
      await seedShippingMethods();
      const seeded = asRowArray(await sql`SELECT * FROM shipping_methods ORDER BY sort_order ASC`);
      return seeded.map((row) => mapRow(row as Record<string, unknown>));
    }
    return rows.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return INITIAL_SHIPPING_METHODS;
  }
}

export async function seedShippingMethods(): Promise<void> {
  const sql = getNeonSqlOrNull();
  if (!sql) return;
  const now = new Date();
  for (const method of INITIAL_SHIPPING_METHODS) {
    await sql`
      INSERT INTO shipping_methods (
        id, name, zone, carrier, price_pence, free_shipping_threshold_pence,
        estimated_days, tracking_available, is_active, sort_order, created_at, updated_at
      ) VALUES (
        ${method.id},
        ${method.name},
        ${method.zone},
        ${method.carrier},
        ${Math.round(method.price * 100)},
        ${toPence(method.freeShippingThreshold)},
        ${method.estimatedDays},
        ${method.trackingAvailable},
        ${method.isActive},
        ${method.sortOrder || 0},
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function updateShippingMethodRecord(
  id: string,
  updates: Partial<ShippingMethod>
): Promise<ShippingMethod | null> {
  const sql = requireNeonSql();
  const existingRows = await sql`SELECT * FROM shipping_methods WHERE id = ${id} LIMIT 1`;
  const existing = existingRows[0] as Record<string, unknown> | undefined;
  if (!existing) return null;
  const next = {
    name: updates.name ?? String(existing.name),
    zone: updates.zone ?? String(existing.zone),
    carrier: updates.carrier ?? String(existing.carrier),
    pricePence: updates.price != null ? Math.round(updates.price * 100) : Number(existing.price_pence),
    freeShippingThresholdPence:
      updates.freeShippingThreshold !== undefined
        ? toPence(updates.freeShippingThreshold)
        : existing.free_shipping_threshold_pence == null
          ? null
          : Number(existing.free_shipping_threshold_pence),
    estimatedDays: updates.estimatedDays ?? String(existing.estimated_days),
    trackingAvailable: updates.trackingAvailable ?? Boolean(existing.tracking_available),
    isActive: updates.isActive ?? Boolean(existing.is_active),
    sortOrder: updates.sortOrder ?? Number(existing.sort_order || 0),
  };
  await sql`
    UPDATE shipping_methods
    SET
      name = ${next.name},
      zone = ${next.zone},
      carrier = ${next.carrier},
      price_pence = ${next.pricePence},
      free_shipping_threshold_pence = ${next.freeShippingThresholdPence},
      estimated_days = ${next.estimatedDays},
      tracking_available = ${next.trackingAvailable},
      is_active = ${next.isActive},
      sort_order = ${next.sortOrder},
      updated_at = ${new Date()}
    WHERE id = ${id}
  `;
  const rows = await sql`SELECT * FROM shipping_methods WHERE id = ${id} LIMIT 1`;
  return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
}
