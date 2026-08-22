import { ProductCategory } from '../../types';

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-peptides',
    name: 'Peptides & Analytical Standards',
    slug: 'peptides-and-analytical-standards',
    description:
      'High-purity synthetic peptide reference standards synthesized under ISO 9001 quality management (HPLC verified ≥99.0%).',
    sortOrder: 1,
    isActive: true,
    productCount: 40,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-sequences',
    name: 'Biochemical Sequences & Blends',
    slug: 'biochemical-sequences-and-blends',
    description:
      'Synergistic multi-peptide sequences and co-lyophilized formulation standards for dual and triple receptor binding assays.',
    sortOrder: 2,
    isActive: true,
    productCount: 12,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-nasal',
    name: 'Analytical Nasal & Solution Sprays',
    slug: 'analytical-nasal-and-solution-sprays',
    description:
      'Pre-dissolved volumetric metered sprays formulated in sterile isotonic saline for precise in-vitro diffusion and aerosol testing.',
    sortOrder: 3,
    isActive: true,
    productCount: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-reagents',
    name: 'Analytical Solvents & Media',
    slug: 'analytical-solvents-and-media',
    description:
      'USP-grade bacteriostatic reconstitution water, sterile saline, and analytical solvents for reconstitution and LC-MS chromatography.',
    sortOrder: 4,
    isActive: true,
    productCount: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-equipment',
    name: 'Laboratory Consumables & Filtration',
    slug: 'laboratory-consumables',
    description:
      'Medical-grade 0.22µm PES syringe filters, sterile crimped reconstitution vials, manual crimpers, and precision lab pipettes.',
    sortOrder: 5,
    isActive: true,
    productCount: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
