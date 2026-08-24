export interface MerchandisingRecord {
  productId: string;
  featured: boolean;
  bestsellerOverride: boolean;
  bestsellerExcluded: boolean;
  newArrivalOverride: boolean;
  hideFromHomepage: boolean;
  merchandisingPriority: number;
  merchandisingUpdatedAt?: string;
  merchandisingUpdatedBy?: string | null;
}
