import path from 'node:path';
import { config } from 'dotenv';
import { upsertMerchandising, listMerchandising } from '../src/server/persist/merchandising';
import { listShippingMethods } from '../src/server/persist/shipping';
import { loadStoreSettings, saveStoreSettings } from '../src/server/persist/settings';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const settings = await loadStoreSettings();
  const saved = await saveStoreSettings({ ...settings, storeStatus: settings.storeStatus || 'PRIVATE_BETA' }, 'persistence-smoke');
  if (saved.storeStatus !== settings.storeStatus && saved.storeStatus !== 'PRIVATE_BETA') {
    throw new Error('SETTINGS_MISMATCH');
  }

  const shipping = await listShippingMethods();
  if (shipping.length === 0) throw new Error('SHIPPING_EMPTY');

  const productId = 'prod-bpc157';
  const written = await upsertMerchandising({
    productId,
    patch: { featured: true, merchandisingPriority: 10 },
    actor: 'persistence-smoke',
  });
  const rows = await listMerchandising();
  const found = rows.find((row) => row.productId === productId);
  if (!found?.featured || found.merchandisingPriority !== 10) {
    throw new Error('MERCHANDISING_MISMATCH');
  }

  await upsertMerchandising({
    productId,
    patch: {
      featured: written.featured,
      merchandisingPriority: written.merchandisingPriority,
    },
    actor: 'persistence-smoke',
  });

  console.log(`SMOKE_OK settings=${saved.storeStatus} shipping=${shipping.length} merchandising=${rows.length}`);
}

main().catch((error) => {
  console.error('SMOKE_FAILED', error instanceof Error ? error.message : 'Error');
  process.exit(1);
});
