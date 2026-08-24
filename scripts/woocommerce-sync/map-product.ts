import type { Product, ProductImage, ProductStatus, ProductVariant } from '../../src/types';
import { EXISTING_CATALOG, matchExisting } from './match';
import { extractSpecs, sanitizeProductCopy } from './sanitize-copy';
import type { ExistingRecord, MappedImage, SyncReportRow, WcProduct } from './wc-types';

const CATEGORY_NAMES: Record<string, string> = {
  'cat-peptides': 'Peptides & Analytical Standards',
  'cat-sequences': 'Biochemical Sequences & Blends',
  'cat-nasal': 'Analytical Nasal & Solution Sprays',
  'cat-reagents': 'Analytical Solvents & Media',
  'cat-equipment': 'Laboratory Consumables & Filtration',
};

export interface MappedProduct {
  product: Product;
  sourceImages: MappedImage[];
  match: ExistingRecord | null;
  warnings: string[];
  wooId: number;
}

function minorToPounds(value: string | number | undefined): number {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.round(raw) / 100;
}

function parseStock(product: WcProduct): number {
  const maximum = product.add_to_cart?.maximum;
  if (typeof maximum === 'number' && maximum > 0 && maximum < 9999) return maximum;
  const text = product.stock_availability?.text || '';
  const counted = text.match(/(\d+)\s+in stock/i);
  if (counted) return Number(counted[1]);
  if (!product.is_in_stock) return 0;
  return 40;
}

function parseSize(name: string, variationLabel = ''): { size: string; quantityValue?: number; quantityUnit: string } {
  const hay = `${variationLabel} ${name}`;
  const match = hay.match(/(\d+(?:\.\d+)?)\s?(mg|mcg|iu|ml|g)\b/i);
  if (match) {
    return {
      size: `${match[1]}${match[2].toLowerCase()}`,
      quantityValue: Number(match[1]),
      quantityUnit: match[2].toLowerCase(),
    };
  }
  const tablets = hay.match(/(\d+)\s+tablets?/i);
  if (tablets) {
    return { size: `${tablets[1]} tablets`, quantityValue: Number(tablets[1]), quantityUnit: 'tablets' };
  }
  return { size: variationLabel || 'Standard', quantityUnit: 'mg' };
}

function joinSku(parentSku: string, sizeToken: string): string {
  const full = `${parentSku}-${sizeToken}`;
  if (full.length <= 48) return full;
  const keep = Math.max(8, 48 - sizeToken.length - 1);
  return `${parentSku.slice(0, keep)}-${sizeToken}`;
}

function skuFrom(slug: string, size?: string): string {
  const base = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const sizeToken = size ? size.toUpperCase().replace(/[^A-Z0-9]+/g, '') : '';
  const sizeBit = sizeToken && !base.includes(sizeToken) ? `-${sizeToken}` : '';
  const sku = `RPUK-${base}${sizeBit}`;
  if (sku.length <= 48) return sku;
  const maxBase = Math.max(12, 48 - 'RPUK-'.length - sizeBit.length);
  return `RPUK-${base.slice(0, maxBase)}${sizeBit}`;
}

function classifyCategory(name: string, slug: string, wcCategories: string[]): string {
  const hay = `${name} ${slug} ${wcCategories.join(' ')}`.toLowerCase();
  if (hay.includes('nasal') || hay.includes('spray')) return 'cat-nasal';
  if (
    hay.includes('bacteriostatic') ||
    hay.includes('water') ||
    hay.includes('saline') ||
    hay.includes('solvent')
  ) {
    return 'cat-reagents';
  }
  if (hay.includes('syringe') || hay.includes('filter') || hay.includes('vial pack')) return 'cat-equipment';
  if (hay.includes('blend') || hay.includes('|') || hay.includes(' + ')) return 'cat-sequences';
  return 'cat-peptides';
}

