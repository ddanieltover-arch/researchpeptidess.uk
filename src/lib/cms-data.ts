/**
 * Research Peptides UK — Storefront CMS Initial Content & Legal Framework
 *
 * Provides structured, legally cautious, factual content for all informational and policy routes:
 * 1. /about
 * 2. /research
 * 3. /quality
 * 4. /faq
 * 5. /contact
 * 6. /shipping
 * 7. /returns
 * 8. /terms
 * 9. /privacy
 * 10. /cookies
 * 11. /research-use
 *
 * Uses clear, verifiable placeholders for real business entity inputs.
 * Strictly avoids unsupported health or regulatory approval claims.
 */

import { CMSPage, StoreSettings } from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Research Peptides UK',
  tagline: 'High-Purity Analytical & In-Vitro Research Biochemicals',
  legalEntityName: '[LEGAL_ENTITY_NAME]', // e.g. Research Peptides UK Ltd
  registeredOfficeAddress: '[REGISTERED_OFFICE_ADDRESS]', // e.g. 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ
  companyNumber: '[COMPANY_NUMBER]', // e.g. 14982134
  vatNumber: '[VAT_NUMBER]', // e.g. GB 429 8219 02
  governingLaw: 'England and Wales',
  primaryEmail: 'lab@researchpeptidess.uk',
  supportEmail: 'support@researchpeptidess.uk',
  privacyEmail: 'privacy@researchpeptidess.uk',
  phone: '+44 (0) 20 8123 4567',
  primaryDomain: 'https://researchpeptidess.uk',
  currency: 'GBP',
  environment: 'PRODUCTION',
  storeStatus: 'PRIVATE_BETA',
  enableAnalyticsWithoutConsent: false,
  maintenanceMode: false,
};

