export interface WcPrice {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: { min_amount: string; max_amount: string } | null;
  currency_code: string;
  currency_minor_unit: number;
}

export interface WcImage {
  id: number;
  src: string;
  thumbnail?: string;
  name?: string;
  alt?: string;
}

export interface WcVariationSummary {
  id: number;
  attributes?: Array<{ name: string; value: string }>;
}

export interface WcProduct {
  id: number;
  name: string;
  slug: string;
  parent: number;
  type: 'simple' | 'variable' | 'variation' | string;
  variation?: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  prices: WcPrice;
  images: WcImage[];
  categories?: Array<{ id: number; name: string; slug: string }>;
  attributes?: Array<{
    name: string;
    has_variations?: boolean;
    terms?: Array<{ name: string; slug: string }>;
  }>;
  variations?: WcVariationSummary[];
  is_purchasable: boolean;
  is_in_stock: boolean;
  is_on_backorder: boolean;
  stock_availability?: { text: string; class: string };
  add_to_cart?: {
    text: string;
    maximum?: number;
    minimum?: number;
  };
}

export interface ExistingRecord {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  extraKind: 'nasal' | 'reagent' | 'equipment' | null;
}

export interface MappedImage {
  sourceUrl: string;
  localPath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface SyncReportRow {
  wooId: number;
  name: string;
  slug: string;
  type: string;
  prices: number[];
  stock: number[];
  imageCount: number;
  matchId: string | 'NEW';
  matchName?: string;
  complianceWarnings: string[];
}