function productTypeFor(categoryId: string, name: string): string {
  if (categoryId === 'cat-reagents') return 'SOLVENT';
  if (categoryId === 'cat-sequences' || /blend|\+| \| /i.test(name)) return 'BLEND';
  if (categoryId === 'cat-nasal') return 'PEPTIDE';
  if (categoryId === 'cat-equipment') return 'EQUIPMENT';
  return 'PEPTIDE';
}

function imageIdentity(url: string): string {
  const base = (url.split('?')[0].split('/').pop() || '').toLowerCase();
  return base.replace(/-scaled/g, '').replace(/-\d+x\d+/g, '').replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
}

export function collectSourceImages(product: WcProduct, extra: WcProduct[] = []): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const image of [...product.images, ...extra.flatMap((item) => item.images || [])]) {
    if (!image?.src) continue;
    const id = imageIdentity(image.src);
    if (seen.has(id)) continue;
    seen.add(id);
    urls.push(image.src);
  }
  return urls;
}

function variantFromWc(
  productId: string,
  parentSku: string,
  parentSlug: string,
  source: WcProduct,
  index: number,
  label: string
): ProductVariant {
  const parsed = parseSize(source.name, label || source.variation || '');
  const stock = parseStock(source);
  const price = minorToPounds(source.prices?.price);
  const compare = minorToPounds(source.prices?.regular_price);
  const sizeToken = parsed.size.toUpperCase().replace(/[^A-Z0-9]+/g, '') || `VAR${index + 1}`;
  const generated = joinSku(parentSku, sizeToken);
  const sku = source.sku?.trim() ? source.sku.trim().toUpperCase() : generated;
  const isLiquid = parsed.quantityUnit === 'ml' || /water|solvent|saline/i.test(`${source.name} ${parentSlug}`);
  const formLabel = isLiquid ? 'Laboratory Vial' : 'Lyophilized Vial';
  return {
    id: `var-${productId.replace(/^prod-/, '')}-${index + 1}`,
    productId,
    name: label ? `${label} ${formLabel}` : parsed.size === 'Standard' ? source.name : `${parsed.size} ${formLabel}`,
    size: parsed.size,
    sku: sku === parentSku ? `${sku}-${sizeToken}`.slice(0, 48) : sku,
    quantityValue: parsed.quantityValue,
    quantityUnit: parsed.quantityUnit,
    price: price || compare || 0.01,
    compareAtPrice: compare > price ? compare : undefined,
    stock,
    reservedStock: 0,
    lowStockThreshold: 5,
    status: stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    sortOrder: index,
  };
}

