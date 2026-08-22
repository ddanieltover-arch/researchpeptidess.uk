import { Product } from '../../types';

export const PRODUCTS_REAGENTS: Product[] = [
  {
    id: 'prod-bac-water-10ml',
    name: 'Bacteriostatic Water for Injection (10mL Vial)',
    slug: 'bacteriostatic-water-10ml-vial',
    sku: 'RPUK-BAC10',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'USP-grade sterile water containing 0.9% benzyl alcohol preservative for analytical reconstitution.',
    longDescription: 'Sterile, non-pyrogenic water containing 0.9% (9 mg/mL) benzyl alcohol added as a bacteriostatic preservative for multiple laboratory draws.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: true,
    researchOnly: true,
    casNumber: '100-51-6 (benzyl alcohol)',
    appearance: 'Clear, Colourless Liquid in Crimp-Sealed Glass Vial',
    storageRequirements: 'Store at room temperature (15°C - 25°C), protect from freezing',
    solubility: 'Aqueous solvent vehicle',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-10T12:00:00.000Z',
    variants: [
      { id: 'var-bac10-single', productId: 'prod-bac-water-10ml', name: '10mL Sterile Multi-Dose Vial', size: '10mL', sku: 'RPUK-BAC10-1', quantityValue: 10, quantityUnit: 'ml', price: 4.95, compareAtPrice: 6.5, stock: 350, reservedStock: 10, lowStockThreshold: 30, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-bac10-1', productId: 'prod-bac-water-10ml', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', altText: 'Bacteriostatic Water 10mL Vial', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-bac-water-30ml',
    name: 'Bacteriostatic Water for Injection (30mL Vial)',
    slug: 'bacteriostatic-water-30ml-vial',
    sku: 'RPUK-BAC30',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'USP-grade 30mL sterile water containing 0.9% benzyl alcohol in multi-dose glass vial.',
    longDescription: 'High-volume 30mL laboratory dissolution vehicle prepared under ISO 5 cleanroom conditions with 0.9% benzyl alcohol.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: true,
    researchOnly: true,
    casNumber: '100-51-6 (benzyl alcohol)',
    appearance: 'Clear, Colourless Liquid in Crimp-Sealed Glass Vial',
    storageRequirements: 'Store at room temperature (15°C - 25°C)',
    solubility: 'Aqueous solvent vehicle',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-10T12:00:00.000Z',
    variants: [
      { id: 'var-bac30-single', productId: 'prod-bac-water-30ml', name: '30mL Sterile Multi-Dose Vial', size: '30mL', sku: 'RPUK-BAC30-1', quantityValue: 30, quantityUnit: 'ml', price: 8.95, compareAtPrice: 11.5, stock: 420, reservedStock: 15, lowStockThreshold: 40, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-bac30-1', productId: 'prod-bac-water-30ml', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80', altText: 'Bacteriostatic Water 30mL Sterile Bottle', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-bac-water-5pk',
    name: 'Bacteriostatic Water Laboratory Pack (5x 30mL)',
    slug: 'bacteriostatic-water-5x-30ml-pack',
    sku: 'RPUK-BAC30-5PK',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'Bulk laboratory multi-pack containing 5x 30mL USP-grade bacteriostatic vials.',
    longDescription: 'Economic 5-pack of sterile 30mL bacteriostatic water vials for high-throughput peptide analytical laboratories.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: 'Box of 5 Sterile Crimp-Sealed Glass Vials',
    storageRequirements: 'Store at room temperature (15°C - 25°C)',
    solubility: 'Aqueous solvent vehicle',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-11T12:00:00.000Z',
    variants: [
      { id: 'var-bac5pk', productId: 'prod-bac-water-5pk', name: '5x 30mL Laboratory Pack (150mL Total)', size: '5x 30mL', sku: 'RPUK-BAC30-5PK', quantityValue: 150, quantityUnit: 'ml', price: 37.95, compareAtPrice: 44.75, stock: 85, reservedStock: 0, lowStockThreshold: 10, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-bac5pk-1', productId: 'prod-bac-water-5pk', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', altText: 'Bacteriostatic Water 5-Pack Laboratory Display', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-sterile-saline',
    name: 'Sterile Analytical Saline 0.9% NaCl (30mL Vial)',
    slug: 'sterile-analytical-saline-09-nacl-30ml',
    sku: 'RPUK-SALINE30',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'Sterile isotonic 0.9% sodium chloride solvent for physiological pH in-vitro buffer preparation.',
    longDescription: 'Isotonic analytical grade sodium chloride solution prepared in pyrogen-free water for physiological assays.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    casNumber: '7647-14-5 (NaCl)',
    appearance: 'Clear, Colourless Liquid in Sealed Glass Vial',
    storageRequirements: 'Store at 15°C - 25°C',
    solubility: 'Isotonic aqueous vehicle',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-12T12:00:00.000Z',
    variants: [
      { id: 'var-saline-30ml', productId: 'prod-sterile-saline', name: '30mL Sterile Isotonic Vial', size: '30mL', sku: 'RPUK-SALINE30-1', quantityValue: 30, quantityUnit: 'ml', price: 6.95, compareAtPrice: 8.5, stock: 180, reservedStock: 2, lowStockThreshold: 20, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-saline-1', productId: 'prod-sterile-saline', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80', altText: 'Sterile Saline 0.9% Reagent Bottle', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-acetic-acid-solvent',
    name: '10mM Acetic Acid Peptide Solvent (30mL)',
    slug: '10mm-acetic-acid-peptide-solvent-30ml',
    sku: 'RPUK-ACET30',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'Sterile 10mM aqueous acetic acid vehicle specifically calibrated for recombinant IGF/GHRP dissolution.',
    longDescription: 'Mild acidic reconstitution vehicle recommended for hydrophobic and recombinant peptides to prevent aggregation.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    casNumber: '64-19-7 (acetic acid)',
    appearance: 'Clear, Colourless Liquid in Glass Vial',
    storageRequirements: 'Store at 15°C - 25°C',
    solubility: 'Acidic aqueous vehicle',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-12T12:00:00.000Z',
    variants: [
      { id: 'var-acet-30ml', productId: 'prod-acetic-acid-solvent', name: '30mL Sterile 10mM Acetic Acid Vial', size: '30mL', sku: 'RPUK-ACET30-1', quantityValue: 30, quantityUnit: 'ml', price: 7.95, compareAtPrice: 9.95, stock: 120, reservedStock: 0, lowStockThreshold: 15, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-acet-1', productId: 'prod-acetic-acid-solvent', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', altText: '10mM Acetic Acid Analytical Solvent', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-sterile-deionised-water',
    name: 'Sterile Analytical Deionised Water (30mL)',
    slug: 'sterile-analytical-deionised-water-30ml',
    sku: 'RPUK-DIWATER30',
    categoryId: 'cat-reagents',
    categoryName: 'Analytical Solvents & Media',
    shortDescription: 'High-purity Type I ultrapure deionised laboratory water for single-use LC-MS calibration.',
    longDescription: 'Endotoxin-free (<0.005 EU/mL) Type I deionised water (resistivity 18.2 MΩ·cm) in sterile crimped vial.',
    productType: 'SOLVENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    casNumber: '7732-18-5',
    appearance: 'Clear, Colourless Liquid',
    storageRequirements: 'Store at 15°C - 25°C',
    solubility: 'Ultrapure aqueous solvent',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-13T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-13T12:00:00.000Z',
    variants: [
      { id: 'var-diwater-30ml', productId: 'prod-sterile-deionised-water', name: '30mL Sterile DI Water Vial', size: '30mL', sku: 'RPUK-DIWATER30-1', quantityValue: 30, quantityUnit: 'ml', price: 5.95, compareAtPrice: 7.5, stock: 200, reservedStock: 1, lowStockThreshold: 25, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-diwater-1', productId: 'prod-sterile-deionised-water', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80', altText: 'Sterile Deionised Water Vial', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  }
];

export const PRODUCTS_EQUIPMENT: Product[] = [
  {
    id: 'prod-pes-filters-25pk',
    name: '0.22µm PES Syringe Filtration Units (Box of 25)',
    slug: '022um-pes-syringe-filters-25pk',
    sku: 'RPUK-PES25',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'Hydrophilic PES 33mm disc syringe filters for sterile cold sterilization of reconstituted peptides.',
    longDescription: 'Medical-grade 0.22 µm pore size Polyethersulfone membrane syringe filters. Low protein binding matrix in sterile individual blister packs.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: true,
    researchOnly: true,
    appearance: 'Box of 25 Individually Blister-Packed Sterile Filters',
    storageRequirements: 'Store in dry laboratory environment',
    solubility: 'N/A (Solid Filter Apparatus)',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-15T12:00:00.000Z',
    variants: [
      { id: 'var-pes-25pk', productId: 'prod-pes-filters-25pk', name: 'Box of 25 Units (0.22µm / 33mm)', size: '25 Units', sku: 'RPUK-PES25-BOX', quantityValue: 25, quantityUnit: 'units', price: 18.5, compareAtPrice: 22.0, stock: 90, reservedStock: 0, lowStockThreshold: 10, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-pes25-1', productId: 'prod-pes-filters-25pk', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80', altText: '0.22um PES Syringe Filters 25 Pack', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-pes-filters-100pk',
    name: '0.22µm PES Syringe Filtration Units (Box of 100 Bulk)',
    slug: '022um-pes-syringe-filters-100pk-bulk',
    sku: 'RPUK-PES100',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'High-throughput 100-pack of sterile 0.22µm PES syringe filters for laboratory sample prep.',
    longDescription: 'Bulk laboratory packaging of 100 individually sterile-wrapped 0.22 µm PES syringe filters.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: 'Box of 100 Individually Blister-Packed Sterile Filters',
    storageRequirements: 'Store in dry laboratory environment',
    solubility: 'N/A',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-15T12:00:00.000Z',
    variants: [
      { id: 'var-pes-100pk', productId: 'prod-pes-filters-100pk', name: 'Box of 100 Units (0.22µm / 33mm)', size: '100 Units', sku: 'RPUK-PES100-BOX', quantityValue: 100, quantityUnit: 'units', price: 59.0, compareAtPrice: 74.0, stock: 45, reservedStock: 0, lowStockThreshold: 5, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-pes100-1', productId: 'prod-pes-filters-100pk', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80', altText: '0.22um PES Syringe Filters 100 Bulk Box', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-glass-vials-10ml',
    name: 'Sterile Depyrogenated Glass Vials 10mL (Pack of 10)',
    slug: 'sterile-glass-vials-10ml-pack-of-10',
    sku: 'RPUK-VIAL10-10PK',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'Type I borosilicate glass 10mL vials with 20mm butyl stoppers and flip-off aluminium caps.',
    longDescription: 'Sterile, depyrogenated 10mL pharmaceutical borosilicate glass vials supplied with chlorobutyl septa.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: 'Pack of 10 Sterile Empty Sealed Glass Vials with Caps',
    storageRequirements: 'Store in dry laboratory environment',
    solubility: 'N/A',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-16T12:00:00.000Z',
    variants: [
      { id: 'var-vial10-10pk', productId: 'prod-glass-vials-10ml', name: 'Pack of 10 Vials (10mL + Caps)', size: '10 Vials', sku: 'RPUK-VIAL10-10PK', quantityValue: 10, quantityUnit: 'units', price: 12.95, compareAtPrice: 16.0, stock: 110, reservedStock: 0, lowStockThreshold: 15, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-vial10-1', productId: 'prod-glass-vials-10ml', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80', altText: 'Sterile 10mL Glass Reconstitution Vials', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-glass-vials-20ml',
    name: 'Sterile Depyrogenated Glass Vials 20mL (Pack of 10)',
    slug: 'sterile-glass-vials-20ml-pack-of-10',
    sku: 'RPUK-VIAL20-10PK',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'Type I borosilicate 20mL laboratory reconstitution vials with 20mm rubber septa.',
    longDescription: 'High-volume 20mL sterile empty glass vials designed for bulk reconstitution standard preparation.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: 'Pack of 10 Sterile Empty Glass Vials',
    storageRequirements: 'Store in clean environment',
    solubility: 'N/A',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-16T12:00:00.000Z',
    variants: [
      { id: 'var-vial20-10pk', productId: 'prod-glass-vials-20ml', name: 'Pack of 10 Vials (20mL + Caps)', size: '10 Vials', sku: 'RPUK-VIAL20-10PK', quantityValue: 10, quantityUnit: 'units', price: 16.95, compareAtPrice: 21.0, stock: 75, reservedStock: 0, lowStockThreshold: 10, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-vial20-1', productId: 'prod-glass-vials-20ml', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80', altText: 'Sterile 20mL Glass Vials Pack', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-crimper-tool',
    name: 'Manual 20mm Vial Hand Crimper & Decapper Tool',
    slug: 'manual-20mm-vial-hand-crimper-tool',
    sku: 'RPUK-CRIMP20',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'Precision stainless steel hand crimping instrument for sealing 20mm aluminium flip-off caps.',
    longDescription: 'Ergonomic laboratory manual hand crimper with micro-adjustable depth stop for hermetic vial sealing.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: 'Stainless Steel Hand Tool in Protective Foam Case',
    storageRequirements: 'Store dry',
    solubility: 'N/A',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-17T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-17T12:00:00.000Z',
    variants: [
      { id: 'var-crimper-20mm', productId: 'prod-crimper-tool', name: '20mm Hand Crimper Tool', size: '1 Unit', sku: 'RPUK-CRIMP20-TOOL', quantityValue: 1, quantityUnit: 'units', price: 49.95, compareAtPrice: 65.0, stock: 30, reservedStock: 0, lowStockThreshold: 5, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-crimper-1', productId: 'prod-crimper-tool', url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80', altText: 'Laboratory Vial Hand Crimper Instrument', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  },
  {
    id: 'prod-micro-pipette',
    name: 'Precision Analytical Laboratory Micro-Pipette (10-100µL)',
    slug: 'precision-analytical-micro-pipette-10-100ul',
    sku: 'RPUK-PIPETTE100',
    categoryId: 'cat-equipment',
    categoryName: 'Laboratory Consumables & Filtration',
    shortDescription: 'Autoclavable variable volume single-channel micropipette calibrated to ISO 8655 standards.',
    longDescription: 'High-precision volumetric micropipette with digital display, low plunger operating force, and calibration certificate.',
    productType: 'EQUIPMENT',
    researchClassification: 'BIOCHEMICAL_REAGENT',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: true,
    researchOnly: true,
    appearance: 'Calibrated Analytical Micropipette with Calibration Key & Oil',
    storageRequirements: 'Store upright on pipette stand at 20°C',
    solubility: 'N/A',
    documentationStatus: 'VERIFIED',
    analyticalDataSource: 'VERIFIED',
    createdBy: 'compliance@researchpeptides.co.uk',
    createdAt: '2026-01-17T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z',
    publishedAt: '2026-01-17T12:00:00.000Z',
    variants: [
      { id: 'var-pipette-100', productId: 'prod-micro-pipette', name: '10-100µL Variable Volume Pipette', size: '1 Unit', sku: 'RPUK-PIPETTE100-1', quantityValue: 1, quantityUnit: 'units', price: 64.95, compareAtPrice: 85.0, stock: 25, reservedStock: 0, lowStockThreshold: 4, status: 'ACTIVE' }
    ],
    images: [
      { id: 'img-pipette-1', productId: 'prod-micro-pipette', url: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?auto=format&fit=crop&w=800&q=80', altText: 'Precision Analytical Laboratory Micropipette', sortOrder: 0, isPrimary: true }
    ],
    documents: []
  }
];
