import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  ProductCategory,
  ProductVariant,
  CartItem,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  OrderItem,
  AddressSnapshot,
  OrderHistoryEvent,
  RefundRecord,
  OrderNotification,
  User,
  UserRole,
  PaymentMethod,
  ShippingMethod,
  Coupon,
  ProductBatch,
  ProductDocument,
  AuditLogEntry,
  ProductStatus,
  ImportSummary,
  InventoryTransaction,
  CMSPage,
  StoreSettings,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SHIPPING_METHODS,
  INITIAL_COUPONS,
  INITIAL_AUDIT_LOGS,
} from '../lib/mock-data';
import { applyMerchandisingOverlay, isPublicCatalogueProduct } from '../lib/merchandising';
import {
  fetchAdminCommerce,
  fetchAccountOrders,
  fetchBootstrap,
  persistInventoryRequest,
  persistMerchandising,
  persistAdminOrderRequest,
  persistOrderRequest,
  persistPaymentRequest,
  persistShippingRequest,
  persistStoreSettingsRequest,
} from '../lib/persistence-api';
import { MerchandisingRecord } from '../lib/merchandising-persistence';
import { INITIAL_CMS_PAGES, DEFAULT_STORE_SETTINGS } from '../lib/cms-data';
import { withCanonicalStoreContactEmails } from '../lib/store-contact';
import {
  getBankSettlementInstructions,
  getCryptoSettlementInstructions,
  normalizePaymentProofReference,
  PublicSettlementSnapshot,
  UNCONFIGURED_SETTLEMENT,
} from '../lib/settlement-instructions';
import { DEMO_USERS, GUEST_USER, hasPermission } from '../lib/auth';
import { fetchAdminSession, loginAdmin, logoutAdmin } from '../lib/admin-api';
import { AdminSessionUser } from '../lib/admin-session';
import { fetchCustomerSession, loginCustomer, logoutCustomer, registerCustomer as registerCustomerRequest } from '../lib/customer-api';
import { CustomerSessionUser } from '../lib/customer-session';
import {
  BANK_TRANSFER_MIN_MERCHANDISE_TOTAL,
  calculateOrderTotals,
  isBankTransferAvailable,
  merchandiseTotalForPayment,
  OrderCalculationResult,
} from '../lib/pricing';
import { checkVariantStockAvailability, recordInventoryTransaction } from '../lib/inventory';
import { executeCatalogueImport, exportCatalogueToCsv } from '../lib/catalogue-import';
import { validateOrderTransition, validatePaymentTransition } from '../lib/order-state-machine';
import {
  calculateEligibleShippingMethods,
  RESEARCH_DESTINATION_COUNTRIES,
  CountryInfo,
  ShippingCalculationResult,
} from '../lib/shipping-engine';
import { createOrderNotification } from '../lib/notifications';
import { runAllCommerceTests, TestSuiteReport } from '../lib/commerce-tests';
import {
  canonicalizeLocation,
  getBrowserHref,
  parseAppPath,
  productPath,
  readBrowserLocation,
  type NavigateOptions,
} from '../lib/routing';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface StoreContextType {
  // Navigation & Routing
  currentPath: string;
  navigate: (path: string, options?: NavigateOptions) => void;

  // Catalog (Public vs Admin Draft Preview)
  products: Product[];
  publishedProducts: Product[]; // Publicly accessible products
  categories: ProductCategory[];
  activeCategories: ProductCategory[];
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProductSlug: string | null;
  selectProductBySlug: (slug: string) => void;
  adminDraftPreviewMode: boolean;
  setAdminDraftPreviewMode: (enabled: boolean) => void;

  // Product CRUD & Lifecycle (Admin)
  createProduct: (productData: Partial<Product>) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  saveProductMerchandising: (
    productId: string,
    patch: Partial<MerchandisingRecord>
  ) => Promise<boolean>;
  setProductStatus: (productId: string, newStatus: ProductStatus) => void;
  deleteProduct: (productId: string) => void;
  bulkUpdateProductStatus: (productIds: string[], newStatus: ProductStatus) => void;
  bulkUpdateProductCategory: (productIds: string[], categoryId: string) => void;

  // Variant & Inventory Management
  inventoryTransactions: InventoryTransaction[];
  updateVariantStock: (variantId: string, newStock: number, reason?: string) => void;
  adjustVariantStock: (variantId: string, newStock: number, reason: string) => boolean;
  updateVariantPrice: (variantId: string, newPrice: number, comparePrice?: number) => void;
  sweepExpiredReservations: () => number;

  // Category Management (Admin)
  createCategory: (cat: Partial<ProductCategory>) => void;
  updateCategory: (id: string, updates: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  // Batches & Documents Management (Admin)
  batches: ProductBatch[];
  createBatch: (batch: Partial<ProductBatch>) => void;
  updateBatch: (id: string, updates: Partial<ProductBatch>) => void;
  addDocument: (doc: Partial<ProductDocument>) => void;
  deleteDocument: (id: string) => void;

  // Shipping Methods & Destination Engine
  shippingMethods: ShippingMethod[];
  destinationCountryCode: string;
  setDestinationCountryCode: (code: string) => void;
  eligibleShippingCalculation: ShippingCalculationResult;
  selectedShippingMethodId: string;
  setSelectedShippingMethodId: (id: string) => void;
  updateShippingMethod: (id: string, updates: Partial<ShippingMethod>) => void;

  // Coupons & Promotions
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  createCoupon: (coupon: Partial<Coupon>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;

  // Cart & Calculations
  cart: CartItem[];
  addToCart: (product: Product, variantId: string, quantity?: number) => boolean;
  updateCartQuantity: (variantId: string, delta: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  cartTotals: OrderCalculationResult;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  settlement: PublicSettlementSnapshot;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // Localization
  currency: 'GBP' | 'EUR';
  setCurrency: (c: 'GBP' | 'EUR') => void;

  // Auth & Roles
  currentUser: User;
  setUserRole: (role: UserRole) => void;
  authReady: boolean;
  isAdminAuthenticated: boolean;
  isCustomerAuthenticated: boolean;
  isAccountAuthenticated: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ user: AdminSessionUser } | { error: string }>;
  signOutAdmin: () => Promise<void>;
  signInCustomer: (email: string, password: string) => Promise<{ user: CustomerSessionUser } | { error: string }>;
  registerCustomer: (input: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }) => Promise<{ user: CustomerSessionUser } | { error: string }>;
  signOutCustomer: () => Promise<void>;

  // Orders & Payment Operations
  orders: Order[];
  payments: Payment[];
  notifications: OrderNotification[];
  createOrder: (orderData: {
    customerEmail?: string;
    customerName?: string;
    shippingAddress: AddressSnapshot;
    paymentMethod: PaymentMethod;
    paymentProofReference?: string;
  }) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    options?: { trackingNumber?: string; courier?: string; note?: string; overrideJustification?: string }
  ) => boolean;
  submitPaymentEvidence: (orderId: string, referenceOrTxHash: string, notes?: string) => boolean;
  verifyPayment: (orderId: string, paymentId?: string, notes?: string) => boolean;
  rejectPayment: (orderId: string, reason: string, notes?: string) => boolean;
  processRefund: (orderId: string, amount: number, reason: string) => boolean;
  cancelOrder: (orderId: string, reason?: string) => boolean;

  // Automated Test Suite Runner
  testSuiteReport: TestSuiteReport | null;
  runCommerceTestSuite: () => TestSuiteReport;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logAuditEvent: (
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    payload?: Record<string, unknown>
  ) => void;

  // Import / Export
  importCatalogue: (summary: ImportSummary) => { count: number };
  exportCatalogue: () => string;

  // Compliance & Disclaimers
  hasAcknowledgedResearchOnly: boolean;
  acknowledgeResearchOnly: () => void;
  complianceModalOpen: boolean;
  setComplianceModalOpen: (open: boolean) => void;

  // Content Management & Store Settings
  cmsPages: CMSPage[];
  updateCmsPage: (slug: string, updates: Partial<CMSPage>) => void;
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => Promise<boolean>;

  // Toast System
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function getBootRoute() {
  if (typeof window === 'undefined') {
    return { href: '/', productSlug: null as string | null, categorySlug: null as string | null, search: '' };
  }
  const { href } = canonicalizeLocation(readBrowserLocation());
  const parsed = parseAppPath(href);
  return {
    href: parsed.href,
    productSlug: parsed.kind === 'product' ? parsed.slug ?? null : null,
    categorySlug: parsed.kind === 'category' ? parsed.slug ?? null : null,
    search: parsed.query.q ?? '',
  };
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bootRoute] = useState(getBootRoute);

  // Routing State
  const [currentPath, setCurrentPath] = useState<string>(bootRoute.href);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(bootRoute.productSlug);
  const [adminDraftPreviewMode, setAdminDraftPreviewMode] = useState<boolean>(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(INITIAL_SHIPPING_METHODS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [testSuiteReport, setTestSuiteReport] = useState<TestSuiteReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [batches, setBatches] = useState<ProductBatch[]>(
    INITIAL_PRODUCTS.flatMap((p) => p.batches || [])
  );

  // Selected State
  const [destinationCountryCode, setDestinationCountryCode] = useState<string>('GB');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(bootRoute.categorySlug);
  const [searchQuery, setSearchQuery] = useState<string>(bootRoute.search);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>(
    INITIAL_SHIPPING_METHODS[0]?.id || 'ship-uk-standard'
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [settlement, setSettlement] = useState<PublicSettlementSnapshot>(UNCONFIGURED_SETTLEMENT);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  // Cart & UI State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currency, setCurrency] = useState<'GBP' | 'EUR'>('GBP');
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [adminSession, setAdminSession] = useState<AdminSessionUser | null>(null);
  const [customerSession, setCustomerSession] = useState<CustomerSessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // CMS & Store Settings State
  const [cmsPages, setCmsPages] = useState<CMSPage[]>(INITIAL_CMS_PAGES);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const updateCmsPage = (slug: string, updates: Partial<CMSPage>) => {
    setCmsPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : p))
    );
    logAuditEvent('CMS_PAGE_UPDATED', 'SYSTEM', slug, { updates });
    addToast('success', 'Page Saved', `Updated content for /${slug}.`);
  };

  const updateStoreSettings = async (updates: Partial<StoreSettings>): Promise<boolean> => {
    const next = withCanonicalStoreContactEmails({ ...storeSettings, ...updates });
    const persisted = await persistStoreSettingsRequest(next);
    if (!persisted.ok) {
      addToast(
        'error',
        'Settings not saved',
        persisted.reference
          ? `Store settings could not be stored. Reference: ${persisted.reference}`
          : 'Store settings could not be stored.'
      );
      return false;
    }
    setStoreSettings(next);
    logAuditEvent('STORE_SETTINGS_UPDATED', 'SYSTEM', 'global', { updates });
    addToast('success', 'Store Settings Saved', 'Business configuration and legal parameters updated.');
    return true;
  };

  // Compliance & Feedback
  const [hasAcknowledgedResearchOnly, setHasAcknowledgedResearchOnly] = useState<boolean>(true);
  const [complianceModalOpen, setComplianceModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAuditEvent = (
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    payload?: Record<string, unknown>
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor: currentUser.email,
      actorId: currentUser.id,
      action,
      entityType,
      entityId,
      payload,
      ipAddress: '127.0.0.1 (Session Auth)',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Published filter for public visitors
  const publishedProducts = (products || []).filter((p) => {
    if (adminDraftPreviewMode && currentUser.role === 'ADMIN') return true;
    return isPublicCatalogueProduct(p);
  });

  const activeCategories = (categories || [])
    .filter((c) => c?.isActive)
    .map((category) => ({
      ...category,
      productCount: publishedProducts.filter((product) => product.categoryId === category.id).length,
    }));

  const categoriesWithCounts = (categories || []).map((category) => ({
    ...category,
    productCount: publishedProducts.filter((product) => product.categoryId === category.id).length,
  }));

  const applyParsedRoute = (href: string, options?: NavigateOptions) => {
    const parsed = parseAppPath(href);
    setCurrentPath(parsed.href);
    setSelectedProductSlug(parsed.kind === 'product' ? parsed.slug ?? null : null);
    setSelectedCategorySlug(parsed.kind === 'category' ? parsed.slug ?? null : null);
    setSearchQuery(parsed.query.q ?? '');

    if (options?.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigate = (path: string, options?: NavigateOptions) => {
    const { href, didCanonicalize } = canonicalizeLocation(path);
    const replace = Boolean(options?.replace || didCanonicalize);
    if (getBrowserHref() !== href) {
      if (replace) {
        window.history.replaceState({ path: href }, '', href);
      } else {
        window.history.pushState({ path: href }, '', href);
      }
    } else if (didCanonicalize) {
      window.history.replaceState({ path: href }, '', href);
    }
    applyParsedRoute(href, options);
  };

  const selectProductBySlug = (slug: string) => {
    navigate(productPath(slug));
  };

  useEffect(() => {
    const { href, didCanonicalize } = canonicalizeLocation(readBrowserLocation());
    if (window.location.hash || didCanonicalize || getBrowserHref() !== href) {
      window.history.replaceState({ path: href }, '', href);
    }
    applyParsedRoute(href, { scroll: false });

    const onPopState = () => {
      const next = canonicalizeLocation(readBrowserLocation());
      if (next.didCanonicalize) {
        window.history.replaceState({ path: next.href }, '', next.href);
      }
      applyParsedRoute(next.href, { scroll: false });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // Boot-time URL sync only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = await fetchBootstrap();
      if (cancelled || !snapshot) return;
      if (snapshot.merchandising?.length) {
        setProducts((prev) => applyMerchandisingOverlay(prev, snapshot.merchandising));
      }
      if (snapshot.storeSettings) {
        setStoreSettings(withCanonicalStoreContactEmails(snapshot.storeSettings));
      }
      if (snapshot.shippingMethods?.length) {
        setShippingMethods(snapshot.shippingMethods);
      }
      if (snapshot.settlement) {
        setSettlement(snapshot.settlement);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledgeResearchOnly = () => {
    setHasAcknowledgedResearchOnly(true);
    setComplianceModalOpen(false);
    addToast('success', 'Compliance Verified', 'Institutional Research In-Vitro consent recorded for this session.');
  };

  // Shipping & Pricing calculations
  const appliedCoupon = coupons.find((c) => c.code === appliedCouponCode) || null;

  const intermediateSubtotal = useMemo(() => {
    let sub = 0;
    for (const item of cart) {
      sub += item.unitPrice * item.quantity;
    }
    return sub;
  }, [cart]);

  const eligibleShippingCalculation = useMemo(() => {
    return calculateEligibleShippingMethods(
      destinationCountryCode,
      intermediateSubtotal,
      shippingMethods,
      selectedShippingMethodId
    );
  }, [destinationCountryCode, intermediateSubtotal, shippingMethods, selectedShippingMethodId]);

  const activeShippingMethod =
    eligibleShippingCalculation.selectedMethod ||
    shippingMethods.find((m) => m.id === selectedShippingMethodId) ||
    shippingMethods[0];

  const totalsForPaymentGate = calculateOrderTotals(
    cart,
    'BANK_TRANSFER',
    activeShippingMethod,
    appliedCoupon
  );
  const resolvedPaymentMethod: PaymentMethod = isBankTransferAvailable(
    merchandiseTotalForPayment(totalsForPaymentGate)
  )
    ? selectedPaymentMethod
    : 'CRYPTOCURRENCY';
  const cartTotals =
    resolvedPaymentMethod === 'BANK_TRANSFER'
      ? totalsForPaymentGate
      : calculateOrderTotals(cart, 'CRYPTOCURRENCY', activeShippingMethod, appliedCoupon);

  const applyCoupon = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    const match = coupons.find((c) => c.code.toUpperCase() === normalized);
    if (!match) {
      addToast('error', 'Coupon Not Found', `Code "${code}" is invalid or does not exist.`);
      return false;
    }
    if (!match.isActive) {
      addToast('error', 'Inactive Coupon', 'This voucher code is currently disabled.');
      return false;
    }
    if (match.minSpend && cartTotals.subtotal < match.minSpend) {
      addToast('error', 'Minimum Spend Required', `Minimum order value of £${match.minSpend.toFixed(2)} required.`);
      return false;
    }

    setAppliedCouponCode(match.code);
    addToast('success', 'Coupon Applied', `${match.description || match.code} successfully applied.`);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCouponCode(null);
    addToast('info', 'Coupon Removed', 'Promotional code removed from basket.');
  };

  // Product CRUD
  const createProduct = (productData: Partial<Product>): Product => {
    const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const category =
      categories.find((c) => c.id === productData.categoryId) ||
      categories.find((c) => c.id === 'cat-peptides') ||
      categories.find((c) => c.isActive) ||
      categories[0];
    if (!category) {
      throw new Error('Cannot create a product without a shop category.');
    }

    const newProd: Product = {
      id: productId,
      name: productData.name || 'New Research Compound',
      slug: productData.slug || `new-compound-${Date.now()}`,
      sku: (productData.sku || `RPUK-${Date.now()}`).toUpperCase(),
      categoryId: category.id,
      categoryName: category.name,
      shortDescription: productData.shortDescription || 'Analytical laboratory reference standard.',
      longDescription: productData.longDescription || productData.shortDescription || '',
      productType: productData.productType || 'PEPTIDE',
      researchClassification: productData.researchClassification || 'IN_VITRO_ONLY',
      status: 'DRAFT', // Default state
      visibility: productData.visibility || 'PUBLIC',
      isFeatured: Boolean(productData.isFeatured),
      researchOnly: true,
      casNumber: productData.casNumber,
      molecularFormula: productData.molecularFormula,
      molecularWeight: productData.molecularWeight,
      sequence: productData.sequence,
      purityValue: productData.purityValue,
      manufacturer: productData.manufacturer,
      origin: productData.origin,
      appearance: productData.appearance || 'Lyophilized White Powder',
      storageRequirements: productData.storageRequirements || 'Store sealed at -20°C in desiccated laboratory freezer',
      solubility: productData.solubility || 'Sterile Water / Bacteriostatic Laboratory Solvent',
      documentationStatus: productData.documentationStatus || 'PENDING',
      analyticalDataSource: productData.analyticalDataSource || 'UNAVAILABLE',
      merchandising: productData.merchandising,
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: productData.variants && productData.variants.length > 0 ? productData.variants : [
        {
          id: `var-${Date.now()}-1`,
          productId,
          name: '5mg Lyophilized Vial',
          size: '5mg',
          sku: `${(productData.sku || `RPUK-${Date.now()}`).toUpperCase()}-5MG`,
          quantityValue: 5,
          quantityUnit: 'mg',
          price: 29.99,
          stock: 25,
          reservedStock: 0,
          lowStockThreshold: 5,
          status: 'ACTIVE',
        },
      ],
      images: productData.images && productData.images.length > 0 ? productData.images : [
        {
          id: `img-${Date.now()}`,
          productId,
          url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
          altText: 'Laboratory Vial Standard',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
      documents: productData.documents || [],
      batches: [],
    };

    setProducts((prev) => [newProd, ...prev]);
    logAuditEvent('PRODUCT_CREATED', 'PRODUCT', newProd.id, { name: newProd.name, sku: newProd.sku, status: newProd.status });
    addToast('success', 'Compound Registered', `Created draft entry for "${newProd.name}".`);
    return newProd;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = {
            ...p,
            ...updates,
            updatedBy: currentUser.email,
            updatedAt: new Date().toISOString(),
          };
          logAuditEvent('PRODUCT_UPDATED', 'PRODUCT', productId, updates);
          return updated;
        }
        return p;
      })
    );
    addToast('success', 'Product Updated', 'Product record saved successfully.');
  };

  const saveProductMerchandising = async (
    productId: string,
    patch: Partial<MerchandisingRecord>
  ): Promise<boolean> => {
    const result = await persistMerchandising(productId, patch);
    if (!result.ok || !result.record) {
      addToast(
        'error',
        'Merchandising not saved',
        result.reference
          ? `The change could not be stored. Reference: ${result.reference}`
          : 'The change could not be stored.'
      );
      return false;
    }
    setProducts((prev) => applyMerchandisingOverlay(prev, [result.record as MerchandisingRecord]));
    logAuditEvent('MERCHANDISING_UPDATED', 'PRODUCT', productId, patch as Record<string, unknown>);
    addToast('success', 'Merchandising saved', 'The catalogue control is now stored persistently.');
    return true;
  };

  const setProductStatus = (productId: string, newStatus: ProductStatus) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const timestamp = new Date().toISOString();
          const updated: Product = {
            ...p,
            status: newStatus,
            updatedBy: currentUser.email,
            updatedAt: timestamp,
            publishedAt: newStatus === 'PUBLISHED' ? timestamp : p.publishedAt,
            publishedBy: newStatus === 'PUBLISHED' ? currentUser.email : p.publishedBy,
            archivedAt: newStatus === 'ARCHIVED' ? timestamp : p.archivedAt,
            archivedBy: newStatus === 'ARCHIVED' ? currentUser.email : p.archivedBy,
          };
          logAuditEvent('PRODUCT_STATUS_CHANGED', 'PRODUCT', productId, { oldStatus: p.status, newStatus });
          return updated;
        }
        return p;
      })
    );
    addToast('info', 'Status Updated', `Product status transitioned to ${newStatus}.`);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    logAuditEvent('PRODUCT_DELETED', 'PRODUCT', productId);
    addToast('warning', 'Product Removed', 'Compound permanently removed from catalogue.');
  };

  const bulkUpdateProductStatus = (productIds: string[], newStatus: ProductStatus) => {
    const idSet = new Set(productIds);
    setProducts((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p))
    );
    logAuditEvent('BULK_STATUS_UPDATE', 'PRODUCT', `${productIds.length} items`, { newStatus, productIds });
    addToast('success', 'Bulk Action Complete', `Updated ${productIds.length} products to ${newStatus}.`);
  };

  const bulkUpdateProductCategory = (productIds: string[], categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const idSet = new Set(productIds);
    setProducts((prev) =>
      prev.map((p) =>
        idSet.has(p.id) ? { ...p, categoryId: cat.id, categoryName: cat.name, updatedAt: new Date().toISOString() } : p
      )
    );
    logAuditEvent('BULK_CATEGORY_UPDATE', 'PRODUCT', `${productIds.length} items`, { categoryId: cat.id, categoryName: cat.name });
    addToast('success', 'Bulk Category Updated', `Assigned ${productIds.length} products to "${cat.name}".`);
  };

  const updateVariantStock = (variantId: string, newStock: number, reason = 'Manual stock adjustment') => {
    setProducts((prev) =>
      prev.map((p) => {
        const vIdx = p.variants.findIndex((v) => v.id === variantId);
        if (vIdx >= 0) {
          const oldStock = p.variants[vIdx].stock;
          const updatedVars = [...p.variants];
          updatedVars[vIdx] = {
            ...updatedVars[vIdx],
            stock: newStock,
            status: newStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
            updatedAt: new Date().toISOString(),
          };
          logAuditEvent('STOCK_ADJUSTED', 'VARIANT', variantId, {
            product: p.name,
            variant: updatedVars[vIdx].name,
            oldStock,
            newStock,
            reason,
          });
          const tx = recordInventoryTransaction(
            variantId,
            newStock > oldStock ? 'RESTOCK' : 'ADJUSTMENT',
            newStock - oldStock,
            newStock,
            undefined,
            reason,
            currentUser.id
          );
          setInventoryTransactions((prev) => [tx, ...prev]);
          void persistInventoryRequest(tx);
          return { ...p, variants: updatedVars };
        }
        return p;
      })
    );
    addToast('success', 'Stock Level Updated', `Adjusted variant inventory to ${newStock} units.`);
  };

  const updateVariantPrice = (variantId: string, newPrice: number, comparePrice?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        const vIdx = p.variants.findIndex((v) => v.id === variantId);
        if (vIdx >= 0) {
          const oldPrice = p.variants[vIdx].price;
          const updatedVars = [...p.variants];
          updatedVars[vIdx] = {
            ...updatedVars[vIdx],
            price: newPrice,
            compareAtPrice: comparePrice,
            updatedAt: new Date().toISOString(),
          };
          logAuditEvent('PRICE_CHANGED', 'VARIANT', variantId, {
            product: p.name,
            variant: updatedVars[vIdx].name,
            oldPrice,
            newPrice,
          });
          return { ...p, variants: updatedVars };
        }
        return p;
      })
    );
    addToast('success', 'Price Updated', `Price updated to £${newPrice.toFixed(2)}.`);
  };

  // Categories CRUD
  const createCategory = (catData: Partial<ProductCategory>) => {
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: catData.name || 'New Category',
      slug: (catData.slug || catData.name || `cat-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      description: catData.description || '',
      image: catData.image,
      sortOrder: catData.sortOrder || categories.length + 1,
      isActive: catData.isActive ?? true,
      seoTitle: catData.seoTitle,
      seoDescription: catData.seoDescription,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    logAuditEvent('CATEGORY_CREATED', 'CATEGORY', newCat.id, { name: newCat.name });
    addToast('success', 'Category Created', `Category "${newCat.name}" registered.`);
  };

  const updateCategory = (id: string, updates: Partial<ProductCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    logAuditEvent('CATEGORY_UPDATED', 'CATEGORY', id, updates);
    addToast('success', 'Category Updated', 'Category updated successfully.');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    logAuditEvent('CATEGORY_DELETED', 'CATEGORY', id);
    addToast('warning', 'Category Deleted', 'Category removed.');
  };

  // Batches & Documents
  const createBatch = (batchData: Partial<ProductBatch>) => {
    const newBatch: ProductBatch = {
      id: `batch-${Date.now()}`,
      productId: batchData.productId || '',
      batchNumber: batchData.batchNumber || `UK-${new Date().getFullYear()}-B${Math.floor(100 + Math.random() * 900)}`,
      status: batchData.status || 'PENDING',
      testDate: batchData.testDate || new Date().toISOString().split('T')[0],
      expiryDate: batchData.expiryDate,
      purityValue: batchData.purityValue,
      certificateRef: batchData.certificateRef,
      notes: batchData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBatches((prev) => [newBatch, ...prev]);

    // Attach to product
    setProducts((prev) =>
      prev.map((p) =>
        p.id === newBatch.productId ? { ...p, batches: [...(p.batches || []), newBatch] } : p
      )
    );
    logAuditEvent('BATCH_CREATED', 'BATCH', newBatch.id, { batchNumber: newBatch.batchNumber });
    addToast('success', 'Batch Added', `Batch #${newBatch.batchNumber} created.`);
  };

  const updateBatch = (id: string, updates: Partial<ProductBatch>) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );
    logAuditEvent('BATCH_UPDATED', 'BATCH', id, updates);
    addToast('success', 'Batch Updated', 'Batch record saved.');
  };

  const addDocument = (docData: Partial<ProductDocument>) => {
    const newDoc: ProductDocument = {
      id: `doc-${Date.now()}`,
      productId: docData.productId || '',
      batchId: docData.batchId,
      title: docData.title || 'Certificate of Analysis',
      documentType: docData.documentType || 'COA',
      fileUrl: docData.fileUrl || '#',
      fileName: docData.fileName || 'COA-DOCUMENT.pdf',
      mimeType: 'application/pdf',
      batchNumber: docData.batchNumber,
      testDate: docData.testDate,
      visibility: docData.visibility || 'PUBLIC',
      uploadedBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) =>
      prev.map((p) =>
        p.id === newDoc.productId
          ? {
              ...p,
              documents: [...p.documents, newDoc],
              documentationStatus: 'VERIFIED',
              analyticalDataSource: 'VERIFIED',
            }
          : p
      )
    );
    logAuditEvent('DOCUMENT_UPLOADED', 'DOCUMENT', newDoc.id, { title: newDoc.title, type: newDoc.documentType });
    addToast('success', 'Document Attached', `Document "${newDoc.title}" attached to compound.`);
  };

  const deleteDocument = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        documents: p.documents.filter((d) => d.id !== id),
      }))
    );
    logAuditEvent('DOCUMENT_DELETED', 'DOCUMENT', id);
    addToast('info', 'Document Removed', 'Document detached.');
  };

  // Shipping CRUD
  const updateShippingMethod = async (id: string, updates: Partial<ShippingMethod>) => {
    const result = await persistShippingRequest(id, updates);
    if (!result.ok) {
      addToast(
        'error',
        'Shipping not saved',
        result.reference
          ? `Courier configuration could not be stored. Reference: ${result.reference}`
          : 'Courier configuration could not be stored.'
      );
      return;
    }
    setShippingMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    logAuditEvent('SHIPPING_METHOD_UPDATED', 'SHIPPING', id, updates);
    addToast('success', 'Shipping Rate Updated', 'Courier delivery configuration saved.');
  };

  // Coupons CRUD
  const createCoupon = (cpnData: Partial<Coupon>) => {
    const newCpn: Coupon = {
      id: `cpn-${Date.now()}`,
      code: (cpnData.code || 'SPECIAL').toUpperCase().trim(),
      description: cpnData.description || 'Promotional Discount Voucher',
      discountType: cpnData.discountType || 'PERCENTAGE',
      discountValue: cpnData.discountValue || 10,
      minSpend: cpnData.minSpend || 0,
      maxDiscount: cpnData.maxDiscount,
      usageLimit: cpnData.usageLimit,
      usedCount: 0,
      perUserLimit: cpnData.perUserLimit || 1,
      isActive: cpnData.isActive ?? true,
      startDate: cpnData.startDate,
      endDate: cpnData.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCoupons((prev) => [newCpn, ...prev]);
    logAuditEvent('COUPON_CREATED', 'COUPON', newCpn.id, { code: newCpn.code });
    addToast('success', 'Voucher Created', `Voucher "${newCpn.code}" is now active.`);
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    logAuditEvent('COUPON_UPDATED', 'COUPON', id, updates);
    addToast('success', 'Coupon Updated', 'Voucher rules updated.');
  };

  // Cart operations
  const addToCart = (product: Product, variantId: string, quantity = 1): boolean => {
    const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    if (!variant) return false;

    // Inventory check
    const check = checkVariantStockAvailability(variant, quantity);
    if (!check.isAvailable) {
      addToast('error', 'Stock Limit Exceeded', check.error || 'Requested quantity exceeds available stock.');
      return false;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantId: variant.id,
          variantName: variant.name,
          size: variant.size,
          sku: variant.sku,
          unitPrice: variant.price,
          quantity,
          image: product.images[0]?.url || '',
          purityScore: variant.purityScore,
        },
      ];
    });

    setCartDrawerOpen(true);
    return true;
  };

  const updateCartQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
    addToast('info', 'Item Removed', 'Product removed from basket.');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    const prod = products.find((p) => p.id === productId);
    addToast('info', 'Saved', `${prod?.name || 'Item'} updated in saved list.`);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [adminUser, customerUser] = await Promise.all([fetchAdminSession(), fetchCustomerSession()]);
        if (cancelled) return;
        if (adminUser) {
          setAdminSession(adminUser);
          setCurrentUser({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: 'ADMIN',
            institution: 'Research Peptides UK',
            createdAt: new Date().toISOString(),
          });
        }
        if (customerUser) {
          setCustomerSession(customerUser);
          if (!adminUser) {
            setCurrentUser({
              id: customerUser.id,
              email: customerUser.email,
              name: customerUser.name,
              role: customerUser.role,
              institution: customerUser.institution,
              phone: customerUser.phone,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        // Public catalogue remains available without a session.
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdminAuthenticated = adminSession?.role === 'ADMIN';
  const isCustomerAuthenticated = Boolean(customerSession);
  const isAccountAuthenticated = isAdminAuthenticated || isCustomerAuthenticated;

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      if (isAdminAuthenticated) {
        const snapshot = await fetchAdminCommerce();
        if (cancelled || !snapshot) return;
        setOrders(Array.isArray(snapshot.orders) ? snapshot.orders.filter((order) => order && typeof order === 'object') : []);
        setPayments(Array.isArray(snapshot.payments) ? snapshot.payments.filter((payment) => payment && typeof payment === 'object') : []);
        setInventoryTransactions(
          Array.isArray(snapshot.inventoryTransactions)
            ? snapshot.inventoryTransactions.filter((transaction) => transaction && typeof transaction === 'object')
            : []
        );
        return;
      }
      if (isCustomerAuthenticated) {
        const snapshot = await fetchAccountOrders();
        if (cancelled || !snapshot) return;
        setOrders(Array.isArray(snapshot.orders) ? snapshot.orders.filter((order) => order && typeof order === 'object') : []);
        setPayments(Array.isArray(snapshot.payments) ? snapshot.payments.filter((payment) => payment && typeof payment === 'object') : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, isAdminAuthenticated, isCustomerAuthenticated]);

  const applyAdminUser = (sessionUser: AdminSessionUser) => {
    setAdminSession(sessionUser);
    setCurrentUser({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: 'ADMIN',
      institution: 'Research Peptides UK',
      createdAt: new Date().toISOString(),
    });
  };

  const applyCustomerUser = (sessionUser: CustomerSessionUser) => {
    setCustomerSession(sessionUser);
    setCurrentUser({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: sessionUser.role,
      institution: sessionUser.institution,
      phone: sessionUser.phone,
      createdAt: new Date().toISOString(),
    });
  };

  const signInAdmin = async (email: string, password: string) => {
    const result = await loginAdmin(email, password);
    if ('user' in result) {
      applyAdminUser(result.user);
      addToast('success', 'Signed in', 'Admin session established.');
    }
    return result;
  };

  const signOutAdmin = async () => {
    await logoutAdmin();
    setAdminSession(null);
    setAdminDraftPreviewMode(false);
    if (customerSession) {
      applyCustomerUser(customerSession);
    } else {
      setCurrentUser(GUEST_USER);
    }
    addToast('info', 'Signed out', 'Admin session ended.');
  };

  const signInCustomer = async (email: string, password: string) => {
    const result = await loginCustomer(email, password);
    if ('user' in result) {
      applyCustomerUser(result.user);
      addToast('success', 'Signed in', 'Welcome back.');
    }
    return result;
  };

  const registerCustomerAccount = async (input: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }) => {
    const result = await registerCustomerRequest(input);
    if ('user' in result) {
      applyCustomerUser(result.user);
      addToast('success', 'Account created', 'You are now signed in.');
    }
    return result;
  };

  const signOutCustomer = async () => {
    await logoutCustomer();
    setCustomerSession(null);
    if (adminSession) {
      applyAdminUser(adminSession);
    } else {
      setCurrentUser(GUEST_USER);
    }
    addToast('info', 'Signed out', 'Customer session ended.');
  };

  const setUserRole = (role: UserRole | string) => {
    const key = (typeof role === 'string' ? role.toUpperCase() : role) as UserRole;
    if (key === 'ADMIN') {
      if (adminSession) {
        applyAdminUser(adminSession);
        return;
      }
      addToast('error', 'Sign in required', 'Admin access requires the authorised operator account.');
      navigate('/admin/login');
      return;
    }
    const targetUser = DEMO_USERS[key] || GUEST_USER;
    setCurrentUser(targetUser);
  };

  // ==========================================
  // HARDENED ORDERS & PAYMENT LIFECYCLE
  // ==========================================

  const createOrder = async (orderData: {
    customerEmail?: string;
    customerName?: string;
    shippingAddress: AddressSnapshot;
    paymentMethod: PaymentMethod;
    paymentProofReference?: string;
  }): Promise<Order | null> => {
    if (cart.length === 0) {
      addToast('error', 'Empty Basket', 'Cannot create order with an empty basket.');
      return null;
    }

    if (
      orderData.paymentMethod === 'BANK_TRANSFER' &&
      !isBankTransferAvailable(merchandiseTotalForPayment(cartTotals))
    ) {
      addToast(
        'error',
        'Payment method unavailable',
        `Bank transfer is available on orders of £${BANK_TRANSFER_MIN_MERCHANDISE_TOTAL.toFixed(2)} and above. Use cryptocurrency for this basket.`
      );
      return null;
    }

    // 1. Authoritative destination eligibility check
    const destCountry = orderData.shippingAddress.country || destinationCountryCode;
    const destCalc = calculateEligibleShippingMethods(
      destCountry,
      cartTotals.subtotal,
      shippingMethods,
      selectedShippingMethodId
    );

    if (!destCalc.isAvailable) {
      addToast('error', 'Shipping Unavailable', destCalc.error || 'Destination country is not eligible.');
      return null;
    }

    // 2. Authoritative inventory availability check
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        addToast('error', 'Product Missing', `Variant ${item.variantName} could not be located in catalogue.`);
        return null;
      }

      const check = checkVariantStockAvailability(variant, item.quantity);
      if (!check.isAvailable) {
        addToast('error', 'Inventory Allocation Conflict', check.error || 'Requested quantity exceeds stock.');
        return null;
      }
    }

    // 3. Build reservation ledger events (applied only after database persist)
    const reservationEvents: InventoryTransaction[] = cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      const reserved = (variant?.reservedStock || 0) + item.quantity;
      return recordInventoryTransaction(
        item.variantId,
        'RESERVATION',
        -item.quantity,
        Math.max(0, (variant?.stock || 0) - reserved),
        undefined,
        `Reservation for pending order`,
        currentUser.id
      );
    });

    // 4. Generate unique IDs and references
    const orderId = `ord-${Date.now()}`;
    const paymentId = `pay-${Date.now()}`;
    const orderNumber = `RP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const expiryIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h reservation

    // 5. Build immutable OrderItem commercial snapshots with allocated discounts
    const snapshotItems: OrderItem[] = cart.map((item) => {
      const lineRawTotal = item.unitPrice * item.quantity;
      const lineFraction = cartTotals.subtotal > 0 ? lineRawTotal / cartTotals.subtotal : 0;
      const lineTierDiscount = cartTotals.itemDiscounts * lineFraction;
      const lineCouponDiscount = cartTotals.couponDiscount * lineFraction;
      const lineCryptoDiscount = cartTotals.cryptoDiscount * lineFraction;
      const lineFinalTotal = Number(
        (lineRawTotal - lineTierDiscount - lineCouponDiscount - lineCryptoDiscount).toFixed(2)
      );

      return {
        id: `oi-${Math.random().toString(36).substring(2, 7)}`,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        variantSku: item.sku,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tierDiscountAmount: Number(lineTierDiscount.toFixed(2)),
        allocatedCouponDiscountAmount: Number(lineCouponDiscount.toFixed(2)),
        allocatedCryptoDiscountAmount: Number(lineCryptoDiscount.toFixed(2)),
        totalPrice: lineFinalTotal,
      };
    });

    const paymentProof = normalizePaymentProofReference(orderData.paymentProofReference);
    const bankSettlement = settlement.bank.configured ? settlement.bank : getBankSettlementInstructions();
    const cryptoSettlement = settlement.crypto.configured ? settlement.crypto : getCryptoSettlementInstructions();

    // 6. Build Initial Payment Entity
    const initialPayment: Payment = {
      id: paymentId,
      orderId,
      orderNumber,
      method: orderData.paymentMethod,
      amount: cartTotals.total,
      currency,
      status: paymentProof ? 'SUBMITTED' : 'AWAITING_CUSTOMER_ACTION',
      reference:
        orderData.paymentMethod === 'BANK_TRANSFER'
          ? `RP-BK-${orderNumber.split('-')[2]}`
          : `RP-CRYPTO-${orderNumber.split('-')[2]}`,
      transactionHash: paymentProof,
      bankDetails:
        orderData.paymentMethod === 'BANK_TRANSFER' && bankSettlement.configured
          ? {
              accountName: bankSettlement.accountName,
              accountNumber: bankSettlement.accountNumber,
              sortCode: bankSettlement.sortCode,
              bankName: bankSettlement.bankName,
              reference: orderNumber,
            }
          : undefined,
      cryptoDetails:
        orderData.paymentMethod === 'CRYPTOCURRENCY' && cryptoSettlement.configured
          ? {
              network: cryptoSettlement.network,
              walletAddress: cryptoSettlement.walletAddress,
              expiresAt: expiryIso,
            }
          : undefined,
      submittedAt: paymentProof ? nowIso : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 7. Initial Order History Log
    const initialHistory: OrderHistoryEvent[] = [
      {
        id: `h-${Date.now()}-1`,
        orderId,
        timestamp: nowIso,
        fromStatus: 'DRAFT',
        toStatus: paymentProof ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT',
        actor: currentUser.name || currentUser.email,
        actorRole: currentUser.role,
        note: `Order registered via ${orderData.paymentMethod.replace('_', ' ')}.`,
      },
    ];

    // 8. Build Order Entity
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: currentUser.id,
      customerEmail: orderData.customerEmail || currentUser.email,
      customerName: orderData.customerName || currentUser.name,
      shippingAddress: {
        ...orderData.shippingAddress,
        countryName: destCalc.countryName || orderData.shippingAddress.country,
      },
      items: snapshotItems,
      subtotal: cartTotals.subtotal,
      tierDiscountAmount: cartTotals.itemDiscounts,
      couponCode: appliedCoupon?.code,
      couponDiscountAmount: cartTotals.couponDiscount,
      cryptoDiscountAmount: cartTotals.cryptoDiscount,
      shippingMethodId: activeShippingMethod.id,
      shippingMethodName: activeShippingMethod.name,
      shippingCarrier: activeShippingMethod.carrier,
      shippingZone: activeShippingMethod.zone,
      shippingFee: cartTotals.shippingFee,
      total: cartTotals.total,
      currency,
      paymentId,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: initialPayment.status,
      status: paymentProof ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT',
      paymentProofReference: paymentProof,
      reservationExpiresAt: expiryIso,
      researchConsentSigned: true,
      history: initialHistory,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const reservationWithOrder = reservationEvents.map((event) => ({ ...event, orderId }));
    const persistResult = await persistOrderRequest({
      order: newOrder,
      payment: initialPayment,
      inventory: reservationWithOrder,
      idempotencyKey: `${currentUser.email}:${orderNumber}:${cart.map((item) => item.variantId).join(',')}`,
    });
    if (!persistResult.ok) {
      addToast(
        'error',
        'Order not registered',
        persistResult.reference
          ? `The order could not be stored. Reference: ${persistResult.reference}`
          : 'The order could not be stored. Please try again.'
      );
      return null;
    }

    setProducts((prevProds) =>
      prevProds.map((prod) => {
        const cartVariantIds = new Set(cart.map((c) => c.variantId));
        const updatedVariants = prod.variants.map((v) => {
          if (cartVariantIds.has(v.id)) {
            const cartItem = cart.find((c) => c.variantId === v.id)!;
            const newReserved = (v.reservedStock || 0) + cartItem.quantity;
            return { ...v, reservedStock: newReserved };
          }
          return v;
        });
        return { ...prod, variants: updatedVariants };
      })
    );
    setInventoryTransactions((prev) => [...reservationWithOrder, ...prev]);

    // 9. Increment coupon usage
    if (appliedCoupon) {
      setCoupons((prev) =>
        prev.map((c) => (c.code === appliedCoupon.code ? { ...c, usedCount: c.usedCount + 1 } : c))
      );
    }

    // 10. Persist in state
    setPayments((prev) => [initialPayment, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);

    // 11. Create and dispatch notifications
    const notif1 = createOrderNotification('ORDER_RECEIVED', newOrder, initialPayment);
    const notif2 = createOrderNotification('PAYMENT_INSTRUCTIONS', newOrder, initialPayment);
    setNotifications((prev) => [notif2, notif1, ...prev]);

    // 12. Audit log
    logAuditEvent('ORDER_CREATED', 'ORDER', newOrder.id, {
      orderNumber: newOrder.orderNumber,
      total: newOrder.total,
      itemsCount: newOrder.items.length,
      paymentMethod: newOrder.paymentMethod,
      reservationExpiresAt: expiryIso,
    });

    clearCart();
    setAppliedCouponCode(null);
    addToast('success', 'Order Registered', `Order #${newOrder.orderNumber} successfully registered.`);
    return newOrder;
  };

  const submitPaymentEvidence = (orderId: string, referenceOrTxHash: string, notes?: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      addToast('error', 'Order Not Found', 'Order does not exist.');
      return false;
    }

    const payment = payments.find((p) => p.orderId === orderId || p.id === order.paymentId);
    const nowIso = new Date().toISOString();

    // Update payment
    setPayments((prev) =>
      prev.map((p) =>
        p.id === payment?.id || p.orderId === orderId
          ? {
              ...p,
              status: 'SUBMITTED',
              transactionHash: referenceOrTxHash,
              evidenceNotes: notes || p.evidenceNotes,
              submittedAt: nowIso,
              updatedAt: nowIso,
            }
          : p
      )
    );

    // Update order
    const historyEvent: OrderHistoryEvent = {
      id: `h-${Date.now()}`,
      orderId,
      timestamp: nowIso,
      fromStatus: order.status,
      toStatus: 'PAYMENT_SUBMITTED',
      actor: currentUser.name || currentUser.email,
      actorRole: currentUser.role,
      note: `Payment evidence submitted: ${referenceOrTxHash}${notes ? ` - ${notes}` : ''}`,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'PAYMENT_SUBMITTED',
              paymentStatus: 'SUBMITTED',
              paymentProofReference: referenceOrTxHash,
              history: [...(o.history || []), historyEvent],
              updatedAt: nowIso,
            }
          : o
      )
    );

    const updatedOrder = { ...order, status: 'PAYMENT_SUBMITTED' as OrderStatus };
    const notif = createOrderNotification('PAYMENT_SUBMITTED', updatedOrder, payment);
    setNotifications((prev) => [notif, ...prev]);

    logAuditEvent('PAYMENT_SUBMITTED', 'PAYMENT', payment?.id || orderId, {
      orderNumber: order.orderNumber,
      reference: referenceOrTxHash,
      notes,
    });

    const nextPayment: Payment = {
      ...(payment as Payment),
      status: 'SUBMITTED',
      transactionHash: referenceOrTxHash,
      evidenceNotes: notes || payment?.evidenceNotes,
      submittedAt: nowIso,
      updatedAt: nowIso,
    };
    const nextOrder: Order = {
      ...order,
      status: 'PAYMENT_SUBMITTED',
      paymentStatus: 'SUBMITTED',
      paymentProofReference: referenceOrTxHash,
      history: [...(order.history || []), historyEvent],
      updatedAt: nowIso,
    };
    void persistPaymentRequest(nextOrder, nextPayment);

    addToast('success', 'Evidence Submitted', `Payment reference for #${order.orderNumber} queued for Finance Audit.`);
    return true;
  };

  const verifyPayment = (orderId: string, paymentId?: string, notes?: string): boolean => {
    if (!hasPermission(currentUser.role, 'ADMIN')) {
      addToast('error', 'Permission Denied', 'Only administrative staff can verify commercial payments.');
      return false;
    }

    const linkedPayment = payments.find((p) => p.id === orderId || p.id === paymentId || p.orderId === orderId);
    const order =
      orders.find((o) => o.id === orderId) ||
      orders.find((o) => o.id === linkedPayment?.orderId) ||
      orders.find((o) => o.paymentId === orderId);
    if (!order) {
      addToast('error', 'Order Not Found', 'Order does not exist.');
      return false;
    }

    const nowIso = new Date().toISOString();

    // Verify payment entity
    setPayments((prev) =>
      prev.map((p) =>
        p.orderId === order.id || p.id === paymentId || p.id === linkedPayment?.id
          ? {
              ...p,
              status: 'VERIFIED',
              verifiedAt: nowIso,
              verifiedBy: currentUser.email,
              notes: notes || p.notes,
              updatedAt: nowIso,
            }
          : p
      )
    );

    // Update order status to PAYMENT_VERIFIED and record history
    const historyEvent: OrderHistoryEvent = {
      id: `h-${Date.now()}`,
      orderId,
      timestamp: nowIso,
      fromStatus: order.status,
      toStatus: 'PAYMENT_VERIFIED',
      actor: currentUser.name || currentUser.email,
      actorRole: 'ADMIN',
      note: `Payment verified by ${currentUser.name || currentUser.email}.${notes ? ` Note: ${notes}` : ''}`,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'PAYMENT_VERIFIED',
              paymentStatus: 'VERIFIED',
              history: [...(o.history || []), historyEvent],
              updatedAt: nowIso,
            }
          : o
      )
    );

    const updatedOrder = { ...order, status: 'PAYMENT_VERIFIED' as OrderStatus, paymentStatus: 'VERIFIED' as PaymentStatus };
    const notif = createOrderNotification('PAYMENT_VERIFIED', updatedOrder);
    setNotifications((prev) => [notif, ...prev]);

    logAuditEvent('PAYMENT_VERIFIED', 'PAYMENT', paymentId || orderId, {
      orderNumber: order.orderNumber,
      verifiedBy: currentUser.email,
      notes,
    });

    const nextPayment: Payment = {
      ...(payments.find((p) => p.orderId === order.id || p.id === paymentId) as Payment),
      status: 'VERIFIED',
      verifiedAt: nowIso,
      verifiedBy: currentUser.email,
      notes: notes || undefined,
      updatedAt: nowIso,
    };
    const nextOrder: Order = {
      ...order,
      status: 'PAYMENT_VERIFIED',
      paymentStatus: 'VERIFIED',
      history: [...(order.history || []), historyEvent],
      updatedAt: nowIso,
    };
    void persistPaymentRequest(nextOrder, nextPayment);

    addToast('success', 'Payment Verified', `Order #${order.orderNumber} verified. Order ready for processing.`);
    return true;
  };

  const rejectPayment = (orderId: string, reason: string, notes?: string): boolean => {
    if (!hasPermission(currentUser.role, 'ADMIN')) {
      addToast('error', 'Permission Denied', 'Only administrative staff can reject payment records.');
      return false;
    }

    if (!reason || reason.trim() === '') {
      addToast('error', 'Rejection Reason Required', 'Please provide an audit reason for rejecting payment.');
      return false;
    }

    const linkedPayment = payments.find((p) => p.id === orderId || p.orderId === orderId);
    const order =
      orders.find((o) => o.id === orderId) ||
      orders.find((o) => o.id === linkedPayment?.orderId);
    if (!order) return false;

    const nowIso = new Date().toISOString();

    setPayments((prev) =>
      prev.map((p) =>
        p.orderId === order.id || p.id === linkedPayment?.id
          ? {
              ...p,
              status: 'FAILED',
              rejectionReason: reason,
              notes: notes || p.notes,
              updatedAt: nowIso,
            }
          : p
      )
    );

    const historyEvent: OrderHistoryEvent = {
      id: `h-${Date.now()}`,
      orderId,
      timestamp: nowIso,
      fromStatus: order.status,
      toStatus: 'PENDING_PAYMENT',
      actor: currentUser.name || currentUser.email,
      actorRole: 'ADMIN',
      note: `Payment rejected: ${reason}.${notes ? ` Details: ${notes}` : ''}`,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'PENDING_PAYMENT',
              paymentStatus: 'FAILED',
              paymentProofReference: undefined,
              history: [...(o.history || []), historyEvent],
              updatedAt: nowIso,
            }
          : o
      )
    );

    const updatedOrder = { ...order, status: 'PENDING_PAYMENT' as OrderStatus, paymentStatus: 'FAILED' as PaymentStatus };
    const notif = createOrderNotification('PAYMENT_REJECTED', updatedOrder);
    setNotifications((prev) => [notif, ...prev]);

    logAuditEvent('PAYMENT_REJECTED', 'PAYMENT', order.id, {
      orderNumber: order.orderNumber,
      reason,
      notes,
    });

    const failedPayment: Payment = {
      ...(linkedPayment as Payment),
      status: 'FAILED',
      rejectionReason: reason,
      notes: notes || linkedPayment?.notes,
      updatedAt: nowIso,
    };
    void persistPaymentRequest(
      {
        ...order,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'FAILED',
        paymentProofReference: undefined,
        history: [...(order.history || []), historyEvent],
        updatedAt: nowIso,
      },
      failedPayment
    );

    addToast('warning', 'Payment Rejected', `Payment evidence for #${order.orderNumber} rejected.`);

    addToast('warning', 'Payment Rejected', `Payment evidence for #${order.orderNumber} rejected.`);
    return true;
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    options?: { trackingNumber?: string; courier?: string; note?: string; overrideJustification?: string }
  ): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      addToast('error', 'Order Not Found', 'Order not found.');
      return false;
    }

    // Validate transition through authoritative state machine
    const validation = validateOrderTransition(
      order.status,
      newStatus,
      currentUser.role,
      options?.overrideJustification
    );

    if (!validation.isValid) {
      addToast('error', 'Invalid State Transition', validation.reason || 'Transition blocked by state machine.');
      return false;
    }

    const nowIso = new Date().toISOString();

    // Handle inventory state transitions
    if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      // Release reserved stock back to available pool
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          const orderVariantMap = new Map<string, number>(order.items.map((i) => [i.variantId, Number(i.quantity)]));
          const updatedVars = prod.variants.map((v) => {
            if (orderVariantMap.has(v.id)) {
              const qty = Number(orderVariantMap.get(v.id) || 0);
              const newReserved = Math.max(0, Number(v.reservedStock || 0) - qty);
              return { ...v, reservedStock: newReserved };
            }
            return v;
          });
          return { ...prod, variants: updatedVars };
        })
      );
    } else if (newStatus === 'SHIPPED' && order.status !== 'SHIPPED') {
      // Fulfill & decrement actual physical stock and release reservation
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          const orderVariantMap = new Map<string, number>(order.items.map((i) => [i.variantId, Number(i.quantity)]));
          const updatedVars = prod.variants.map((v) => {
            if (orderVariantMap.has(v.id)) {
              const qty = Number(orderVariantMap.get(v.id) || 0);
              const newStock = Math.max(0, Number(v.stock) - qty);
              const newReserved = Math.max(0, Number(v.reservedStock || 0) - qty);
              return {
                ...v,
                stock: newStock,
                reservedStock: newReserved,
                status: newStock > 0 ? v.status : 'OUT_OF_STOCK',
              };
            }
            return v;
          });
          return { ...prod, variants: updatedVars };
        })
      );
    }

    const historyEvent: OrderHistoryEvent = {
      id: `h-${Date.now()}`,
      orderId,
      timestamp: nowIso,
      fromStatus: order.status,
      toStatus: newStatus,
      actor: currentUser.name || currentUser.email,
      actorRole: currentUser.role,
      note:
        options?.note ||
        (options?.overrideJustification
          ? `Administrative Override: ${options.overrideJustification}`
          : `Order status moved to ${newStatus}.`),
    };

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: newStatus,
              trackingNumber: options?.trackingNumber || ord.trackingNumber,
              courier: options?.courier || ord.courier,
              trackingUrl: options?.trackingNumber
                ? `https://www.royalmail.com/track-your-item#/tracking-results/${options.trackingNumber}`
                : ord.trackingUrl,
              history: [...(ord.history || []), historyEvent],
              updatedAt: nowIso,
            }
          : ord
      )
    );

    // Notifications
    const updatedOrder = {
      ...order,
      status: newStatus,
      trackingNumber: options?.trackingNumber || order.trackingNumber,
      courier: options?.courier || order.courier,
      trackingUrl: options?.trackingNumber
        ? `https://www.royalmail.com/track-your-item#/tracking-results/${options.trackingNumber}`
        : order.trackingUrl,
      history: [...(order.history || []), historyEvent],
      updatedAt: nowIso,
    };

    let notifType: OrderNotification['type'] | null = null;
    if (newStatus === 'PROCESSING') notifType = 'ORDER_PROCESSING';
    else if (newStatus === 'SHIPPED') notifType = 'ORDER_SHIPPED';
    else if (newStatus === 'DELIVERED') notifType = 'ORDER_DELIVERED';
    else if (newStatus === 'CANCELLED') notifType = 'ORDER_CANCELLED';

    if (notifType) {
      const notif = createOrderNotification(notifType, updatedOrder);
      setNotifications((prev) => [notif, ...prev]);
    }

    const payment = payments.find((p) => p.orderId === orderId || p.id === order.paymentId);
    void persistAdminOrderRequest(updatedOrder, payment, notifType || undefined);

    logAuditEvent('ORDER_STATUS_CHANGED', 'ORDER', orderId, {
      orderNumber: order.orderNumber,
      oldStatus: order.status,
      newStatus,
      trackingNumber: options?.trackingNumber,
      justification: options?.overrideJustification,
    });

    addToast('success', 'Order Updated', `Order #${order.orderNumber} set to "${newStatus.replace('_', ' ')}".`);
    return true;
  };

  const cancelOrder = (orderId: string, reason?: string): boolean => {
    return updateOrderStatus(orderId, 'CANCELLED', { note: reason || 'Customer or Administrative Cancellation' });
  };

  const processRefund = (orderId: string, amount: number, reason: string): boolean => {
    if (!hasPermission(currentUser.role, 'ADMIN')) {
      addToast('error', 'Permission Denied', 'Administrative authority required for refund processing.');
      return false;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const nowIso = new Date().toISOString();
    const refundRecord: RefundRecord = {
      id: `ref-${Date.now()}`,
      orderId,
      amount,
      currency: order.currency || 'GBP',
      reason,
      status: 'PROCESSED',
      processedBy: currentUser.email,
      processedAt: nowIso,
      createdAt: nowIso,
    };

    setPayments((prev) =>
      prev.map((p) =>
        p.orderId === orderId
          ? {
              ...p,
              status: 'REFUNDED',
              refunds: [...(p.refunds || []), refundRecord],
              updatedAt: nowIso,
            }
          : p
      )
    );

    updateOrderStatus(orderId, 'REFUNDED', { note: `Refund processed: £${amount.toFixed(2)} - ${reason}` });

    const notif = createOrderNotification('REFUND_PROCESSED', order);
    setNotifications((prev) => [notif, ...prev]);

    logAuditEvent('REFUND_PROCESSED', 'PAYMENT', orderId, {
      orderNumber: order.orderNumber,
      amount,
      reason,
    });

    addToast('success', 'Refund Processed', `Refund of £${amount.toFixed(2)} recorded for Order #${order.orderNumber}.`);
    return true;
  };

  const sweepExpiredReservations = (): number => {
    const now = Date.now();
    let releasedCount = 0;

    for (const order of orders) {
      if (
        order.status === 'PENDING_PAYMENT' &&
        order.reservationExpiresAt &&
        new Date(order.reservationExpiresAt).getTime() < now
      ) {
        cancelOrder(order.id, 'Automatic cleanup of expired 24h inventory reservation.');
        releasedCount++;
      }
    }

    if (releasedCount > 0) {
      addToast('info', 'Reservations Swept', `Released ${releasedCount} expired order reservation(s).`);
    }
    return releasedCount;
  };

  const adjustVariantStock = (variantId: string, newStock: number, reason: string): boolean => {
    if (!hasPermission(currentUser.role, 'ADMIN')) {
      addToast('error', 'Unauthorized', 'Administrative permission required for inventory adjustments.');
      return false;
    }
    updateVariantStock(variantId, newStock, reason);
    return true;
  };

  const runCommerceTestSuite = (): TestSuiteReport => {
    const report = runAllCommerceTests();
    setTestSuiteReport(report);
    logAuditEvent('COMMERCE_TEST_SUITE_RUN', 'SYSTEM', 'TEST_RUNNER', {
      passed: report.passedTests,
      total: report.totalTests,
    });
    addToast(
      report.failedTests === 0 ? 'success' : 'warning',
      'Automated Test Suite Completed',
      `Executed ${report.totalTests} tests: ${report.passedTests} passed, ${report.failedTests} failed.`
    );
    return report;
  };

  // Catalogue Import / Export
  const importCatalogue = (summary: ImportSummary) => {
    const result = executeCatalogueImport(summary, products, categories, currentUser.email);
    setProducts(result.importedProducts);
    setCategories(result.updatedCategories);

    logAuditEvent('CATALOGUE_IMPORTED', 'PRODUCT', `Import Batch (${summary.validRows} rows)`, {
      created: summary.createCount,
      updated: summary.updateCount,
    });

    addToast(
      'success',
      'Catalogue Import Successful',
      `Imported ${summary.validRows} records. All newly created products placed into DRAFT status for review.`
    );
    return { count: summary.validRows };
  };

  const exportCatalogue = () => {
    const csv = exportCatalogueToCsv(products, categories);
    logAuditEvent('CATALOGUE_EXPORTED', 'PRODUCT', `Full Export (${products.length} products)`);
    return csv;
  };

  return (
    <StoreContext.Provider
      value={{
        currentPath,
        navigate,
        products,
        publishedProducts,
        categories: categoriesWithCounts,
        activeCategories,
        selectedCategorySlug,
        setSelectedCategorySlug,
        searchQuery,
        setSearchQuery,
        selectedProductSlug,
        selectProductBySlug,
        adminDraftPreviewMode,
        setAdminDraftPreviewMode,
        createProduct,
        updateProduct,
        saveProductMerchandising,
        setProductStatus,
        deleteProduct,
        bulkUpdateProductStatus,
        bulkUpdateProductCategory,
        inventoryTransactions,
        updateVariantStock,
        adjustVariantStock,
        updateVariantPrice,
        sweepExpiredReservations,
        createCategory,
        updateCategory,
        deleteCategory,
        batches,
        createBatch,
        updateBatch,
        addDocument,
        deleteDocument,
        shippingMethods,
        destinationCountryCode,
        setDestinationCountryCode,
        eligibleShippingCalculation,
        selectedShippingMethodId,
        setSelectedShippingMethodId,
        updateShippingMethod,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        createCoupon,
        updateCoupon,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartDrawerOpen,
        setCartDrawerOpen,
        cartTotals,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        settlement,
        wishlist,
        toggleWishlist,
        currency,
        setCurrency,
        currentUser,
        setUserRole,
        authReady,
        isAdminAuthenticated,
        isCustomerAuthenticated,
        isAccountAuthenticated,
        signInAdmin,
        signOutAdmin,
        signInCustomer,
        registerCustomer: registerCustomerAccount,
        signOutCustomer,
        orders,
        payments,
        notifications,
        createOrder,
        updateOrderStatus,
        submitPaymentEvidence,
        verifyPayment,
        rejectPayment,
        processRefund,
        cancelOrder,
        testSuiteReport,
        runCommerceTestSuite,
        auditLogs,
        logAuditEvent,
        importCatalogue,
        exportCatalogue,
        hasAcknowledgedResearchOnly,
        acknowledgeResearchOnly,
        complianceModalOpen,
        setComplianceModalOpen,
        cmsPages,
        updateCmsPage,
        storeSettings,
        updateStoreSettings,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
