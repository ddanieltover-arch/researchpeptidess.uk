/**
 * Research Peptides UK — Drizzle ORM Relational PostgreSQL Database Schema
 * Compatible with Neon Serverless Postgres.
 * Strictly adheres to laboratory/in-vitro e-commerce & catalogue specifications.
 */

import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'ADMIN', 'ANALYST']);
export const productStatusEnum = pgEnum('product_status', [
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'OUT_OF_STOCK',
  'ARCHIVED',
]);
export const productVisibilityEnum = pgEnum('product_visibility', ['PUBLIC', 'UNLISTED', 'ADMIN_ONLY']);
export const researchClassificationEnum = pgEnum('research_classification', [
  'IN_VITRO_ONLY',
  'ANALYTICAL_STANDARD',
  'BIOCHEMICAL_REAGENT',
  'REFERENCE_MATERIAL',
]);
export const documentTypeEnum = pgEnum('document_type', [
  'COA',
  'HPLC_SPECTROMETRY',
  'MSDS',
  'BATCH_ANALYSIS',
  'SPEC_SHEET',
  'TECHNICAL_DOCUMENT',
]);
export const documentationStatusEnum = pgEnum('documentation_status', [
  'NO_DOCUMENTATION',
  'PENDING',
  'AVAILABLE',
  'VERIFIED',
]);
export const analyticalDataSourceEnum = pgEnum('analytical_data_source', [
  'VERIFIED',
  'DOCUMENTED',
  'DEMO',
  'UNAVAILABLE',
]);
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE']);
export const paymentMethodEnum = pgEnum('payment_method', ['BANK_TRANSFER', 'CRYPTOCURRENCY']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'payment_submitted',
  'payment_verified',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);
export const inventoryTransactionTypeEnum = pgEnum('inventory_transaction_type', [
  'RESERVATION',
  'RELEASE',
  'FULFILLMENT',
  'ADJUSTMENT',
  'RESTOCK',
]);

// 1. Users Table
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').default('CUSTOMER').notNull(),
    institution: text('institution'),
    vatNumber: text('vat_number'),
    phone: text('phone'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
);

// 2. Categories Table
export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
    index('categories_sort_order_idx').on(table.sortOrder),
  ]
);

// 3. Products Table
export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sku: text('sku').notNull().unique(),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
    shortDescription: text('short_description').notNull(),
    longDescription: text('long_description').notNull(),
    productType: text('product_type').default('PEPTIDE').notNull(), // 'PEPTIDE', 'SOLVENT', 'BLEND', 'REFERENCE_STANDARD'
    status: productStatusEnum('status').default('DRAFT').notNull(),
    visibility: productVisibilityEnum('visibility').default('PUBLIC').notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    researchOnly: boolean('research_only').default(true).notNull(),
    researchClassification: researchClassificationEnum('research_classification')
      .default('IN_VITRO_ONLY')
      .notNull(),
    
    // Technical & Laboratory Attributes (Nullable when not available)
    casNumber: text('cas_number'),
    molecularFormula: text('molecular_formula'),
    molecularWeight: numeric('molecular_weight', { precision: 10, scale: 3 }),
    sequence: text('sequence'),
    purityValue: numeric('purity_value', { precision: 5, scale: 2 }), // only if verified by document
    manufacturer: text('manufacturer'),
    origin: text('origin'),
    appearance: text('appearance').default('Lyophilized White Powder'),
    storageRequirements: text('storage_requirements').default('Store sealed at -20°C in desiccated laboratory freezer'),
    solubility: text('solubility').default('Sterile Water / Bacteriostatic Laboratory Solvent'),

    // Governance & Metadata
    documentationStatus: documentationStatusEnum('documentation_status').default('NO_DOCUMENTATION').notNull(),
    analyticalDataSource: analyticalDataSourceEnum('analytical_data_source').default('UNAVAILABLE').notNull(),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    publishedBy: text('published_by'),
    archivedBy: text('archived_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    publishedAt: timestamp('published_at'),
    archivedAt: timestamp('archived_at'),
  },
  (table) => [
    index('products_category_idx').on(table.categoryId),
    index('products_status_idx').on(table.status),
    index('products_cas_idx').on(table.casNumber),
    uniqueIndex('products_slug_idx').on(table.slug),
    uniqueIndex('products_sku_idx').on(table.sku),
  ]
);

