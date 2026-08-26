import { sitePath } from './email/brand';
import { formatProductDisplayName } from './product-display';
import { productPath } from './routing';
import { buildProductWhatsAppUrl } from './store-contact';

export function getProductWhatsAppHref(input: {
  name: string;
  slug: string;
  sku?: string;
  variantLabel?: string;
  variantSku?: string;
}): string {
  return buildProductWhatsAppUrl({
    productName: formatProductDisplayName(input.name || ''),
    productUrl: sitePath(productPath(input.slug)),
    variantLabel: input.variantLabel,
    sku: input.variantSku || input.sku,
  });
}
