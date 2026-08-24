import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import type { Product } from '../../src/types';
import { categories, productImages, products, productVariants } from '../../src/db/schema';
import { ROOT } from './paths';

config({ path: path.join(ROOT, '.env') });

const INITIAL_CATEGORIES = [
  {
    id: 'cat-peptides',
    name: 'Peptides & Analytical Standards',
    slug: 'peptides-and-analytical-standards',
    description:
      'High-purity synthetic peptide reference standards synthesized under ISO 9001 quality management (HPLC verified ≥99.0%).',
    sortOrder: 1,
  },
  {
    id: 'cat-sequences',
    name: 'Biochemical Sequences & Blends',
    slug: 'biochemical-sequences-and-blends',
    description:
      'Synergistic multi-peptide sequences and co-lyophilized formulation standards for dual and triple receptor binding assays.',
    sortOrder: 2,
  },
  {
    id: 'cat-nasal',
    name: 'Analytical Nasal & Solution Sprays',
    slug: 'analytical-nasal-and-solution-sprays',
    description:
      'Pre-dissolved volumetric metered sprays formulated in sterile isotonic saline for precise in-vitro diffusion and aerosol testing.',
    sortOrder: 3,
  },
  {
    id: 'cat-reagents',
    name: 'Analytical Solvents & Media',
    slug: 'analytical-solvents-and-media',
    description:
      'USP-grade bacteriostatic reconstitution water, sterile saline, and analytical solvents for reconstitution and LC-MS chromatography.',
    sortOrder: 4,
  },
  {
    id: 'cat-equipment',
    name: 'Laboratory Consumables & Filtration',
    slug: 'laboratory-consumables',
    description:
      'Medical-grade 0.22µm PES syringe filters, sterile crimped reconstitution vials, manual crimpers, and precision lab pipettes.',
    sortOrder: 5,
  },
];

function poundsToPence(value: number): number {
  return Math.round(value * 100);
}

export async function seedNeon(allProducts: Product[]): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('sample-project')) {
    throw new Error('DATABASE_URL is not configured');
  }

  const db = drizzle(neon(url));
  const now = new Date();

  for (const category of INITIAL_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          updatedAt: now,
        },
      });
  }

  for (const product of allProducts) {
    await db.execute(
      sql`delete from products where (slug = ${product.slug} or sku = ${product.sku}) and id <> ${product.id}`
    );

    await db
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: product.categoryId,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        productType: product.productType,
        status: product.status,
        visibility: product.visibility,
        isFeatured: product.isFeatured,
        researchOnly: product.researchOnly,
        researchClassification: product.researchClassification,
        casNumber: product.casNumber,
        molecularFormula: product.molecularFormula,
        molecularWeight: product.molecularWeight != null ? String(product.molecularWeight) : null,
        sequence: product.sequence,
        purityValue: product.purityValue != null ? String(product.purityValue) : null,
        manufacturer: product.manufacturer,
        origin: product.origin,
        appearance: product.appearance,
        storageRequirements: product.storageRequirements,
        solubility: product.solubility,
        documentationStatus: product.documentationStatus,
        analyticalDataSource: product.analyticalDataSource,
        createdBy: product.createdBy,
        updatedBy: product.updatedBy,
        publishedAt: product.publishedAt ? new Date(product.publishedAt) : now,
        createdAt: product.createdAt ? new Date(product.createdAt) : now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          productType: product.productType,
          status: product.status,
          visibility: product.visibility,
          isFeatured: product.isFeatured,
          casNumber: product.casNumber,
          molecularFormula: product.molecularFormula,
          molecularWeight: product.molecularWeight != null ? String(product.molecularWeight) : null,
          sequence: product.sequence,
          purityValue: product.purityValue != null ? String(product.purityValue) : null,
          appearance: product.appearance,
          storageRequirements: product.storageRequirements,
          solubility: product.solubility,
          documentationStatus: product.documentationStatus,
          analyticalDataSource: product.analyticalDataSource,
          updatedBy: 'woocommerce-sync',
          updatedAt: now,
        },
      });

    await db.execute(sql`delete from product_variants where product_id = ${product.id}`);
    await db.execute(sql`delete from product_images where product_id = ${product.id}`);

    for (const [index, variant] of product.variants.entries()) {
      await db.execute(sql`delete from product_variants where sku = ${variant.sku} and product_id <> ${product.id}`);
      await db.insert(productVariants).values({
        id: variant.id,
        productId: product.id,
        name: variant.name,
        size: variant.size,
        sku: variant.sku,
        quantityValue: variant.quantityValue != null ? String(variant.quantityValue) : null,
        quantityUnit: variant.quantityUnit || 'mg',
        pricePence: poundsToPence(variant.price),
        compareAtPricePence: variant.compareAtPrice != null ? poundsToPence(variant.compareAtPrice) : null,
        stockQuantity: variant.stock,
        reservedQuantity: variant.reservedStock || 0,
        lowStockThreshold: variant.lowStockThreshold,
        status: variant.status,
        sortOrder: variant.sortOrder ?? index,
        purityScore: variant.purityScore != null ? String(variant.purityScore) : null,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const image of product.images) {
      await db.insert(productImages).values({
        id: image.id,
        productId: product.id,
        url: image.url,
        altText: image.altText,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
        createdAt: now,
      });
    }
  }
}

export function envFileExists(): boolean {
  return fs.existsSync(path.join(ROOT, '.env'));
}