// 4. Product Variants Table
export const productVariants = pgTable(
  'product_variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(), // e.g. "5mg Lyophilized Vial"
    size: text('size').notNull(), // e.g. "5mg", "10mg", "30ml"
    sku: text('sku').notNull().unique(),
    quantityValue: numeric('quantity_value', { precision: 8, scale: 2 }),
    quantityUnit: text('quantity_unit').default('mg').notNull(),
    pricePence: integer('price_pence').notNull(), // Smallest currency unit (pence)
    compareAtPricePence: integer('compare_at_price_pence'),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    reservedQuantity: integer('reserved_quantity').default(0).notNull(),
    lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
    status: text('status').default('ACTIVE').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    purityScore: numeric('purity_score', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('variants_product_id_idx').on(table.productId),
    uniqueIndex('variants_sku_idx').on(table.sku),
  ]
);

// 5. Product Batches Table (Traceability & Analytical Governance)
export const batches = pgTable(
  'batches',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    batchNumber: text('batch_number').notNull(),
    status: text('status').default('PENDING').notNull(), // 'PENDING', 'DOCUMENTED', 'VERIFIED', 'ARCHIVED'
    testDate: text('test_date'),
    expiryDate: text('expiry_date'),
    purityValue: numeric('purity_value', { precision: 5, scale: 2 }),
    certificateRef: text('certificate_ref'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('batches_product_id_idx').on(table.productId),
    uniqueIndex('batches_number_idx').on(table.batchNumber),
  ]
);

// 6. Pricing Tiers Table (Quantity Bulk Rules)
export const pricingTiers = pgTable(
  'pricing_tiers',
  {
    id: text('id').primaryKey(),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
    minQuantity: integer('min_quantity').notNull(),
    maxQuantity: integer('max_quantity'),
    discountType: discountTypeEnum('discount_type').default('PERCENTAGE').notNull(),
    discountValue: numeric('discount_value', { precision: 6, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('pricing_tiers_variant_idx').on(table.variantId),
    index('pricing_tiers_product_idx').on(table.productId),
  ]
);

// 7. Product Images Table
export const productImages = pgTable(
  'product_images',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    url: text('url').notNull(),
    altText: text('alt_text').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('product_images_product_idx').on(table.productId),
  ]
);

// 8. Product Documents Table (COAs / HPLC / Spectrometry / MSDS)
export const productDocuments = pgTable(
  'product_documents',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    batchId: text('batch_id').references(() => batches.id, { onDelete: 'set null' }),
    documentType: documentTypeEnum('document_type').notNull(),
    title: text('title').notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name'),
    mimeType: text('mime_type').default('application/pdf'),
    batchNumber: text('batch_number'),
    testDate: text('test_date'),
    visibility: text('visibility').default('PUBLIC').notNull(), // 'PUBLIC', 'CUSTOMER_ONLY', 'ADMIN_ONLY'
    uploadedBy: text('uploaded_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('product_documents_product_idx').on(table.productId),
    index('product_documents_batch_idx').on(table.batchId),
  ]
);

// 9. Coupons Table (Server-Authoritative Discounts)
export const coupons = pgTable(
  'coupons',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    description: text('description'),
    discountType: discountTypeEnum('discount_type').default('PERCENTAGE').notNull(),
    discountValue: numeric('discount_value', { precision: 6, scale: 2 }).notNull(),
    minOrderValuePence: integer('min_order_value_pence').default(0).notNull(),
    maxDiscountPence: integer('max_discount_pence'),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0).notNull(),
    perUserLimit: integer('per_user_limit').default(1),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    isActive: boolean('is_active').default(true).notNull(),
    eligibleCategoryIds: text('eligible_category_ids'), // JSON array of IDs
    eligibleProductIds: text('eligible_product_ids'), // JSON array of IDs
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('coupons_code_idx').on(table.code),
  ]
);

