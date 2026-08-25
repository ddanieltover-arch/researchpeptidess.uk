import { Product } from '../../types';
import { neutralizeUnsafePublicCopy } from '../public-copy-safety';
import { PRODUCTS_NASAL } from './products-nasal';
import { PRODUCTS_REAGENTS, PRODUCTS_EQUIPMENT } from './products-reagents-equipment';
import { getProductImage } from '../product-image-generator';
import { applyShopCategory } from '../shop-category-assignment';
import { REMOVED_PRODUCT_SLUGS } from '../removed-product-slugs';
import { WOOCOMMERCE_PRODUCTS } from './generated/from-woocommerce';
import catalog from './generated/woocommerce-catalog.json';

const extrasKeptIds = new Set((catalog.extrasKept as Array<{ id: string }>).map((row) => row.id));

const EXTRA_PRODUCTS: Product[] = [
  ...PRODUCTS_NASAL,
  ...PRODUCTS_EQUIPMENT,
  ...PRODUCTS_REAGENTS.filter((product) => extrasKeptIds.has(product.id)),
].filter((product) => !REMOVED_PRODUCT_SLUGS.has(product.slug));

function withCatalogueImages(product: Product): Product {
  const safeProduct: Product = {
    ...product,
    shortDescription: neutralizeUnsafePublicCopy(product.shortDescription || ''),
    longDescription: neutralizeUnsafePublicCopy(product.longDescription || ''),
  };
  const localPhotos = (safeProduct.images || []).filter((image) => image.url.startsWith('/products/'));
  if (localPhotos.length > 0) {
    return {
      ...safeProduct,
      images: localPhotos.map((image, index) => ({
        ...image,
        isPrimary: index === 0,
        sortOrder: index,
      })),
    };
  }

  const generatedUrl = getProductImage(safeProduct);
  return {
    ...safeProduct,
    images: [
      {
        id: `img-${product.id}-custom-lab`,
        productId: product.id,
        url: generatedUrl,
        altText: `${product.name} — Certified Laboratory Reference Standard`,
        sortOrder: 0,
        isPrimary: true,
      },
    ],
  };
}

export const ALL_CATALOGUE_PRODUCTS: Product[] = [...WOOCOMMERCE_PRODUCTS, ...EXTRA_PRODUCTS]
  .filter((product) => !REMOVED_PRODUCT_SLUGS.has(product.slug))
  .map(applyShopCategory)
  .map(withCatalogueImages);
