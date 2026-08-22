import { Product } from '../../types';
import { PRODUCTS_PEPTIDES_PART1 } from './products-peptides-1';
import { PRODUCTS_PEPTIDES_PART2 } from './products-peptides-2';
import { PRODUCTS_PEPTIDES_PART3 } from './products-peptides-3';
import { PRODUCTS_BLENDS } from './products-blends';
import { PRODUCTS_NASAL } from './products-nasal';
import { PRODUCTS_REAGENTS, PRODUCTS_EQUIPMENT } from './products-reagents-equipment';
import { getProductImage } from '../product-image-generator';

const RAW_PRODUCTS: Product[] = [
  ...PRODUCTS_PEPTIDES_PART1,
  ...PRODUCTS_PEPTIDES_PART2,
  ...PRODUCTS_PEPTIDES_PART3,
  ...PRODUCTS_BLENDS,
  ...PRODUCTS_NASAL,
  ...PRODUCTS_REAGENTS,
  ...PRODUCTS_EQUIPMENT,
];

export const ALL_CATALOGUE_PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => {
  const customImgUrl = getProductImage(p);
  return {
    ...p,
    images: [
      {
        id: `img-${p.id}-custom-lab`,
        productId: p.id,
        url: customImgUrl,
        altText: `${p.name} — Certified Laboratory Reference Standard`,
        sortOrder: 0,
        isPrimary: true,
      },
      ...(p.images || [])
        .filter((img) => !img.url.includes('unsplash.com/photo-1584308666744'))
        .map((img, i) => ({
          ...img,
          isPrimary: false,
          sortOrder: i + 1,
        })),
    ],
  };
});