export function mapWcProduct(
  detail: WcProduct,
  variationDetails: WcProduct[],
  usedIds: Set<string>
): MappedProduct {
  const match = matchExisting(detail.name, detail.slug, usedIds);
  if (match) usedIds.add(match.id);

  const productId = match?.id ?? `prod-wc-${detail.id}`;
  const copy = sanitizeProductCopy(detail.description, detail.short_description);
  const specs = extractSpecs(copy.longDescription);
  const categoryId = classifyCategory(
    detail.name,
    detail.slug,
    (detail.categories || []).map((item) => item.name)
  );

  const variants: ProductVariant[] =
    variationDetails.length > 0
      ? variationDetails.map((variation, index) => {
          const attr = variation.variation || variation.attributes?.[0]?.value || variation.name;
          return variantFromWc(productId, match?.sku ?? skuFrom(detail.slug), detail.slug, variation, index, attr);
        })
      : [variantFromWc(productId, match?.sku ?? skuFrom(detail.slug), detail.slug, detail, 0, '')];

  const inStock = variants.some((item) => item.stock > 0);
  let status: ProductStatus = 'PUBLISHED';
  if (!detail.is_purchasable && !inStock) status = 'OUT_OF_STOCK';
  if (!inStock) status = 'OUT_OF_STOCK';

  const sourceUrls = collectSourceImages(detail, variationDetails);
  const images: ProductImage[] = sourceUrls.map((url, index) => ({
    id: `img-${productId}-${index + 1}`,
    productId,
    url,
    altText: detail.images[index]?.alt || `${detail.name} laboratory photograph`,
    sortOrder: index,
    isPrimary: index === 0,
  }));

  const now = new Date().toISOString();
  const product: Product = {
    id: productId,
    name: detail.name.replace(/\s+/g, ' ').trim(),
    slug: detail.slug,
    sku: match?.sku ?? skuFrom(detail.slug),
    categoryId,
    categoryName: CATEGORY_NAMES[categoryId],
    shortDescription: copy.shortDescription || `${detail.name} research-grade laboratory compound.`,
    longDescription: copy.longDescription || copy.shortDescription,
    productType: productTypeFor(categoryId, detail.name),
    researchClassification: categoryId === 'cat-reagents' ? 'BIOCHEMICAL_REAGENT' : 'IN_VITRO_ONLY',
    status,
    visibility: 'PUBLIC',
    isFeatured: Boolean(match) && ['prod-bpc157', 'prod-tb500', 'prod-ghk-cu', 'prod-glow-blend', 'prod-klow-blend', 'prod-tesamorelin'].includes(productId),
    researchOnly: true,
    casNumber: specs.casNumber,
    molecularFormula: specs.molecularFormula,
    molecularWeight: specs.molecularWeight,
    sequence: specs.sequence,
    purityValue: specs.purityValue,
    manufacturer: 'Research Peptides UK Laboratory Services',
    origin: 'United Kingdom',
    appearance:
      specs.appearance ||
      (categoryId === 'cat-reagents'
        ? 'Clear, Colourless Liquid in Crimp-Sealed Glass Vial'
        : 'Lyophilized White Powder'),
    storageRequirements:
      specs.storageRequirements ||
      (categoryId === 'cat-reagents'
        ? 'Store sealed at ambient laboratory temperature, protected from light'
        : 'Store sealed at -20°C in desiccated laboratory freezer'),
    solubility:
      specs.solubility ||
      (categoryId === 'cat-reagents'
        ? 'Ready-to-use sterile laboratory solvent'
        : 'Sterile Water / Bacteriostatic Laboratory Solvent'),
    documentationStatus: specs.purityValue ? 'AVAILABLE' : 'PENDING',
    analyticalDataSource: specs.purityValue ? 'DOCUMENTED' : 'UNAVAILABLE',
    createdBy: 'woocommerce-sync',
    updatedBy: 'woocommerce-sync',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    variants,
    images,
    documents: [],
  };

  const sourceImages: MappedImage[] = sourceUrls.map((url, index) => ({
    sourceUrl: url,
    localPath: '',
    publicUrl: url,
    altText: images[index].altText,
    sortOrder: index,
    isPrimary: index === 0,
  }));

  return { product, sourceImages, match, warnings: copy.warnings, wooId: detail.id };
}

export function extrasToKeep(matchedIds: Set<string>): ExistingRecord[] {
  return EXISTING_CATALOG.filter((row) => {
    if (row.extraKind === 'nasal' || row.extraKind === 'equipment') return true;
    if (row.extraKind === 'reagent') return !matchedIds.has(row.id);
    return false;
  });
}

export function toReportRow(mapped: MappedProduct): SyncReportRow {
  return {
    wooId: mapped.wooId,
    name: mapped.product.name,
    slug: mapped.product.slug,
    type: mapped.product.variants.length > 1 ? 'variable' : 'simple',
    prices: mapped.product.variants.map((item) => item.price),
    stock: mapped.product.variants.map((item) => item.stock),
    imageCount: mapped.sourceImages.length,
    matchId: mapped.match?.id ?? 'NEW',
    matchName: mapped.match?.name,
    complianceWarnings: mapped.warnings,
  };
}
