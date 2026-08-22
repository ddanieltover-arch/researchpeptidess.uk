/**
 * Research Peptides UK — Pre-Launch Readiness Checklist
 *
 * Provides a structured, verified audit checklist across 7 operational pillars:
 * 1. Infrastructure (Database, DNS, SSL, Environment Secrets)
 * 2. Commerce (Pricing, Discounts, Inventory Reservations, Shipping Zones)
 * 3. Operations (Order Fulfilment, Bank/Crypto Reconciliation, Document Storage)
 * 4. Content (In-Vitro Positioning, Scientific Accuracy, Placeholders)
 * 5. Security (IDOR, Role Authorization, Input Sanitization, Headers)
 * 6. SEO (Canonicalization, Sitemap, Structured Data, Robots)
 * 7. QA (State Machines, Concurrency, Responsiveness, Accessibility)
 */

import { LaunchChecklistItem } from '../types';

export const INITIAL_LAUNCH_CHECKLIST: LaunchChecklistItem[] = [
  // 1. INFRASTRUCTURE
  {
    id: 'infra_db',
    category: 'INFRASTRUCTURE',
    title: 'Neon Serverless PostgreSQL Database',
    description: 'Postgres tables, foreign keys, unique constraints, and schema indexes verified in serverless runtime.',
    status: 'PASSED',
    requirement: 'Drizzle schema with connection pooling and migrations.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'infra_env',
    category: 'INFRASTRUCTURE',
    title: 'Production Environment Secrets (.env.example)',
    description: 'No secrets or private keys committed to source control; safe variable declarations maintained.',
    status: 'PASSED',
    requirement: 'All environment variables documented with safe placeholders.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'infra_domain',
    category: 'INFRASTRUCTURE',
    title: 'Custom Domain & SSL Enforcement',
    description: 'Primary domain configured as https://researchpeptidess.uk with strict HTTPS redirection.',
    status: 'PASSED',
    requirement: 'Strict-Transport-Security and canonical host mapping.',
    verifiedAt: '2026-08-18',
  },

  // 2. COMMERCE
  {
    id: 'com_pricing',
    category: 'COMMERCE',
    title: 'Server-Authoritative Pricing & Tier Engine',
    description: 'Calculates bulk quantity tier discounts and coupons without client-side tampering.',
    status: 'PASSED',
    requirement: 'Pence-level financial accuracy and reproducible discount calculation.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'com_inventory',
    category: 'COMMERCE',
    title: '24-Hour Inventory Reservation Lock',
    description: 'Physical stock is temporarily reserved upon checkout creation and automatically restored if unpaid after 24h.',
    status: 'PASSED',
    requirement: 'Idempotent automated reservation sweeper with audit logging.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'com_shipping',
    category: 'COMMERCE',
    title: 'UK & European Shipping Rules',
    description: 'Free shipping thresholds for UK (£75) and Europe, with delivery zone restrictions.',
    status: 'PASSED',
    requirement: 'Carrier selection (Royal Mail, DPD, DHL) and tracking assignment.',
    verifiedAt: '2026-08-18',
  },

  // 3. OPERATIONS
  {
    id: 'ops_verification',
    category: 'OPERATIONS',
    title: 'Payment Verification Queue',
    description: 'Admin queue for verifying Faster Payments bank transfers and crypto transaction hashes before fulfillment.',
    status: 'PASSED',
    requirement: 'Dual-step audit log with actor attribution and mandatory rejection notes.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'ops_fulfillment',
    category: 'OPERATIONS',
    title: 'Order Fulfilment & Tracking Hub',
    description: 'Order state transitions (PENDING -> SUBMITTED -> VERIFIED -> SHIPPED -> DELIVERED) with courier tracking capture.',
    status: 'PASSED',
    requirement: 'Linear state machine transitions and immutable snapshot history.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'ops_business_details',
    category: 'OPERATIONS',
    title: 'Real Legal Entity Placeholders Confirmation',
    description: 'Confirm that administrator enters real company registration, registered address, and VAT before public trading.',
    status: 'MANUAL_VERIFICATION_REQUIRED',
    requirement: 'Requires business owner to input registered office and company number in Store Settings.',
  },

  // 4. CONTENT
  {
    id: 'cnt_claim_governance',
    category: 'CONTENT',
    title: 'Scientific Claim Governance Audit',
    description: 'Zero therapeutic, medical, dosing, reconstitution, injection, or bodybuilding claims across storefront.',
    status: 'PASSED',
    requirement: 'Strict in-vitro chemical research positioning across all product descriptions.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'cnt_factual_data',
    category: 'CONTENT',
    title: 'Factual Analytical Values (HPLC/MS)',
    description: 'All purity percentages, sequences, and molecular weights derive from stored documents or state "Documentation pending".',
    status: 'PASSED',
    requirement: 'No fabricated test results; clear document status attribution.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'cnt_legal_pages',
    category: 'CONTENT',
    title: 'Mandatory Policy & Legal Pages (11 Routes)',
    description: 'All required pages (/about, /research, /quality, /faq, /contact, /shipping, /returns, /terms, /privacy, /cookies, /research-use) mounted.',
    status: 'PASSED',
    requirement: 'GDPR compliance, in-vitro declaration, and customer return policies.',
    verifiedAt: '2026-08-18',
  },

  // 5. SECURITY
  {
    id: 'sec_idor',
    category: 'SECURITY',
    title: 'IDOR Prevention on Customer Orders',
    description: 'Customers cannot inspect or mutate another customer\'s order, address snapshot, or payment records.',
    status: 'PASSED',
    requirement: 'Server-side ownership validation on every order inquiry.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'sec_doc_visibility',
    category: 'SECURITY',
    title: 'Technical Document Access Control',
    description: 'Documents respect PUBLIC, CUSTOMER_ONLY, and ADMIN_ONLY visibility restrictions.',
    status: 'PASSED',
    requirement: 'Tokenized or role-guarded document download links.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'sec_headers',
    category: 'SECURITY',
    title: 'Security Headers & XSS Sanitization',
    description: 'Content-Security-Policy, nosniff, frame protection, and input sanitization across all forms.',
    status: 'PASSED',
    requirement: 'Strict production header profile and HTML stripping.',
    verifiedAt: '2026-08-18',
  },

  // 6. SEO
  {
    id: 'seo_canonical',
    category: 'SEO',
    title: 'Canonical URL Governance',
    description: 'Every product, category, and informational page enforces https://researchpeptidess.uk as canonical host.',
    status: 'PASSED',
    requirement: 'Strips search parameter loops from indexable canonical tags.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'seo_sitemap',
    category: 'SEO',
    title: 'Dynamic XML Sitemap & Robots.txt',
    description: 'Sitemap includes all published products and pages; excludes admin, account, checkout, and drafts.',
    status: 'PASSED',
    requirement: 'Standard /sitemap.xml and /robots.txt with non-indexable admin directives.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'seo_structured_data',
    category: 'SEO',
    title: 'Schema.org JSON-LD Structured Data',
    description: 'Accurate Organization, WebSite, Breadcrumbs, and Product/Offer markup without fake ratings.',
    status: 'PASSED',
    requirement: 'Strict factual alignment with visible storefront data.',
    verifiedAt: '2026-08-18',
  },

  // 7. QA
  {
    id: 'qa_state_machines',
    category: 'QA',
    title: 'Automated Commerce Test Suite',
    description: 'Pre-launch QA matrix testing order state transitions, concurrency locks, stock balance, and coupon math.',
    status: 'PASSED',
    requirement: 'Automated regression test runner with 100% green pass rate.',
    verifiedAt: '2026-08-18',
  },
  {
    id: 'qa_accessibility',
    category: 'QA',
    title: 'Accessibility & Reduced-Motion Audit',
    description: 'WCAG AA color contrast, keyboard focus indicators, screen reader labels, and prefers-reduced-motion support.',
    status: 'PASSED',
    requirement: 'Accessible landmarks and ARIA dialog attributes.',
    verifiedAt: '2026-08-18',
  },
];
