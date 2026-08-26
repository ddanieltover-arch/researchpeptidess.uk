import { StoreSettings } from '../../types';
import { DEFAULT_STORE_SETTINGS } from '../../lib/default-store-settings';
import { withCanonicalStoreContactEmails } from '../../lib/store-contact';
import { getNeonSqlOrNull, requireNeonSql } from '../neon-sql';

const SETTINGS_ID = 'default';

export async function loadStoreSettings(): Promise<StoreSettings> {
  const sql = getNeonSqlOrNull();
  if (!sql) return DEFAULT_STORE_SETTINGS;
  try {
    const rows = await sql`
      SELECT payload_json FROM store_settings WHERE id = ${SETTINGS_ID} LIMIT 1
    `;
    const payload = (rows[0] as { payload_json?: string } | undefined)?.payload_json;
    if (!payload) return DEFAULT_STORE_SETTINGS;
    const parsed = JSON.parse(payload) as Partial<StoreSettings>;
    return withCanonicalStoreContactEmails({ ...DEFAULT_STORE_SETTINGS, ...parsed });
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function saveStoreSettings(settings: StoreSettings, actor?: string): Promise<StoreSettings> {
  const sql = requireNeonSql();
  const canonical = withCanonicalStoreContactEmails(settings);
  const payload = JSON.stringify(canonical);
  const now = new Date();
  await sql`
    INSERT INTO store_settings (id, payload_json, updated_at, updated_by)
    VALUES (${SETTINGS_ID}, ${payload}, ${now}, ${actor ?? null})
    ON CONFLICT (id) DO UPDATE SET
      payload_json = EXCLUDED.payload_json,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;
  return canonical;
}
