import { ProductCategory } from '../../types';

const CREATED_AT = '2026-01-01T00:00:00.000Z';

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-nootropics',
    name: 'Buy NOOTROPICS Online - Shop the Best NOOTROPICS Supplements',
    slug: 'buy-nootropics-online-shop-the-best-nootropics-supplements',
    description: 'Nootropic research compounds listed from the live shop collection.',
    sortOrder: 1,
    isActive: true,
    createdAt: CREATED_AT,
  },
  {
    id: 'cat-buy-peptides',
    name: 'Buy Peptides Online',
    slug: 'buy-peptides-online',
    description: 'Featured peptide listings from the live shop collection.',
    sortOrder: 2,
    isActive: true,
    createdAt: CREATED_AT,
  },
  {
    id: 'cat-sarms',
    name: 'Buy SARMs Online USA - High-Quality Liquid SARMs For Sale',
    slug: 'buy-sarms-online-usa-high-quality-liquid-sarms-for-sale',
    description: 'SARM and related research listings from the live shop collection.',
    sortOrder: 3,
    isActive: true,
    createdAt: CREATED_AT,
  },
  {
    id: 'cat-peptides',
    name: 'Peptides For Sale Online',
    slug: 'peptides-for-sale-online',
    description: 'Research peptides from the main live shop collection.',
    sortOrder: 4,
    isActive: true,
    createdAt: CREATED_AT,
  },
  {
    id: 'cat-research-chemicals',
    name: 'Research Chemicals To Buy',
    slug: 'research-chemicals-to-buy',
    description: 'Non-peptide research chemicals from the live shop collection.',
    sortOrder: 5,
    isActive: true,
    createdAt: CREATED_AT,
  },
];
