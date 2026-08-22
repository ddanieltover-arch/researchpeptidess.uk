/**
 * Research Peptides UK — Production Catalogue Import & Export Engine
 * Implements 8-step CSV / JSON validation, preview, conflict detection,
 * atomic batch importing with mandatory DRAFT status initialization,
 * and comprehensive CSV export.
 */

import { Product, ProductCategory, ImportSummary, ImportValidationRow, ProductStatus } from '../types';

/**
 * Robust CSV parser that handles quotes, escaped commas, and linebreaks.
 */
export function parseCsvText(csvText: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  // Parse header
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const nc = line[j + 1];

      if (c === '"') {
        if (inQuotes && nc === '"') {
          currentCell += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, '_'));
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] !== undefined ? values[idx] : '';
    });
    results.push(record);
  }

  return results;
}

/**
 * Validates an array of raw product records from CSV or JSON against the catalogue schema.
 */
export function validateCatalogueImport(
  rawRows: Array<Record<string, string | unknown>>,
  existingProducts: Product[],
  existingCategories: ProductCategory[]
): ImportSummary {
  const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));
  const existingSlugs = new Set(existingProducts.map((p) => p.slug.toLowerCase()));
  const existingVariantSkus = new Set(
    existingProducts.flatMap((p) => p.variants.map((v) => v.sku.toUpperCase()))
  );
  const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));

  const seenBatchSkus = new Set<string>();
  const seenBatchVariantSkus = new Set<string>();

  const rows: ImportValidationRow[] = [];
  let createCount = 0;
  let updateCount = 0;
  let errorRows = 0;

  rawRows.forEach((rowObj, index) => {
    const rowNumber = index + 2; // header is row 1
    const raw: Record<string, string> = {};
    for (const [key, val] of Object.entries(rowObj)) {
      raw[key.toLowerCase().replace(/[\s_-]+/g, '_')] = String(val ?? '').trim();
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const name = raw.name || raw.product_name || '';
    const slug = (raw.slug || raw.product_slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const sku = (raw.sku || raw.product_sku || '').toUpperCase();
    const categoryName = raw.category || raw.category_name || '';
    const shortDesc = raw.short_description || raw.description || '';
    const longDesc = raw.long_description || raw.description || shortDesc;
    const variantName = raw.variant_name || raw.size || 'Standard Unit';
    const variantSku = (raw.variant_sku || `${sku}-VAR`).toUpperCase();
    const priceStr = raw.price || raw.unit_price || '0';
    const stockStr = raw.stock_quantity || raw.stock || '0';

    // Required Fields Validation
    if (!name) errors.push('Missing required field: "name"');
    if (!slug) errors.push('Missing or invalid "slug"');
    if (!sku) errors.push('Missing required field: "sku"');
    if (!categoryName) errors.push('Missing required field: "category"');
    if (!shortDesc) errors.push('Missing required field: "short_description"');
    if (!variantSku) errors.push('Missing required field: "variant_sku"');

    // Number Validation
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (isNaN(price) || price <= 0) {
      errors.push(`Invalid price value: "${priceStr}". Must be a positive decimal.`);
    }

    const stock = parseInt(stockStr.replace(/[^0-9-]/g, ''), 10);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Invalid stock quantity: "${stockStr}". Must be a non-negative integer.`);
    }

    // Category Resolution
    const matchedCategory = categoryMap.get(categoryName.toLowerCase());
    if (!matchedCategory) {
      warnings.push(`Category "${categoryName}" does not exist yet. Will be auto-created during import.`);
    }

    // Duplicate Check within Batch
    if (seenBatchVariantSkus.has(variantSku)) {
      errors.push(`Duplicate variant SKU "${variantSku}" detected within this import batch.`);
    } else if (variantSku) {
      seenBatchVariantSkus.add(variantSku);
    }

    // Action Classification
    const isExistingProduct = existingSkus.has(sku) || existingSlugs.has(slug);
    let action: ImportValidationRow['action'] = 'CREATE';

    if (errors.length > 0) {
      action = 'ERROR';
      errorRows++;
    } else if (isExistingProduct) {
      action = 'UPDATE';
      updateCount++;
    } else {
      action = 'CREATE';
      createCount++;
    }

    rows.push({
      rowNumber,
      raw,
      action,
      productName: name,
      sku,
      slug,
      category: categoryName,
      variantName,
      price: isNaN(price) ? 0 : price,
      stock: isNaN(stock) ? 0 : stock,
      errors,
      warnings,
    });
  });

  return {
    totalRows: rows.length,
    validRows: rows.length - errorRows,
    errorRows,
    createCount,
    updateCount,
    rows,
    hasBlockingErrors: errorRows > 0,
  };
}

/**
 * Executes the atomic import, grouping variants under parent products and enforcing DRAFT status for new entries.
 */
export function executeCatalogueImport(
  summary: ImportSummary,
  existingProducts: Product[],
  existingCategories: ProductCategory[],
  actorEmail = 'admin@researchpeptides.co.uk'
): { importedProducts: Product[]; updatedCategories: ProductCategory[] } {
  if (summary.hasBlockingErrors) {
    throw new Error('Cannot execute import while blocking errors exist. Please fix validation errors first.');
  }

  const productsMap = new Map<string, Product>();
  existingProducts.forEach((p) => productsMap.set(p.sku.toUpperCase(), { ...p }));

  const categoriesMap = new Map<string, ProductCategory>();
  existingCategories.forEach((c) => categoriesMap.set(c.name.toLowerCase(), { ...c }));

  // Group valid rows by Product SKU
  const validRows = summary.rows.filter((r) => r.action !== 'ERROR');

  for (const row of validRows) {
    const raw = row.raw;
    const sku = row.sku;
    const catName = row.category;

    // Ensure Category Exists
    let category = categoriesMap.get(catName.toLowerCase());
    if (!category) {
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      category = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: catName,
        slug: catSlug,
        description: `Laboratory products categorized under ${catName}`,
        sortOrder: categoriesMap.size + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      categoriesMap.set(catName.toLowerCase(), category);
    }

    let product = productsMap.get(sku);

    if (!product) {
      // Create new Product in strict DRAFT status
      const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      product = {
        id: productId,
        name: row.productName,
        slug: row.slug || `imported-${Date.now()}`,
        sku: sku,
        categoryId: category.id,
        categoryName: category.name,
        shortDescription: raw.short_description || raw.description || '',
        longDescription: raw.description || raw.short_description || '',
        productType: raw.product_type || 'PEPTIDE',
        researchClassification: 'IN_VITRO_ONLY',
        status: 'DRAFT', // MANDATORY INITIAL STATE
        visibility: 'PUBLIC',
        isFeatured: raw.featured === 'true' || raw.featured === 'TRUE',
        researchOnly: true,
        casNumber: raw.cas_number || undefined,
        molecularFormula: raw.molecular_formula || undefined,
        molecularWeight: raw.molecular_weight ? parseFloat(raw.molecular_weight) : undefined,
        appearance: raw.appearance || 'Lyophilized White Powder',
        storageRequirements: raw.storage_requirements || 'Store sealed at -20°C in desiccated laboratory freezer',
        solubility: raw.solubility || 'Sterile Water / Bacteriostatic Laboratory Solvent',
        documentationStatus: 'PENDING',
        analyticalDataSource: 'UNAVAILABLE',
        createdBy: actorEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        variants: [],
        images: [
          {
            id: `img-${Date.now()}`,
            productId,
            url: raw.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
            altText: `${row.productName} Laboratory Vial`,
            sortOrder: 0,
            isPrimary: true,
          },
        ],
        documents: [],
      };
      productsMap.set(sku, product);
    } else {
      // Update existing
      product.updatedBy = actorEmail;
      product.updatedAt = new Date().toISOString();
      if (raw.short_description) product.shortDescription = raw.short_description;
      if (raw.description) product.longDescription = raw.description;
      if (raw.cas_number) product.casNumber = raw.cas_number;
      if (raw.molecular_formula) product.molecularFormula = raw.molecular_formula;
      if (raw.molecular_weight) product.molecularWeight = parseFloat(raw.molecular_weight);
    }

    // Add or Update Variant
    const variantSku = (raw.variant_sku || `${sku}-${row.variantName}`).toUpperCase();
    const existingVarIndex = product.variants.findIndex((v) => v.sku.toUpperCase() === variantSku);

    const variantData = {
      id: existingVarIndex >= 0 ? product.variants[existingVarIndex].id : `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      name: row.variantName,
      size: raw.quantity_value ? `${raw.quantity_value}${raw.quantity_unit || 'mg'}` : row.variantName,
      sku: variantSku,
      quantityValue: raw.quantity_value ? parseFloat(raw.quantity_value) : undefined,
      quantityUnit: raw.quantity_unit || 'mg',
      price: row.price,
      compareAtPrice: raw.compare_at_price ? parseFloat(raw.compare_at_price) : undefined,
      stock: row.stock,
      reservedStock: 0,
      lowStockThreshold: 5,
      status: row.stock > 0 ? ('ACTIVE' as const) : ('OUT_OF_STOCK' as const),
      sortOrder: product.variants.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingVarIndex >= 0) {
      product.variants[existingVarIndex] = {
        ...product.variants[existingVarIndex],
        ...variantData,
      };
    } else {
      product.variants.push(variantData);
    }
  }

  return {
    importedProducts: Array.from(productsMap.values()),
    updatedCategories: Array.from(categoriesMap.values()),
  };
}

/**
 * Generates an RFC-4180 compliant CSV string representing the entire product catalog for export.
 */
export function exportCatalogueToCsv(products: Product[], categories: ProductCategory[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    'name',
    'slug',
    'sku',
    'category',
    'short_description',
    'description',
    'product_type',
    'cas_number',
    'molecular_formula',
    'molecular_weight',
    'variant_name',
    'variant_sku',
    'quantity_value',
    'quantity_unit',
    'price',
    'compare_at_price',
    'stock_quantity',
    'featured',
    'research_only',
    'status',
  ];

  const escapeCell = (str: unknown): string => {
    const val = String(str ?? '').replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows: string[] = [headers.join(',')];

  for (const prod of products) {
    const catName = prod.categoryName || categoryMap.get(prod.categoryId) || 'Peptides';

    for (const v of prod.variants) {
      const row = [
        escapeCell(prod.name),
        escapeCell(prod.slug),
        escapeCell(prod.sku),
        escapeCell(catName),
        escapeCell(prod.shortDescription),
        escapeCell(prod.longDescription),
        escapeCell(prod.productType),
        escapeCell(prod.casNumber || ''),
        escapeCell(prod.molecularFormula || ''),
        escapeCell(prod.molecularWeight || ''),
        escapeCell(v.name),
        escapeCell(v.sku),
        escapeCell(v.quantityValue || ''),
        escapeCell(v.quantityUnit || 'mg'),
        escapeCell(v.price.toFixed(2)),
        escapeCell(v.compareAtPrice ? v.compareAtPrice.toFixed(2) : ''),
        escapeCell(v.stock),
        escapeCell(prod.isFeatured ? 'TRUE' : 'FALSE'),
        escapeCell(prod.researchOnly ? 'TRUE' : 'FALSE'),
        escapeCell(prod.status),
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\r\n');
}
