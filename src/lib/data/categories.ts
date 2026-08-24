import { ProductCategory } from '../../types';

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-peptides',
    name: 'Peptides & Analytical Standards',
    slug: 'peptides-and-analytical-standards',
    description:
      'Synthetic peptide reference materials for in-vitro laboratory research, with batch documentation shown only where records exist.',
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
      'Syringe filters, sterile crimped laboratory vials, manual crimpers, and precision lab pipettes listed for in-vitro workflow support.',
    sortOrder: 5,
    isActive: true,
    productCount: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-research-chemicals',
    name: 'Research Chemicals',
    slug: 'research-chemicals',
    description:
      'Non-peptide research chemicals are listed here only after catalogue, documentation, and eligibility review. No compounds are invented to fill this collection.',
    sortOrder: 6,
    isActive: true,
    productCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