// 10. Shipping Methods Table (Configurable Rates & Thresholds)
export const shippingMethods = pgTable(
  'shipping_methods',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    zone: text('zone').notNull(), // 'UK_MAINLAND', 'UK_HIGHLANDS', 'EUROPE_ZONE_1', 'EUROPE_ZONE_2'
    carrier: text('carrier').notNull(), // e.g. "Royal Mail", "DPD", "DHL Express"
    pricePence: integer('price_pence').notNull(),
    freeShippingThresholdPence: integer('free_shipping_threshold_pence'), // e.g. 7500 for £75.00
    estimatedDays: text('estimated_days').notNull(),
    trackingAvailable: boolean('tracking_available').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// 11. Inventory Transactions Table (Ledger & Auditability)
export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: text('id').primaryKey(),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(),
    orderId: text('order_id'),
    transactionType: inventoryTransactionTypeEnum('transaction_type').notNull(),
    quantityChange: integer('quantity_change').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    notes: text('notes'),
    actorId: text('actor_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('inventory_trans_variant_idx').on(table.variantId),
    index('inventory_trans_order_idx').on(table.orderId),
  ]
);

// 12. Orders Table
export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name').notNull(),
    
    // Server-Authoritative Financial Snapshot
    subtotalPence: integer('subtotal_pence').notNull(),
    tierDiscountPence: integer('tier_discount_pence').default(0).notNull(),
    couponCode: text('coupon_code'),
    couponDiscountPence: integer('coupon_discount_pence').default(0).notNull(),
    cryptoDiscountPence: integer('crypto_discount_pence').default(0).notNull(),
    shippingMethodId: text('shipping_method_id'),
    shippingPence: integer('shipping_pence').notNull(),
    totalPence: integer('total_pence').notNull(),
    currency: text('currency').default('GBP').notNull(),
    
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: orderStatusEnum('status').default('pending_payment').notNull(),
    paymentProofReference: text('payment_proof_reference'),
    trackingNumber: text('tracking_number'),
    researchConsentSigned: boolean('research_consent_signed').default(true).notNull(),
    shippingAddressJson: text('shipping_address_json').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    uniqueIndex('orders_order_number_idx').on(table.orderNumber),
  ]
);

// 13. Order Items Table
export const orderItems = pgTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: text('product_id').notNull(),
    variantId: text('variant_id').notNull(),
    sku: text('sku').notNull(),
    productName: text('product_name').notNull(),
    variantName: text('variant_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPricePence: integer('unit_price_pence').notNull(),
    totalPricePence: integer('total_price_pence').notNull(),
  },
  (table) => [
    index('order_items_order_idx').on(table.orderId),
  ]
);

// 14. Audit Logs Table
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actor: text('actor').notNull(),
    actorId: text('actor_id'),
    action: text('action').notNull(), // 'PRODUCT_CREATED', 'PRICE_CHANGED', 'STOCK_ADJUSTED', etc.
    entityType: text('entity_type').notNull(), // 'PRODUCT', 'VARIANT', 'BATCH', 'COUPON', 'ORDER'
    entityId: text('entity_id').notNull(),
    payloadJson: text('payload_json'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ]
);

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  batches: many(batches),
  images: many(productImages),
  documents: many(productDocuments),
  pricingTiers: many(pricingTiers),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  pricingTiers: many(pricingTiers),
  inventoryTransactions: many(inventoryTransactions),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
  documents: many(productDocuments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));