export const INITIAL_CMS_PAGES: CMSPage[] = [
  // 1. ABOUT
  {
    id: 'cms_about',
    slug: 'about',
    title: 'About Research Peptides UK',
    subtitle: 'Dedicated British Supplier of High-Purity In-Vitro Biochemicals & Analytical Standards',
    category: 'COMPANY',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[LEGAL_ENTITY_NAME]', '[REGISTERED_OFFICE_ADDRESS]', '[COMPANY_NUMBER]'],
    seoTitle: 'About Research Peptides UK | In-Vitro Biochemical Standards',
    seoDescription: 'Learn about Research Peptides UK, our strict quality governance, independent analytical testing, and dedicated supply of in-vitro biochemical reagents for scientific laboratories.',
    contentMarkdown: `
### Who We Are

**Research Peptides UK** supplies biochemical reagents, synthetic peptide sequences, and reference materials for in-vitro laboratory research. The public catalogue is limited to research-use listings.

We operate from the United Kingdom and ship to destinations that are configured in the storefront shipping engine.

---

### Our Operating Philosophy

1. **Documentation where it exists**
   Product pages show batch numbers, document type, and file access only when those records are attached. Unavailable, pending, and demonstration states are labelled as such.

2. **In-vitro positioning**
   All products are supplied for laboratory research and analytical work. They are not medicines and are not for human or veterinary administration.

3. **Configured logistics**
   Shipping methods, prices, estimated windows, and tracking availability are taken from the configured shipping engine rather than promotional slogans.

---

### Corporate Information

- **Legal Entity:** [LEGAL_ENTITY_NAME]
- **Registered Office:** [REGISTERED_OFFICE_ADDRESS]
- **Company Registration Number:** [COMPANY_NUMBER] (Registered in [GOVERNING_LAW_COUNTRY])
- **VAT Number:** [VAT_NUMBER]
- **Primary Inquiries:** [PRIMARY_CONTACT_EMAIL]
    `,
  },

  // 2. RESEARCH & DOCUMENTATION
  {
    id: 'cms_research',
    slug: 'research',
    title: 'Research & Documentation Portal',
    subtitle: 'Technical Protocols, Scientific Classifications & Analytical Resources',
    category: 'QUALITY',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[SUPPORT_CONTACT_EMAIL]'],
    seoTitle: 'Research & Technical Documentation | Research Peptides UK',
    seoDescription: 'Access technical specifications, analytical classifications, and laboratory handling guidelines for in-vitro peptide research.',
    contentMarkdown: `
### Scientific Scope & Purpose

This portal outlines the biochemical classifications and technical handling principles for substances supplied by **Research Peptides UK**. 

All substances catalogued are intended strictly for:
- In-vitro cellular and molecular assays
- Receptor-ligand affinity profiling
- Mass spectrometry calibration and reference standards
- Enzymatic degradation kinetics

---

### Analytical Data Governance

We categorize compound documentation according to verifiable analytical data sources:

| Classification | Verification Standard | Documentation Provided |
| :--- | :--- | :--- |
| **Verified Batch** | Batch-specific HPLC & MS confirmation from an independent testing laboratory. | Certificate of Analysis (COA) with retention time and molecular weight scan. |
| **Manufacturer Documented** | Purity and identity certified by the primary chemical synthesizer. | Manufacturer Specification Sheet & Batch Purity Confirmation. |
| **Documentation Pending** | Batch currently undergoing analytical quarantine or awaiting updated documentation upload. | Temporary batch notation pending final technical release. |

---

### Storage & Laboratory Handling Protocols

To maintain the physicochemical stability of synthetic peptides:
- **Lyophilized Cake:** Store sealed at **-20°C** in a desiccated freezer compartment. Minimize temperature fluctuations.
- **Reconstitution for Assays:** Prior to opening, allow vials to reach room temperature within a desiccator to prevent atmospheric moisture condensation.
- **Solvents:** Use analytical-grade sterile water or appropriate laboratory buffers suited to your assay design.

*Technical support for academic and institutional research inquiries is available at [SUPPORT_CONTACT_EMAIL].*
    `,
  },

  // 3. QUALITY ASSURANCE
  {
    id: 'cms_quality',
    slug: 'quality',
    title: 'Quality & Analytical Documentation',
    subtitle: 'How batch records, COAs, and documentation states work on this storefront',
    category: 'QUALITY',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[LEGAL_ENTITY_NAME]'],
    seoTitle: 'Quality Standards & HPLC Testing | Research Peptides UK',
    seoDescription: 'Discover our analytical quality assurance protocols, third-party HPLC chromatography verification, and batch-level Certificate of Analysis standards.',
    contentMarkdown: `
### Our approach

Quality on this storefront means showing the records that exist for a listing, and not inventing the ones that do not. Research Peptides UK is a catalogue and fulfilment service. Independent laboratory accreditations are not claimed for the merchant entity unless a supporting document is attached to a specific batch.

### Product traceability

Where a batch record is uploaded, the product page can show:
- batch number
- batch status
- test or document date, if recorded
- linked files

If no batch is attached, the listing states that no batch record is available.

### Batch documentation

Batch documentation is optional per product. Administrators upload files against a product and, where relevant, a batch. Storefront visitors see only documents marked public or otherwise authorised for their role.

### Analytical documentation

HPLC, mass spectrometry, specification sheets, and similar files appear only when they are stored against the product. A purity percentage is displayed only when a documented value exists on the product or batch record.

### COA access

Certificates of analysis, where present, can be viewed or downloaded from the product’s batch documentation panel. If a file URL is missing, the listing says the file is not attached.

### Storage and handling information

Storage statements on product pages come from the product record (for example a listed storage temperature). They describe laboratory handling of the supplied material. They are not reconstitution, dosing, or administration instructions.

### What “documentation available” means

| Storefront state | Meaning |
| :--- | :--- |
| **Available** | A document or verified/available documentation status is recorded for the listing. |
| **Pending** | A record is expected or in review, but the file may not yet be public. |
| **Unavailable** | No documentation is attached. |
| **Demo** | Interface demonstration data only — not an official analytical record. |

### What the customer receives

The customer receives the published catalogue item, any public documents attached to that listing, and shipping according to the method selected at checkout. Documentation is not guaranteed for every SKU.
    `,
  },

  // 4. FAQ
  {
    id: 'cms_faq',
    slug: 'faq',
    title: 'Frequently Asked Questions',
    subtitle: 'Common Inquiries Regarding Ordering, Payment, Cold Shipping & Research Compliance',
    category: 'SUPPORT',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[SUPPORT_CONTACT_EMAIL]', '[PRIMARY_CONTACT_EMAIL]'],
    seoTitle: 'Frequently Asked Questions | Research Peptides UK',
    seoDescription: 'Answers to frequently asked questions about peptide ordering, bank transfers, cryptocurrency settlements, UK & European shipping, and research policies.',
    contentMarkdown: `
### General & Research Policies

#### Who is eligible to purchase from Research Peptides UK?
Our products are available to qualified researchers, academic institutions, corporate R&D departments, and independent laboratories. All purchasers must be at least 18 years of age and explicitly confirm that compounds will be used exclusively for in-vitro research.

#### Are these products intended for personal or clinical use?
**No.** Under no circumstances are products sold by Research Peptides UK intended for human or animal consumption, medical treatment, diagnostic procedures, or cosmetic application. Orders suspected of intended misuse will be cancelled immediately.

---

### Payment & Verification

#### Which payment methods do you accept?
We accept:
1. **UK Faster Payments / Bank Transfer:** Instant clearing via standard online banking (Sort Code & Account Number provided at checkout).
2. **SEPA Euro Bank Transfers:** For institutional purchasers in European jurisdictions (IBAN / BIC).
3. **Direct Cryptocurrency:** Bitcoin (BTC), Tether (USDT on TRC-20 and ERC-20), and Ethereum (ETH), with an automatic 5% settlement discount.

#### How is payment verified?
Once you complete checkout and transfer funds, enter your payment reference code or transaction hash on the order confirmation screen. Our compliance team verifies settlements against bank and blockchain ledgers, typically within 1–4 business hours.

---

### Shipping & Fulfilment

#### How quickly are orders dispatched?
Dispatch timing follows the shipping method selected at checkout and the status of payment verification. The storefront does not promise same-day or next-day dispatch unless that window is the configured estimate for the selected method.

#### How are peptides packaged during transit?
Packaging follows the operational process used at dispatch. The storefront does not claim temperature-controlled or cold-chain handling unless a shipping method is configured with that service.

#### Do you ship to European destinations?
Yes. We deliver to selected European countries with compliant customs documentation. Full shipping rates and country lists are detailed on our **Shipping Policy** page.
    `,
  },

  // 5. CONTACT
  {
    id: 'cms_contact',
    slug: 'contact',
    title: 'Contact Laboratory & Support',
    subtitle: 'Get in Touch with Our British Operations & In-Vitro Technical Team',
    category: 'SUPPORT',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[PRIMARY_CONTACT_EMAIL]', '[SUPPORT_CONTACT_EMAIL]', '[PRIMARY_CONTACT_PHONE]', '[REGISTERED_OFFICE_ADDRESS]'],
    seoTitle: 'Contact Us | Research Peptides UK Support & Inquiries',
    seoDescription: 'Contact Research Peptides UK for laboratory order assistance, institutional procurement, bulk synthesis inquiries, and payment verification support.',
    contentMarkdown: `
### Customer & Technical Support

Our team is available Monday through Friday, 09:00 to 17:00 GMT to assist with order inquiries, payment reconciliation, and technical data requests.

---

### Contact Coordinates

- **General Inquiries:** [PRIMARY_CONTACT_EMAIL]
- **Order & Payment Support:** [SUPPORT_CONTACT_EMAIL]
- **Data Protection & Compliance:** [DATA_PROTECTION_EMAIL]
- **Telephone:** [PRIMARY_CONTACT_PHONE]
- **Postal / Registered Address:**
  [LEGAL_ENTITY_NAME]  
  [REGISTERED_OFFICE_ADDRESS]  
  United Kingdom

---

### Institutional Procurement & Bulk Requisitions

Universities, research institutes, and commercial laboratories requiring custom peptide synthesis, larger batch quantities, or formal purchase orders may submit inquiries directly to **[SUPPORT_CONTACT_EMAIL]** with institutional letterhead and specific peptide sequence requirements.
    `,
  },

  // 6. SHIPPING POLICY
  {
    id: 'cms_shipping',
    slug: 'shipping',
    title: 'Shipping Policy',
    subtitle: 'Destinations, methods, prices, windows and tracking from the configured shipping engine',
    category: 'SUPPORT',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[SUPPORT_CONTACT_EMAIL]'],
    seoTitle: 'Shipping & Delivery Policy | Research Peptides UK',
    seoDescription: 'Shipping destinations, methods, prices, estimated windows, and tracking availability for Research Peptides UK orders.',
    contentMarkdown: `
### How shipping is calculated

Checkout uses the configured shipping engine. Destination, method name, price, estimated window, and whether tracking is available are taken from those records. Marketing phrases such as same-day dispatch or cold-chain handling are not used unless a method is actually configured that way.

Current default UK mainland method (from store configuration):
- **Method:** Royal Mail Tracked 24 (Next Business Day)
- **Price:** £4.99
- **Free threshold:** £75.00
- **Estimated window:** 1 working day (order by 3 PM) as configured
- **Tracking:** available after dispatch

Other zones (Highlands, Europe, international) use the methods listed in store settings. Always confirm the live options at checkout, because administrators can change them.

### What we do not claim by default

Unless a matching method exists in the shipping engine, this site does not claim:
- same-day dispatch as a universal promise
- temperature-controlled shipping
- cold-chain handling

### Customs

For cross-border orders, purchasers remain responsible for local import rules. Commercial paperwork is prepared according to the operational process in use at dispatch.
    `,
  },

  // 7. RETURNS & REFUNDS
  {
    id: 'cms_returns',
    slug: 'returns',
    title: 'Returns, Replacements & Refund Policy',
    subtitle: 'Laboratory Reagent Handling, Damaged Shipments & Cancellation Terms',
    category: 'SUPPORT',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[SUPPORT_CONTACT_EMAIL]', '[LEGAL_ENTITY_NAME]'],
    seoTitle: 'Returns & Refund Policy | Research Peptides UK',
    seoDescription: 'Read our chemical return, damaged shipment replacement, and refund terms for in-vitro research biochemicals.',
    contentMarkdown: `
### Nature of Chemical Products

Due to the sensitive biochemical nature of synthetic peptides and the strict requirement to guarantee uncompromised chain-of-custody, products once delivered cannot be returned for restock or resale. This policy protects all researchers by ensuring that every vial dispatched is pristine, unopened, and stored under strictly monitored conditions.

---

### Damaged in Transit or Defective Shipments

If an order is received with physical damage to vials, broken seals, or packaging failure:

1. **Notify Us Within 48 Hours:** Email **[SUPPORT_CONTACT_EMAIL]** within 48 hours of delivery scan confirmation.
2. **Provide Photographic Evidence:** Include clear photographs of the outer packaging, inner packaging, and damaged vials showing the batch label.
3. **Resolution:** Upon verification, **Research Peptides UK** will dispatch an immediate replacement shipment at no additional cost or process a full refund to the original payment method.

---

### Order Cancellation Prior to Dispatch

Orders in **PENDING_PAYMENT**, **PAYMENT_SUBMITTED**, or **PAYMENT_VERIFIED** status that have not yet undergone packaging and courier dispatch may be cancelled upon request. Contact support immediately to request a cancellation. Once a package has been transferred to the courier service, dispatch is final.

---

### Refund Processing

Approved refunds are processed within 2–5 business days:
- **Bank Transfers:** Refunded directly to the originating bank account.
- **Cryptocurrency:** Refunded in the cryptocurrency transferred or equivalent GBP credit value at the time of refund approval.
    `,
  },

  // 8. TERMS OF SERVICE
  {
    id: 'cms_terms',
    slug: 'terms',
    title: 'Terms of Service',
    subtitle: 'Commercial Supply Agreement, Purchaser Qualifications & Statutory Disclaimers',
    category: 'LEGAL',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[LEGAL_ENTITY_NAME]', '[REGISTERED_OFFICE_ADDRESS]', '[COMPANY_NUMBER]', '[GOVERNING_LAW_COUNTRY]'],
    seoTitle: 'Terms of Service | Research Peptides UK',
    seoDescription: 'Terms of Service governing the purchase and supply of research biochemicals from Research Peptides UK.',
    contentMarkdown: `
### 1. Introduction & Acceptance

These Terms of Service constitute a legally binding agreement between you (the "Purchaser" or "User") and **[LEGAL_ENTITY_NAME]** (trading as Research Peptides UK, registered in [GOVERNING_LAW_COUNTRY] under company number [COMPANY_NUMBER], with registered office at [REGISTERED_OFFICE_ADDRESS]).

By placing an order, creating an account, or accessing **https://researchpeptidess.uk**, you explicitly agree to be bound by these Terms.

---

### 2. Exclusive In-Vitro Research Classification

1. **Strict Research-Use Limitation:** All products sold through this platform are strictly intended for **in-vitro laboratory experimentation, analytical standards, and biochemical research**.
2. **No Human or Animal Consumption:** The Purchaser explicitly agrees not to ingest, inject, inhale, administer, or introduce these products into humans or animals under any circumstances.
3. **No Clinical or Medical Utility:** The products are not drugs, pharmaceuticals, food additives, medical devices, or cosmetics. They have not been sterilized for clinical use and are not approved by the MHRA, EMA, FDA, or any equivalent authority for diagnostic or therapeutic applications.

---

### 3. Purchaser Qualifications & Warranties

By placing an order, the Purchaser represents and warrants that:
- They are at least **18 years of age**.
- They possess the technical knowledge, laboratory equipment, and safety facilities (including personal protective equipment, fume hoods, and temperature-controlled storage) necessary to handle chemical compounds safely.
- They will comply with all national, regional, and municipal laws regarding the receipt, storage, handling, and disposal of laboratory chemicals.

---

### 4. Pricing, Payment & Inventory

- All prices are quoted in **Pounds Sterling (GBP)** or **Euros (EUR)** and are subject to change without notice prior to order confirmation.
- Orders must be paid in full via approved payment mechanisms (Bank Transfer or Cryptocurrency) within 24 hours of requisition creation. Inventory reservations expire automatically after 24 hours if payment confirmation is not received.
- **[LEGAL_ENTITY_NAME]** reserves the right to decline, cancel, or refund any order suspected of violating our research-use compliance terms.

---

### 5. Limitation of Liability & Indemnification

To the fullest extent permitted by applicable law, **[LEGAL_ENTITY_NAME]** shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the purchase, handling, misuse, or storage of any product.

The Purchaser agrees to indemnify and hold harmless **[LEGAL_ENTITY_NAME]**, its directors, officers, and employees against any claims, losses, or expenses resulting from Purchaser's breach of these terms.

---

### 6. Governing Law & Jurisdiction

These Terms of Service and any dispute arising out of them shall be governed by and construed in accordance with the laws of **[GOVERNING_LAW_COUNTRY]**. The courts of [GOVERNING_LAW_COUNTRY] shall have exclusive jurisdiction.
    `,
  },

  // 9. PRIVACY POLICY
  {
    id: 'cms_privacy',
    slug: 'privacy',
    title: 'Privacy & Data Protection Policy',
    subtitle: 'UK GDPR & Data Protection Act 2018 Compliance Statement',
    category: 'LEGAL',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[LEGAL_ENTITY_NAME]', '[DATA_PROTECTION_EMAIL]', '[REGISTERED_OFFICE_ADDRESS]'],
    seoTitle: 'Privacy Policy | Research Peptides UK Data Protection',
    seoDescription: 'Learn how Research Peptides UK protects your personal data in accordance with the UK GDPR and Data Protection Act 2018.',
    contentMarkdown: `
### 1. Data Controller

**[LEGAL_ENTITY_NAME]** is the Data Controller responsible for your personal data under the **UK General Data Protection Regulation (UK GDPR)** and the **Data Protection Act 2018**.

For data protection inquiries, contact our Data Protection Officer at: **[DATA_PROTECTION_EMAIL]**.

---

### 2. Information We Collect

We collect only data necessary to fulfill commercial laboratory orders and maintain legal audit trails:
- **Identity & Contact Data:** Full name, institutional affiliation, email address, telephone number.
- **Delivery Data:** Shipping address, dispatch instructions, courier tracking information.
- **Transaction & Financial Data:** Order history, billing totals, payment method, bank transfer references, and public blockchain transaction identifiers. *(Note: We never process, store, or have access to credit card CVVs or private cryptocurrency keys).*
- **Technical & Usage Data:** IP address, browser type, operating system, and consent-approved analytics data.

---

### 3. Legal Basis for Processing

We process your data under the following legal bases:
- **Contractual Necessity (Art. 6(1)(b) UK GDPR):** To process orders, deliver shipments, and administer customer accounts.
- **Legal Obligation (Art. 6(1)(c) UK GDPR):** To maintain statutory tax records, commercial accounting books, and chemical compliance logs.
- **Legitimate Interests (Art. 6(1)(f) UK GDPR):** To prevent fraud, protect site security, and verify payment settlements.
- **Consent (Art. 6(1)(a) UK GDPR):** For optional analytical telemetry.

---

### 4. Data Sharing & International Transfers

We do not sell, rent, or trade personal data. We share information only with:
- **Delivery Couriers:** Royal Mail, DPD, DHL (strictly for delivery fulfillment).
- **Hosting & Database Providers:** Secure cloud infrastructure situated within UK / EEA data centers with encryption at rest and in transit.

---

### 5. Data Retention & Your Rights

- Commercial and financial transaction records are retained for a minimum of **6 years** to comply with UK HM Revenue & Customs statutory obligations.
- Under UK GDPR, you have the right to request access, rectification, erasure, restriction of processing, and data portability. To exercise these rights, email **[DATA_PROTECTION_EMAIL]**.
    `,
  },

  // 10. COOKIE POLICY
  {
    id: 'cms_cookies',
    slug: 'cookies',
    title: 'Cookie & Tracking Policy',
    subtitle: 'Consent Governance, Technical Cookies & Analytical Preferences',
    category: 'LEGAL',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[DATA_PROTECTION_EMAIL]'],
    seoTitle: 'Cookie Policy | Research Peptides UK',
    seoDescription: 'Understand how we use strictly necessary cookies and manage your consent preferences for analytics and performance tracking.',
    contentMarkdown: `
### What Are Cookies?

Cookies are small text files placed on your device to ensure web applications function smoothly, maintain authenticated sessions, and understand how visitors interact with our services.

---

### Categories of Cookies Used

1. **Strictly Necessary Cookies (Always Active)**
   These cookies are vital for the core operation of our platform. They enable you to log in securely, add items to your laboratory cart, proceed through checkout, and maintain session state.
   - *Examples:* Session ID, Authentication Token, Cart State, Research Disclaimer Acceptance.

2. **Analytical & Performance Cookies (Consent Required)**
   These cookies collect anonymized telemetry regarding page navigation, error rates, and load performance. They assist us in diagnosing platform issues and improving user experience.
   - *Status:* Inactive by default. Activated only upon your explicit opt-in via our Cookie Consent banner.

3. **Marketing & Targeting Cookies**
   We do not employ third-party behavioral advertising networks or retargeting pixels.

---

### Managing Your Preferences

You can modify your cookie consent settings at any time using our Cookie Consent manager or via your web browser settings.
    `,
  },

  // 11. RESEARCH-USE ONLY STATEMENT
  {
    id: 'cms_research_use',
    slug: 'research-use',
    title: 'Statutory Research-Use Statement',
    subtitle: 'Mandatory In-Vitro Legal Disclaimer & Purchaser Declaration',
    category: 'LEGAL',
    lastUpdated: '2026-08-18',
    isPublished: true,
    requiredBusinessInputs: ['[LEGAL_ENTITY_NAME]', '[GOVERNING_LAW_COUNTRY]'],
    seoTitle: 'Research-Use Only Statement & Agreement | Research Peptides UK',
    seoDescription: 'Mandatory statutory in-vitro research use only statement, compliance obligations, and purchaser certification.',
    contentMarkdown: `
# STATUTORY DECLARATION: IN-VITRO LABORATORY USE ONLY

### STRICT WARNING & REGULATORY NOTICE

**ALL PRODUCTS DISTRIBUTED BY RESEARCH PEPTIDES UK ([LEGAL_ENTITY_NAME]) ARE SOLD EXCLUSIVELY FOR IN-VITRO SCIENTIFIC RESEARCH, BIOCHEMICAL TESTING, AND ANALYTICAL REFERENCE PURPOSES.**

---

### Prohibited Uses & Applications

The compounds supplied on this website are **STRICTLY NOT FOR**:
- Human consumption, ingestion, inhalation, or injection
- Clinical, medical, therapeutic, or diagnostic procedures
- Veterinary, agricultural, or horticultural administration
- Food, beverage, or cosmetic formulations
- Any application outside a controlled laboratory or analytical environment

---

### Regulatory Classification

1. **Not a Medicine or Medicinal Product:** None of the substances listed have been evaluated or approved by the UK Medicines and Healthcare products Regulatory Agency (MHRA), the European Medicines Agency (EMA), or the US Food and Drug Administration (FDA).
2. **Chemical Synthesis Standard:** Products are synthesized as analytical-grade biochemicals for research exploration only. They are not manufactured under cGMP pharmaceutical finished product guidelines intended for administration to human subjects.

---

### Mandatory Purchaser Affirmation

By completing a purchase on **https://researchpeptidess.uk**, you irrevocably attest that:
- You are an authorized researcher, laboratory technician, or institutional buyer acting in a professional capacity.
- You understand the physicochemical properties and hazards of working with synthetic peptide compounds.
- You will handle all substances in accordance with standard chemical hygiene plans and disposal protocols.
- You accept full legal responsibility for the lawful possession and safe storage of all ordered items.

---

*For compliance and regulatory verification questions, contact our compliance officer at: [PRIMARY_CONTACT_EMAIL].*
    `,
  },
];
