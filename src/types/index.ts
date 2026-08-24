/**
 * Research Peptides UK — Core Type System & Domain Entities
 * Strictly modelled for laboratory/research e-commerce architecture.
 * Server-authoritative state machine, payment isolation, and immutable snapshots.
 */

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'ANALYST';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  vatNumber?: string;
  phone?: string;
  createdAt: string;
}

export type ProductStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type ProductVisibility = 'PUBLIC' | 'UNLISTED' | 'ADMIN_ONLY';
export type ResearchClassification =
  | 'IN_VITRO_ONLY'
  | 'ANALYTICAL_STANDARD'
  | 'BIOCHEMICAL_REAGENT'
  | 'REFERENCE_MATERIAL';

export type DocumentationStatus = 'NO_DOCUMENTATION' | 'PENDING' | 'AVAILABLE' | 'VERIFIED';
export type AnalyticalDataSource = 'VERIFIED' | 'DOCUMENTED' | 'DEMO' | 'UNAVAILABLE';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingTier {
  id: string;
  variantId?: string;
  productId?: string;
  minQuantity: number;
  maxQuantity?: number;
  discountType: DiscountType;
  discountValue: number; // e.g. 10 for 10% off
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "5mg Lyophilized Vial", "10mg Vial", "10x 5mg Multi-Pack"
  size: string; // e.g. "5mg", "10mg", "50mg", "30ml"
  sku: string;
  quantityValue?: number;
  quantityUnit?: string;
  price: number; // in GBP
  compareAtPrice?: number;
  stock: number; // physical stock
  reservedStock?: number; // currently reserved in pending orders
  lowStockThreshold: number;
  status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'ARCHIVED';
  sortOrder?: number;
  purityScore?: number; // e.g. 99.42 (only if documented)
  sequence?: string;
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  pricingTiers?: PricingTier[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  status: 'PENDING' | 'DOCUMENTED' | 'VERIFIED' | 'ARCHIVED';
  testDate?: string;
  expiryDate?: string;
  purityValue?: number;
  certificateRef?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDocument {
  id: string;
  productId: string;
  batchId?: string;
  title: string;
  documentType:
    | 'COA'
    | 'HPLC_SPECTROMETRY'
    | 'MSDS'
    | 'BATCH_ANALYSIS'
    | 'SPEC_SHEET'
    | 'TECHNICAL_DOCUMENT';
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  batchNumber?: string;
  testDate?: string;
  visibility: 'PUBLIC' | 'CUSTOMER_ONLY' | 'ADMIN_ONLY';
  uploadedBy?: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  shortDescription: string;
  longDescription: string;
  productType: string; // 'PEPTIDE', 'SOLVENT', 'BLEND', 'REFERENCE_STANDARD'
  researchClassification: ResearchClassification;
  status: ProductStatus;
  visibility: ProductVisibility;
  isFeatured: boolean;
  researchOnly: boolean;

  // Technical & Analytical Factual Information
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  sequence?: string;
  purityValue?: number;
  manufacturer?: string;
  origin?: string;
  appearance: string;
  storageRequirements: string;
  solubility: string;

  // Documentation Governance
  documentationStatus: DocumentationStatus;
  analyticalDataSource: AnalyticalDataSource;
  createdBy?: string;
  updatedBy?: string;
  publishedBy?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;

  // Optional merchandising controls (admin). Bestseller labels still require sales data.
  merchandising?: ProductMerchandising;

  // Relations
  variants: ProductVariant[];
  images: ProductImage[];
  documents: ProductDocument[];
  batches?: ProductBatch[];
  pricingTiers?: PricingTier[];
}

export interface ProductMerchandising {
  bestsellerPinned?: boolean;
  excludeFromBestsellers?: boolean;
  newArrivalPinned?: boolean;
  hideFromHomepage?: boolean;
  priority?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  size: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  image: string;
  purityScore?: number;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CRYPTOCURRENCY';

// Distinct Order State Machine
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PROCESSING'
  | 'PARTIALLY_FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PAYMENT_EXPIRED';

// Distinct Payment Status
export type PaymentStatus =
  | 'UNPAID'
  | 'AWAITING_CUSTOMER_ACTION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type CryptoNetwork = 'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'USDC_ERC20' | 'ETH';

export interface CryptoPaymentDetails {
  network: CryptoNetwork;
  walletAddress: string;
  cryptoAmount?: string;
  exchangeRateSnapshot?: string;
  expiresAt: string;
}

export interface BankPaymentDetails {
  accountName: string;
  accountNumber: string;
  sortCode: string;
  bankName: string;
  iban?: string;
  bic?: string;
  reference: string;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  amount: number;
  currency: 'GBP' | 'EUR';
  status: PaymentStatus;
  reference: string; // Unique human-readable payment reference (e.g. RP-BK-8941)
  transactionHash?: string; // Crypto tx hash or Faster Payments ref
  evidenceNotes?: string;
  bankDetails?: BankPaymentDetails;
  cryptoDetails?: CryptoPaymentDetails;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressSnapshot {
  fullName: string;
  institution?: string;
  department?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string; // e.g. "GB", "FR", "DE"
  countryName: string;
  phone: string;
  email: string;
}

export type ShippingAddress = AddressSnapshot;

// Immutable Order Item snapshot at time of checkout
export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  variantSku: string;
  size: string;
  quantity: number;
  unitPrice: number;
  tierDiscountAmount: number;
  allocatedCouponDiscountAmount: number;
  allocatedCryptoDiscountAmount: number;
  totalPrice: number;
}

export interface OrderHistoryEvent {
  id: string;
  orderId: string;
  timestamp: string;
  fromStatus?: string;
  toStatus: string;
  actor: string;
  actorRole: UserRole | 'SYSTEM';
  note?: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: 'GBP' | 'EUR';
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'FAILED';
  processedAt?: string;
  processedBy?: string;
  paymentReference?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "RP-2026-8941"
  customerId?: string;
  customerEmail: string;
  customerName: string;
  idempotencyKey?: string;

  // Address Snapshots
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot;

  // Commercial & Financial Snapshot
  items: OrderItem[];
  subtotal: number;
  tierDiscountAmount: number;
  couponCode?: string;
  couponDiscountAmount: number;
  cryptoDiscountAmount: number;
  shippingMethodId: string;
  shippingMethodName: string;
  shippingCarrier: string;
  shippingZone: string;
  shippingFee: number;
  total: number;
  currency: 'GBP' | 'EUR';

  // Distinct State Machines
  status: OrderStatus;
  paymentId: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProofReference?: string;

  // Fulfilment Information
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchNotes?: string;
  dispatchedAt?: string;
  deliveredAt?: string;

  // Cancellation & Refund
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  refunds?: RefundRecord[];

  // Audit & Governance
  history: OrderHistoryEvent[];
  researchConsentSigned: boolean;
  reservationExpiresAt?: string; // Timestamp for inventory reservation auto-expiry
  createdAt: string;
  updatedAt: string;
}

export type ShippingZone =
  | 'UK_MAINLAND'
  | 'UK_HIGHLANDS'
  | 'EUROPE_ZONE_1'
  | 'EUROPE_ZONE_2'
  | 'INTERNATIONAL';

export interface ShippingMethod {
  id: string;
  name: string;
  zone: ShippingZone;
  carrier: string; // e.g. "Royal Mail Tracked 24", "DPD Air", "DHL Express"
  price: number;
  freeShippingThreshold?: number; // e.g. 75.0 for £75.00
  estimatedDays: string;
  trackingAvailable: boolean;
  isActive: boolean;
  sortOrder?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  eligibleCategoryIds?: string[];
  eligibleProductIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  id: string;
  variantId: string;
  orderId?: string;
  transactionType: 'RESERVATION' | 'RELEASE' | 'FULFILLMENT' | 'ADJUSTMENT' | 'RESTOCK';
  quantityChange: number;
  balanceAfter: number;
  notes?: string;
  actorId?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorId?: string;
  action: string;
  entityType:
    | 'PRODUCT'
    | 'VARIANT'
    | 'CATEGORY'
    | 'BATCH'
    | 'DOCUMENT'
    | 'COUPON'
    | 'SHIPPING'
    | 'ORDER'
    | 'PAYMENT'
    | 'INVENTORY'
    | 'SYSTEM';
  entityId: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ImportValidationRow {
  rowNumber: number;
  raw: Record<string, string>;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  productName: string;
  sku: string;
  slug: string;
  category: string;
  variantName: string;
  price: number;
  stock: number;
  errors: string[];
  warnings: string[];
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  createCount: number;
  updateCount: number;
  rows: ImportValidationRow[];
  hasBlockingErrors: boolean;
}

// Notification System Entities
export type NotificationType =
  | 'ORDER_RECEIVED'
  | 'PAYMENT_INSTRUCTIONS'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PROCESSED';

export interface OrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  type: NotificationType;
  subject: string;
  contentSummary: string;
  status: 'QUEUED' | 'SENT' | 'SIMULATED' | 'FAILED';
  dispatchedAt: string;
}

// ---------------------------------------------------------------------------
// Content Management System (CMS) & Store Settings
// ---------------------------------------------------------------------------
export type CMSPageCategory = 'COMPANY' | 'QUALITY' | 'LEGAL' | 'SUPPORT';

export interface CMSPage {
  id: string;
  slug: string; // e.g. 'about', 'quality', 'terms'
  title: string;
  subtitle?: string;
  category: CMSPageCategory;
  lastUpdated: string;
  contentMarkdown: string;
  requiredBusinessInputs: string[]; // e.g. ['[LEGAL_ENTITY_NAME]', '[REGISTERED_OFFICE_ADDRESS]']
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}

export type ApplicationEnvironment = 'DEVELOPMENT' | 'PREVIEW' | 'PRODUCTION';
export type StoreStatus = 'MAINTENANCE' | 'PRIVATE_BETA' | 'LIVE';

export interface StoreSettings {
  storeName: string;
  tagline: string;
  legalEntityName: string;
  registeredOfficeAddress: string;
  companyNumber: string;
  vatNumber: string;
  governingLaw: string;
  primaryEmail: string;
  supportEmail: string;
  privacyEmail: string;
  phone: string;
  primaryDomain: string; // 'https://researchpeptidess.uk'
  currency: 'GBP' | 'EUR';
  environment: ApplicationEnvironment;
  storeStatus: StoreStatus;
  enableAnalyticsWithoutConsent: boolean; // strictly false
  maintenanceMode: boolean;
}

// ---------------------------------------------------------------------------
// Analytics & Consent Management
// ---------------------------------------------------------------------------
export interface CookieConsentPreferences {
  essential: true; // Strictly essential, always true
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export type NewsletterTopic =
  | 'NEW_CATALOGUE'
  | 'RESTOCKS'
  | 'DOCUMENTATION'
  | 'OPERATIONS'
  | 'RESEARCH_RESOURCES'
  | 'PROMOTIONS';

export interface NewsletterSubscription {
  id: string;
  email: string;
  topics: NewsletterTopic[];
  marketingConsent: boolean;
  createdAt: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  consent: boolean;
  createdAt: string;
}

export interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  params: Record<string, unknown>;
  timestamp: string;
  correlationId?: string;
  pageUrl: string;
}

// ---------------------------------------------------------------------------
// Observability & Security Event Logging
// ---------------------------------------------------------------------------
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface ObservabilityLogEntry {
  id: string;
  correlationId: string;
  timestamp: string;
  level: LogLevel;
  route: string;
  operation: string;
  message: string;
  userRole?: UserRole | 'SYSTEM' | 'GUEST';
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Pre-Launch QA & Readiness Matrices
// ---------------------------------------------------------------------------
export type LaunchChecklistCategory =
  | 'INFRASTRUCTURE'
  | 'COMMERCE'
  | 'OPERATIONS'
  | 'CONTENT'
  | 'SECURITY'
  | 'SEO'
  | 'QA';

export interface LaunchChecklistItem {
  id: string;
  category: LaunchChecklistCategory;
  title: string;
  description: string;
  status: 'PASSED' | 'PENDING' | 'MANUAL_VERIFICATION_REQUIRED';
  requirement: string;
  notes?: string;
  verifiedAt?: string;
}

export interface QATestAssertion {
  id: string;
  section: string;
  title: string;
  description: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface QASuiteResult {
  suiteId: string;
  suiteName: string;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  durationMs: number;
  assertions: QATestAssertion[];
}

