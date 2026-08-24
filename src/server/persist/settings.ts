import { eq } from 'drizzle-orm';
import { StoreSettings } from '../../types';
import { getDb } from '../../db/index';
import { storeSettingsRecords } from '../../db/schema';
import { DEFAULT_STORE_SETTINGS } from '../../lib/cms-data';

const SETTINGS_ID = 'default';

export async function loadStoreSettings(): Promise<StoreSettings> {
  const db = getDb();
  if (!db) return DEFAULT_STORE_SETTINGS;
  const [row] = await db.select().from(storeSettingsRecords).where(eq(storeSettingsRecords.id, SETTINGS_ID)).limit(1);
  if (!row?.payloadJson) return DEFAULT_STORE_SETTINGS;
  try {
    const parsed = JSON.parse(row.payloadJson) as Partial<StoreSettings>;
    return { ...DEFAULT_STORE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function saveStoreSettings(settings: StoreSettings, actor?: string): Promise<StoreSettings> {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_UNAVAILABLE');
  }
  const payload = JSON.stringify(settings);
  const now = new Date();
  await db
    .insert(storeSettingsRecords)
    .values({
      id: SETTINGS_ID,
      payloadJson: payload,
      updatedAt: now,
      updatedBy: actor,
    })
    .onConflictDoUpdate({
      target: storeSettingsRecords.id,
      set: {
        payloadJson: payload,
        updatedAt: now,
        updatedBy: actor,
      },
    });
  return settings;
}
