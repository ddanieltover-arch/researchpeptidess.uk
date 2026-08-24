import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { formatPrice, formatDate } from '../lib/utils';
import {
  Order,
  Product,
  ProductCategory,
  ProductStatus,
  Coupon,
  ProductBatch,
  ProductDocument,
  ImportSummary,
} from '../types';
import { parseCsvText, validateCatalogueImport } from '../lib/catalogue-import';
import { PaymentVerificationQueue } from '../components/admin/PaymentVerificationQueue';
import { OrderOperationsManager } from '../components/admin/OrderOperationsManager';
import { CommerceTestSuiteView } from '../components/admin/CommerceTestSuiteView';
import { InventoryLedgerView } from '../components/admin/InventoryLedgerView';
import { CmsManagerView } from '../components/admin/CmsManagerView';
import { StoreSettingsView } from '../components/admin/StoreSettingsView';
import { LaunchChecklistView } from '../components/admin/LaunchChecklistView';
import { PreLaunchQAMatrixView } from '../components/admin/PreLaunchQAMatrixView';
import { ObservabilityView } from '../components/admin/ObservabilityView';
import { AdminSignOutButton } from '../components/admin/AdminSignOutButton';
import { WidgetErrorBoundary } from '../components/system/ErrorBoundaries';
import { MerchandisingView } from '../components/admin/MerchandisingView';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  X,
  Package,
  Layers,
  Coins,
  Building2,
  FileCheck2,
  TrendingUp,
  AlertCircle,
  Eye,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  FileText,
  Tag,
  DollarSign,
  History,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  FlaskConical,
  CreditCard,
  ClipboardList,
  TestTube2,
  Box,
  Settings,
  Activity,
  CheckSquare,
  Globe,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const {
    orders,
    payments,
    inventoryTransactions,
    testSuiteReport,
    products,
    categories,
    shippingMethods,
    coupons,
    auditLogs,
    batches,
    updateOrderStatus,
    createProduct,
    updateProduct,
    setProductStatus,
    deleteProduct,
    bulkUpdateProductStatus,
    bulkUpdateProductCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    createCoupon,
    updateCoupon,
    createBatch,
    updateBatch,
    addDocument,
    deleteDocument,
    updateShippingMethod,
    importCatalogue,
    exportCatalogue,
    adminDraftPreviewMode,
    setAdminDraftPreviewMode,
    currency,
    currentUser,
    addToast,
    selectProductBySlug,
  } = useStore();

  type AdminTab =
    | 'products'
    | 'import_export'
    | 'categories'
    | 'batches_docs'
    | 'pricing_promotions'
    | 'orders_operations'
    | 'payments_verification'
    | 'inventory_ledger'
    | 'commerce_tests'
    | 'audit_logs'
    | 'cms_pages'
    | 'store_settings'
    | 'launch_checklist'
    | 'pre_launch_qa'
    | 'observability'
    | 'merchandising';

  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  // Product List Filters & Selection
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals state
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentProductId, setDocumentProductId] = useState<string>(products[0]?.id || '');

  // Order management state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  // Import state
  const [importCsvText, setImportCsvText] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isValidatingImport, setIsValidatingImport] = useState(false);

  // Form states
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    slug: '',
    sku: '',
    categoryId: categories[0]?.id || '',
    shortDescription: '',
    longDescription: '',
    productType: 'PEPTIDE',
    researchClassification: 'IN_VITRO_ONLY' as const,
    casNumber: '',
    molecularFormula: '',
    molecularWeight: '',
    sequence: '',
    purityValue: '99.4',
    appearance: 'Lyophilized White Powder',
    storageRequirements: 'Store sealed at -20°C in desiccated laboratory freezer',
    solubility: 'Sterile Water / Bacteriostatic Laboratory Solvent',
    status: 'DRAFT' as ProductStatus,
    variantSize: '5mg',
    variantPrice: '29.99',
    variantStock: '50',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    minSpend: 0,
    maxDiscount: 100,
    usageLimit: 500,
    isActive: true,
  });

  const [batchForm, setBatchForm] = useState({
    productId: products[0]?.id || '',
    batchNumber: '',
    purityValue: 99.4,
    testDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    certificateRef: '',
    notes: '',
    status: 'VERIFIED' as const,
  });

  const [docForm, setDocForm] = useState({
    productId: products[0]?.id || '',
    title: 'Certificate of Analysis (COA)',
    documentType: 'COA' as const,
    batchNumber: '',
    testDate: new Date().toISOString().split('T')[0],
    fileUrl: '#',
  });

  // Metrics
  const pendingPayments = payments.filter(
    (p) =>
      p.status === 'SUBMITTED' ||
      p.status === 'UNDER_REVIEW' ||
      p.status === 'AWAITING_CUSTOMER_ACTION'
  );
  const pendingOrders = orders.filter(
    (o) =>
      o.status === 'PENDING_PAYMENT' ||
      o.status === 'PAYMENT_SUBMITTED' ||
      o.status === 'PAYMENT_VERIFIED' ||
      o.status === 'PROCESSING'
  );
  const verifiedRevenue = orders
    .filter((o) => o.status === 'PAYMENT_VERIFIED' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.total, 0);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCas = p.casNumber?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCas) return false;
    }
    return true;
  });

  // Handle CSV Import Validation
  const handleValidateCsv = () => {
    if (!importCsvText.trim()) {
      addToast('error', 'Empty Input', 'Please paste CSV content or upload a CSV file.');
      return;
    }
    setIsValidatingImport(true);
    try {
      const rawRows = parseCsvText(importCsvText);
      if (rawRows.length === 0) {
        addToast('error', 'Parse Error', 'No valid rows found in CSV text.');
        setIsValidatingImport(false);
        return;
      }
      const summary = validateCatalogueImport(rawRows, products, categories);
      setImportSummary(summary);
      addToast(
        summary.hasBlockingErrors ? 'warning' : 'success',
        'Validation Completed',
        `Parsed ${summary.totalRows} rows: ${summary.validRows} valid (${summary.createCount} new, ${summary.updateCount} updates), ${summary.errorRows} errors.`
      );
    } catch (err: unknown) {
      addToast('error', 'Import Validation Failed', (err as Error).message || 'Invalid CSV syntax.');
    } finally {
      setIsValidatingImport(false);
    }
  };

  // Handle Import Execution
  const handleExecuteImport = () => {
    if (!importSummary || importSummary.hasBlockingErrors) {
      addToast('error', 'Cannot Execute', 'Please resolve all validation errors before importing.');
      return;
    }
    try {
      importCatalogue(importSummary);
      setImportSummary(null);
      setImportCsvText('');
      setActiveTab('products');
    } catch (err: unknown) {
      addToast('error', 'Import Execution Failed', (err as Error).message || 'An error occurred during import.');
    }
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportCsvText(content);
      addToast('info', 'File Loaded', `Loaded file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Click Validate.`);
    };
    reader.readAsText(file);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvData = exportCatalogue();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `research_peptides_catalogue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Catalogue Exported', 'Full catalogue CSV downloaded.');
  };

  // Create Product Submission
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sku) {
      addToast('error', 'Missing Information', 'Compound name and master SKU are required.');
      return;
    }

    const price = parseFloat(newProductForm.variantPrice) || 29.99;
    const stock = parseInt(newProductForm.variantStock, 10) || 50;
    const purity = parseFloat(newProductForm.purityValue) || 99.4;

    const created = createProduct({
      name: newProductForm.name,
      slug:
        newProductForm.slug ||
        newProductForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      sku: newProductForm.sku.toUpperCase(),
      categoryId: newProductForm.categoryId,
      shortDescription: newProductForm.shortDescription || 'Analytical reference standard.',
      longDescription: newProductForm.longDescription || newProductForm.shortDescription,
      productType: newProductForm.productType,
      researchClassification: newProductForm.researchClassification,
      status: newProductForm.status,
      casNumber: newProductForm.casNumber || undefined,
      molecularFormula: newProductForm.molecularFormula || undefined,
      molecularWeight: newProductForm.molecularWeight ? parseFloat(newProductForm.molecularWeight) : undefined,
      sequence: newProductForm.sequence || undefined,
      purityValue: purity,
      appearance: newProductForm.appearance,
      storageRequirements: newProductForm.storageRequirements,
      solubility: newProductForm.solubility,
      documentationStatus: 'PENDING',
      analyticalDataSource: 'UNAVAILABLE',
      variants: [
        {
          id: `var-${Date.now()}-1`,
          productId: '',
          name: `${newProductForm.variantSize} Lyophilized Vial`,
          size: newProductForm.variantSize,
          sku: `${newProductForm.sku.toUpperCase()}-${newProductForm.variantSize.toUpperCase()}`,
          price,
          stock,
          lowStockThreshold: 5,
          status: stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        },
      ],
    });

    setIsNewProductModalOpen(false);
    // Reset form
    setNewProductForm({
      name: '',
      slug: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      shortDescription: '',
      longDescription: '',
      productType: 'PEPTIDE',
      researchClassification: 'IN_VITRO_ONLY',
      casNumber: '',
      molecularFormula: '',
      molecularWeight: '',
      sequence: '',
      purityValue: '99.4',
      appearance: 'Lyophilized White Powder',
      storageRequirements: 'Store sealed at -20°C in desiccated laboratory freezer',
      solubility: 'Sterile Water / Bacteriostatic Laboratory Solvent',
      status: 'DRAFT',
      variantSize: '5mg',
      variantPrice: '29.99',
      variantStock: '50',
    });
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
  };

  // Payment Verification
  const handleVerifyPayment = (orderId: string) => {
    updateOrderStatus(orderId, 'payment_verified');
    addToast('success', 'Payment Verified', 'Order payment marked as verified and approved for cold packaging.');
  };

  const handleSetShipped = (orderId: string) => {
    if (!trackingCodeInput.trim()) {
      addToast('error', 'Tracking Required', 'Please enter a courier tracking number.');
      return;
    }
    updateOrderStatus(orderId, 'shipped', trackingCodeInput.trim());
    setSelectedOrder(null);
    setTrackingCodeInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Laboratory Management Portal & Data Pipeline' }]} />

      {/* Admin Header & Stat Cards */}
      <div className="border-b border-stone-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">
              Operations & Catalogue Pipeline
            </span>
            <Badge variant="scientific" size="sm">
              {currentUser.email}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950 tracking-tight mt-1">
            Laboratory Admin Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Draft Preview Toggle */}
          <label className="flex items-center gap-2 text-xs font-mono bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={adminDraftPreviewMode}
              onChange={(e) => setAdminDraftPreviewMode(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="font-semibold text-slate-800">Draft Preview Mode</span>
          </label>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsNewProductModalOpen(true)}
            className="font-mono text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Compound</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="font-mono text-xs gap-1.5 bg-white"
          >
            <Download className="h-4 w-4 text-amber-700" />
            <span>Export CSV</span>
          </Button>

          <AdminSignOutButton className="font-mono text-xs bg-white" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-800">Pending Payments</span>
          <div className="text-2xl font-black text-amber-950">{pendingPayments.length}</div>
          <span className="text-[10px] text-amber-700 font-sans block">Awaiting bank/crypto audit</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800">Verified Revenue</span>
          <div className="text-2xl font-black text-emerald-950">{formatPrice(verifiedRevenue, currency)}</div>
          <span className="text-[10px] text-emerald-700 font-sans block">Settled laboratory requisitions</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Catalogue Compounds</span>
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <span className="text-[10px] text-slate-500 font-sans block">
            {products.filter((p) => p.status === 'PUBLISHED').length} Published / {products.filter((p) => p.status === 'DRAFT').length} Draft
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Traceable Batches & COAs</span>
          <div className="text-2xl font-black text-slate-900">{batches.length}</div>
          <span className="text-[10px] text-slate-500 font-sans block">100% In-Vitro Compliant</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 gap-1 overflow-x-auto pb-0.5">
        {[
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'import_export', label: 'CSV / Data Pipeline', icon: Upload },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'batches_docs', label: `Batches & COAs (${batches.length})`, icon: FileCheck2 },
          { id: 'pricing_promotions', label: 'Pricing & Coupons', icon: Tag },
          { id: 'merchandising', label: 'Merchandising', icon: Sparkles },
          { id: 'orders_operations', label: `Orders (${orders.length})`, icon: Truck, badge: pendingOrders.length > 0 ? `${pendingOrders.length}` : undefined },
          { id: 'payments_verification', label: `Payments Queue (${payments.length})`, icon: CreditCard, badge: pendingPayments.length > 0 ? `${pendingPayments.length}` : undefined },
          { id: 'inventory_ledger', label: `Inventory & Stock`, icon: Box },
          { id: 'cms_pages', label: 'CMS & Policies', icon: FileText },
          { id: 'store_settings', label: 'Store Settings', icon: Settings },
          { id: 'launch_checklist', label: 'Launch Checklist', icon: CheckSquare },
          { id: 'pre_launch_qa', label: 'Pre-Launch QA', icon: ShieldCheck },
          { id: 'observability', label: 'Observability', icon: Activity },
          { id: 'commerce_tests', label: 'Commerce Test Suite', icon: TestTube2, badge: testSuiteReport ? (testSuiteReport.overallPassed ? '✓' : 'FAIL') : undefined },
          { id: 'audit_logs', label: `Audit Log (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-amber-600 text-slate-950 bg-amber-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-white rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCT CATALOGUE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter & Bulk Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Input
                  placeholder="Search compound, SKU, CAS..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  startIcon={<Search className="h-4 w-4" />}
                  className="text-xs h-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-md px-3 py-1.5 font-mono focus:border-amber-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">Draft Only</option>
                <option value="REVIEW">Under Review</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-md px-3 py-1.5 font-mono focus:border-amber-600"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Action Controls */}
            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 p-1.5 px-3 rounded-lg border border-amber-200 text-xs font-mono">
                <span className="font-bold text-amber-900">{selectedProductIds.length} Selected:</span>
                <button
                  onClick={() => {
                    bulkUpdateProductStatus(selectedProductIds, 'PUBLISHED');
                    setSelectedProductIds([]);
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                >
                  Publish All
                </button>
                <button
                  onClick={() => {
                    bulkUpdateProductStatus(selectedProductIds, 'DRAFT');
                    setSelectedProductIds([]);
                  }}
                  className="px-2 py-1 bg-stone-700 text-white rounded hover:bg-stone-800 cursor-pointer"
                >
                  Set Draft
                </button>
                <button
                  onClick={() => {
                    bulkUpdateProductStatus(selectedProductIds, 'ARCHIVED');
                    setSelectedProductIds([]);
                  }}
                  className="px-2 py-1 bg-rose-700 text-white rounded hover:bg-rose-800 cursor-pointer"
                >
                  Archive
                </button>
              </div>
            )}
          </div>

          {/* Product Table */}
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredProducts.length > 0 &&
                          selectedProductIds.length === filteredProducts.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(filteredProducts.map((p) => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">Compound / Master SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Purity (HPLC)</th>
                    <th className="p-3">Variants & Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans text-xs">
                        No compounds found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);

                      return (
                        <tr key={p.id} className={`hover:bg-stone-50/80 transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds((prev) => [...prev, p.id]);
                                } else {
                                  setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-sans text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-500">
                              SKU: {p.sku} {p.casNumber ? `| CAS: ${p.casNumber}` : ''}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-700">{p.categoryName || 'General'}</span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                p.status === 'PUBLISHED'
                                  ? 'success'
                                  : p.status === 'DRAFT'
                                  ? 'warning'
                                  : p.status === 'REVIEW'
                                  ? 'scientific'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-800">
                              {p.purityValue ? `≥${p.purityValue}%` : 'Pending test'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-900 font-bold">{totalStock} units</div>
                            <div className="text-[10px] text-slate-500">
                              {p.variants.length} variant{p.variants.length > 1 ? 's' : ''} ({p.variants.map((v) => v.size).join(', ')})
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status !== 'PUBLISHED' ? (
                                <button
                                  onClick={() => setProductStatus(p.id, 'PUBLISHED')}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-100 text-[10px] font-bold cursor-pointer"
                                  title="Publish Compound to Storefront"
                                >
                                  Publish
                                </button>
                              ) : (
                                <button
                                  onClick={() => setProductStatus(p.id, 'DRAFT')}
                                  className="px-2 py-1 bg-stone-100 text-stone-700 border border-stone-300 rounded hover:bg-stone-200 text-[10px] font-bold cursor-pointer"
                                  title="Unpublish & Return to Draft"
                                >
                                  Unpublish
                                </button>
                              )}

                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1 text-slate-600 hover:text-slate-900 border border-stone-200 rounded bg-white hover:bg-stone-100 cursor-pointer"
                                title="Edit Specifications & Pricing"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => selectProductBySlug(p.slug)}
                                className="p-1 text-amber-700 hover:text-amber-900 border border-amber-200 rounded bg-amber-50 hover:bg-amber-100 cursor-pointer"
                                title="View Storefront Detail Page"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Permanently delete "${p.name}"?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:text-rose-800 border border-rose-200 rounded bg-rose-50 hover:bg-rose-100 cursor-pointer"
                                title="Delete Compound"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CSV / DATA PIPELINE (IMPORT & EXPORT) */}
      {/* ========================================================================= */}
      {activeTab === 'import_export' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Overview Banner */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950 uppercase">
                  Production Catalogue Batch Ingestion Pipeline
                </h3>
                <p className="text-slate-500 font-sans text-xs mt-0.5">
                  Import catalogue records via CSV text or file upload. Enforces 8-step validation, schema integrity, and automatically initializes new compounds in DRAFT status.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/catalog-import-template.csv"
                  download="catalog-import-template.csv"
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded border border-stone-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>Download CSV Template</span>
                </a>
              </div>
            </div>

            {/* Ingestion Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-[11px] font-sans">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-slate-900 block font-mono">1. Prepare Data</span>
                <span className="text-slate-600">CSV with headers: name, slug, sku, category, price, stock, etc.</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-slate-900 block font-mono">2. Upload / Paste</span>
                <span className="text-slate-600">Load RFC-4180 compliant CSV format into the pipeline editor.</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-slate-900 block font-mono">3. Validate & Preview</span>
                <span className="text-slate-600">Inspect parsed rows, conflict detections, and missing values.</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-950">
                <span className="font-bold block font-mono">4. Atomic Ingestion</span>
                <span className="text-amber-900">New items enter DRAFT status for compliance sign-off.</span>
              </div>
            </div>
          </div>

          {/* Import Editor & Upload Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="font-bold uppercase text-slate-900 text-xs">
                  CSV Input / File Content:
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-1 bg-white border border-stone-300 rounded hover:bg-stone-50 font-bold text-slate-700 text-xs flex items-center gap-1.5 shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-amber-600" />
                    <span>Upload CSV File</span>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleValidateCsv}
                    isLoading={isValidatingImport}
                    className="h-8 text-xs font-mono"
                  >
                    <span>Validate CSV</span>
                  </Button>
                </div>
              </div>

              <textarea
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder='Paste raw CSV here or upload a file... E.g. name,slug,sku,category,short_description,description,product_type,cas_number,molecular_formula,molecular_weight,variant_name,variant_sku,quantity_value,quantity_unit,price,compare_at_price,stock_quantity,featured,research_only,status'
                rows={8}
                className="w-full bg-stone-900 text-amber-300 font-mono text-[11px] p-3 rounded-xl border border-stone-800 focus:outline-none focus:border-amber-500 leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Validation Summary & Preview Table */}
          {importSummary && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Status Bar */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  importSummary.hasBlockingErrors
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {importSummary.hasBlockingErrors ? (
                    <AlertTriangle className="h-5 w-5 text-rose-700 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-sm">
                      {importSummary.hasBlockingErrors
                        ? `Validation Blocked: ${importSummary.errorRows} Errors Detected`
                        : `Ready to Ingest: ${importSummary.validRows} Records Validated`}
                    </span>
                    <span className="text-[11px] font-sans opacity-85">
                      {importSummary.createCount} new compounds to create (initial DRAFT status) • {importSummary.updateCount} existing compounds to update.
                    </span>
                  </div>
                </div>

                {!importSummary.hasBlockingErrors && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleExecuteImport}
                    className="font-mono text-xs shadow-sm"
                  >
                    Execute Ingestion Pipeline
                  </Button>
                )}
              </div>

              {/* Row-by-Row Table */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                <div className="p-3 bg-stone-50 border-b border-stone-200 font-bold uppercase text-[10px] text-slate-700">
                  Validation Log & Row Breakdown
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-[10px] text-slate-600 uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Product Name & Variant</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Price</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5">Validation Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {importSummary.rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={
                            row.action === 'ERROR'
                              ? 'bg-rose-50/50'
                              : row.action === 'CREATE'
                              ? 'bg-emerald-50/20'
                              : ''
                          }
                        >
                          <td className="p-2.5 font-bold">{row.rowNumber}</td>
                          <td className="p-2.5">
                            <Badge
                              variant={
                                row.action === 'CREATE'
                                  ? 'success'
                                  : row.action === 'UPDATE'
                                  ? 'scientific'
                                  : 'error'
                              }
                              size="sm"
                            >
                              {row.action}
                            </Badge>
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block font-sans">{row.productName}</span>
                            <span className="text-[10px] text-slate-500">{row.variantName}</span>
                          </td>
                          <td className="p-2.5">{row.sku}</td>
                          <td className="p-2.5">{row.category}</td>
                          <td className="p-2.5 font-bold">£{row.price.toFixed(2)}</td>
                          <td className="p-2.5">{row.stock}</td>
                          <td className="p-2.5">
                            {row.errors.length > 0 ? (
                              <div className="text-rose-700 text-[10px]">
                                {row.errors.join('; ')}
                              </div>
                            ) : row.warnings.length > 0 ? (
                              <div className="text-amber-700 text-[10px]">
                                {row.warnings.join('; ')}
                              </div>
                            ) : (
                              <span className="text-emerald-700 text-[10px]">Passed validation</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 uppercase">
              Product Categories ({categories.length})
            </h3>
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                setCategoryForm({ name: '', slug: '', description: '', isActive: true });
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="text-xs font-mono"
            >
              + Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">ID: {cat.id}</span>
                    <h4 className="text-base font-bold text-slate-900 font-sans">{cat.name}</h4>
                    <span className="text-xs text-amber-700 block mt-0.5">/category/{cat.slug}</span>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'neutral'} size="sm">
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="text-slate-600 font-sans text-xs">{cat.description}</p>

                <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {products.filter((p) => p.categoryId === cat.id).length} compounds assigned
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-stone-50"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description,
                          isActive: cat.isActive,
                        });
                        setIsCategoryModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-800 rounded border border-rose-200 bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BATCH RECORDS & DOCUMENTATION (COA / HPLC) */}
      {/* ========================================================================= */}
      {activeTab === 'batches_docs' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase">
                Laboratory Traceable Batches & Analytical Certificates
              </h3>
              <p className="text-slate-500 font-sans text-xs mt-0.5">
                Manage traceable ISO 17025 certificate files, HPLC reports, and batch quality records.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => setIsBatchModalOpen(true)}
                className="text-xs font-mono"
              >
                + Register New Batch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDocumentModalOpen(true)}
                className="text-xs font-mono bg-white"
              >
                + Attach Document (COA)
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase font-bold text-[10px] text-slate-600">
                <tr>
                  <th className="p-3">Batch Reference</th>
                  <th className="p-3">Compound</th>
                  <th className="p-3">Purity (HPLC)</th>
                  <th className="p-3">Test Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cert Reference</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      No batch records registered yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const prod = products.find((p) => p.id === b.productId);
                    return (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="p-3 font-bold text-slate-900">{b.batchNumber}</td>
                        <td className="p-3 font-sans text-slate-800">{prod?.name || 'Unassigned'}</td>
                        <td className="p-3 font-bold text-emerald-700">
                          {b.purityValue ? `≥${b.purityValue}%` : 'N/A'}
                        </td>
                        <td className="p-3 text-slate-600">{b.testDate || 'N/A'}</td>
                        <td className="p-3">
                          <Badge variant={b.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-500">{b.certificateRef || 'In-House'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => addToast('info', 'Batch Audit', `Audited batch ${b.batchNumber}`)}
                            className="px-2 py-1 bg-stone-100 text-slate-700 rounded hover:bg-stone-200 text-[10px] font-bold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PRICING TIERS & COUPONS */}
      {/* ========================================================================= */}
      {activeTab === 'pricing_promotions' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Coupons Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950 uppercase">
                Promotional Vouchers & Coupons ({coupons.length})
              </h3>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponForm({
                    code: '',
                    description: '',
                    discountType: 'PERCENTAGE',
                    discountValue: 10,
                    minSpend: 0,
                    maxDiscount: 100,
                    usageLimit: 500,
                    isActive: true,
                  });
                  setIsCouponModalOpen(true);
                }}
                className="text-xs font-mono"
              >
                + Create Coupon
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-amber-700 font-mono tracking-wider">
                      {c.code}
                    </span>
                    <Badge variant={c.isActive ? 'success' : 'neutral'} size="sm">
                      {c.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 font-sans text-xs">{c.description}</p>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-stone-100">
                    <div>Discount: {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Off` : `£${c.discountValue} Off`}</div>
                    <div>Min Spend: £{c.minSpend || 0} | Max Discount: £{c.maxDiscount || 'Unlimited'}</div>
                    <div>Used: {c.usedCount} / {c.usageLimit || '∞'} times</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Configuration */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h3 className="text-sm font-bold text-slate-950 uppercase">
              Courier Delivery & Shipping Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shippingMethods.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-sans">{m.name}</span>
                    <span className="font-bold text-amber-700">£{m.price.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div>Zone: {m.zone}</div>
                    <div>Carrier: {m.carrier}</div>
                    <div>Free Threshold: {m.freeShippingThreshold ? `£${m.freeShippingThreshold.toFixed(2)}` : 'No Free Shipping'}</div>
                    <div>Estimated: {m.estimatedDays}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'merchandising' && (
        <WidgetErrorBoundary name="Merchandising">
          <MerchandisingView />
        </WidgetErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ORDER OPERATIONS & FULFILLMENT */}
      {/* ========================================================================= */}
      {activeTab === 'orders_operations' && (
        <WidgetErrorBoundary name="Order operations">
          <OrderOperationsManager />
        </WidgetErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PAYMENT AUDIT & VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'payments_verification' && (
        <WidgetErrorBoundary name="Payment verification">
          <PaymentVerificationQueue />
        </WidgetErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: INVENTORY LEDGER & STOCK CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'inventory_ledger' && (
        <WidgetErrorBoundary name="Inventory ledger">
          <InventoryLedgerView />
        </WidgetErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: COMMERCE TEST SUITE & VERIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'commerce_tests' && (
        <CommerceTestSuiteView />
      )}

      {/* ========================================================================= */}
      {/* TAB 10: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 uppercase">
              System Audit Ledger ({auditLogs.length} Events)
            </h3>
            <span className="text-slate-500 text-[11px]">ISO / GxP Compliance Tracking</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase font-bold text-[10px] text-slate-600">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type & ID</th>
                  <th className="p-3">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="p-3 text-slate-500 text-[10px]">{formatDate(log.createdAt)}</td>
                    <td className="p-3 font-bold text-slate-800">{log.actor}</td>
                    <td className="p-3">
                      <Badge variant="scientific" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="p-3 text-[10px] text-slate-500 font-mono">
                      {log.payload ? JSON.stringify(log.payload) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: CMS & POLICY PAGES MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'cms_pages' && (
        <CmsManagerView />
      )}

      {/* ========================================================================= */}
      {/* TAB 12: STORE SETTINGS & BUSINESS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'store_settings' && (
        <StoreSettingsView />
      )}

      {/* ========================================================================= */}
      {/* TAB 13: PRE-LAUNCH CHECKLIST */}
      {/* ========================================================================= */}
      {activeTab === 'launch_checklist' && (
        <LaunchChecklistView />
      )}

      {/* ========================================================================= */}
      {/* TAB 14: PRE-LAUNCH QA TEST MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'pre_launch_qa' && (
        <PreLaunchQAMatrixView />
      )}

      {/* ========================================================================= */}
      {/* TAB 15: OBSERVABILITY & CORRELATION LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'observability' && (
        <WidgetErrorBoundary name="Observability">
          <ObservabilityView />
        </WidgetErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW COMPOUND */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        title="Register New Laboratory Compound (Enters DRAFT Status)"
      >
        <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Compound Name *</label>
              <Input
                required
                placeholder="e.g. BPC-157 Reference Standard"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Master SKU *</label>
              <Input
                required
                placeholder="e.g. RPUK-BPC157"
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Category *</label>
              <select
                value={newProductForm.categoryId}
                onChange={(e) => setNewProductForm({ ...newProductForm, categoryId: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-md p-2 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">CAS Registry Number</label>
              <Input
                placeholder="e.g. 137525-51-0"
                value={newProductForm.casNumber}
                onChange={(e) => setNewProductForm({ ...newProductForm, casNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1">Short Description (In-Vitro Analytical Scope) *</label>
            <Input
              required
              placeholder="e.g. Pentadecapeptide analytical standard with HPLC verified purity ≥99.0%."
              value={newProductForm.shortDescription}
              onChange={(e) => setNewProductForm({ ...newProductForm, shortDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Initial Format</label>
              <Input
                value={newProductForm.variantSize}
                onChange={(e) => setNewProductForm({ ...newProductForm, variantSize: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Price (£)</label>
              <Input
                value={newProductForm.variantPrice}
                onChange={(e) => setNewProductForm({ ...newProductForm, variantPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Initial Stock</label>
              <Input
                value={newProductForm.variantStock}
                onChange={(e) => setNewProductForm({ ...newProductForm, variantStock: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 text-[11px] font-sans">
            Note: Newly created compounds enter <strong>DRAFT</strong> status by default to satisfy catalogue governance policies. You can publish this compound from the catalogue table once all laboratory certificates are verified.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <Button variant="outline" type="button" onClick={() => setIsNewProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Register Compound
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PRODUCT SPECIFICATIONS */}
      {/* ========================================================================= */}
      {editingProduct && (
        <Modal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Edit Compound Specifications: ${editingProduct.name}`}
        >
          <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Product Name</label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">CAS Registry Number</label>
                <Input
                  value={editingProduct.casNumber || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, casNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Molecular Formula</label>
                <Input
                  value={editingProduct.molecularFormula || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, molecularFormula: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Molecular Weight (g/mol)</label>
                <Input
                  value={editingProduct.molecularWeight ? String(editingProduct.molecularWeight) : ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      molecularWeight: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Sequence / Chemical Formula</label>
              <Input
                value={editingProduct.sequence || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, sequence: e.target.value })}
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Storage Requirements</label>
              <Input
                value={editingProduct.storageRequirements}
                onChange={(e) => setEditingProduct({ ...editingProduct, storageRequirements: e.target.value })}
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Solubility / Laboratory Solvents</label>
              <Input
                value={editingProduct.solubility}
                onChange={(e) => setEditingProduct({ ...editingProduct, solubility: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" type="button" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button variant="gold" type="submit">
                Save Specifications
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPATCH ORDER & TRACKING CODE */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Cold Dispatch Requisition #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1 font-sans">
              <div className="font-bold text-slate-900">{selectedOrder.customerName}</div>
              <div className="text-slate-600">{selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postcode}</div>
              <div className="text-amber-800 font-mono font-bold">Total: {formatPrice(selectedOrder.total, currency)} ({selectedOrder.paymentMethod})</div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Enter Royal Mail / Courier Tracking Reference:
              </label>
              <Input
                placeholder="e.g. GB-RM-2026-902144"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => handleSetShipped(selectedOrder.id)}>
                Confirm Cold Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER BATCH */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Register Laboratory Test Batch"
      >
        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="font-bold text-slate-900 block mb-1">Select Compound</label>
            <select
              value={batchForm.productId}
              onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
              className="w-full bg-stone-50 border border-stone-300 rounded-md p-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Batch Number</label>
              <Input
                placeholder="e.g. UK-2026-B892"
                value={batchForm.batchNumber}
                onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">HPLC Purity (%)</label>
              <Input
                value={String(batchForm.purityValue)}
                onChange={(e) => setBatchForm({ ...batchForm, purityValue: parseFloat(e.target.value) || 99.4 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Chromatography Date</label>
              <Input
                type="date"
                value={batchForm.testDate}
                onChange={(e) => setBatchForm({ ...batchForm, testDate: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Certificate Ref</label>
              <Input
                placeholder="e.g. COA-BPC157-UK2026B892"
                value={batchForm.certificateRef}
                onChange={(e) => setBatchForm({ ...batchForm, certificateRef: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <Button variant="outline" onClick={() => setIsBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                createBatch(batchForm);
                setIsBatchModalOpen(false);
              }}
            >
              Save Batch Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ATTACH DOCUMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        title="Attach Laboratory Document / Certificate (PDF)"
      >
        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="font-bold text-slate-900 block mb-1">Target Compound</label>
            <select
              value={docForm.productId}
              onChange={(e) => setDocForm({ ...docForm, productId: e.target.value })}
              className="w-full bg-stone-50 border border-stone-300 rounded-md p-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1">Document Title</label>
            <Input
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Document Classification</label>
              <select
                value={docForm.documentType}
                onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-300 rounded-md p-2"
              >
                <option value="COA">Certificate of Analysis (COA)</option>
                <option value="HPLC_SPECTROMETRY">HPLC Spectrometry Report</option>
                <option value="MSDS">Material Safety Data Sheet (MSDS)</option>
                <option value="SPEC_SHEET">Specification Sheet</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Traceable Batch Number</label>
              <Input
                placeholder="e.g. UK-2026-B892"
                value={docForm.batchNumber}
                onChange={(e) => setDocForm({ ...docForm, batchNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                addDocument(docForm);
                setIsDocumentModalOpen(false);
              }}
            >
              Attach Document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
