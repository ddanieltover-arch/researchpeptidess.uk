# Research Peptides UK — Architecture & Foundation

> **Brand:** Research Peptides UK  
> **Tagline:** 99% Pure British Peptides  
> **Domain:** researchpeptidess.uk  
> **Primary Market:** United Kingdom & Europe  

Research Peptides UK is an independent e-commerce application engineered specifically for **authorized in-vitro scientific research, laboratory experimentation, and analytical reference standards**.

---

## 1. Architectural Foundations

- **Frontend & Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Design Archetype:** **Premium British Scientific Commerce** (Cinzel serif typography paired with JetBrains Mono data matrices and clean warm neutral layouts).
- **Database & Schema:** Neon PostgreSQL compatible schema modeled with **Drizzle ORM** in `/src/db/schema.ts`. Prices stored authoritatively in minor units (pence/integers).
- **State Engine:** Server-authoritative calculations in `StoreContext.tsx` and `pricing.ts`.

---

## 2. Regulatory Compliance & Scientific Integrity

All copy and product entities are bound to in-vitro laboratory guidelines:
- **No Human / Veterinary Consumption Claims**: Audited by `/src/lib/compliance.ts`.
- **Mandatory Compliance Disclaimer**: 3-point legal acknowledgment before requisition checkout.
- **HPLC & Mass Spectrometry Transparency**: Every compound variant displays tested HPLC batch purity (≥99.0%) and downloadable COA profiles.

---

## 3. Pricing & Settlement Engine

- **Authoritative Calculations:** Server-side engine calculates subtotal, bulk tier savings (10% for 3+, 15% for 6+, 20% for 10+), and shipping thresholds (£75.00 for free UK Tracked delivery).
- **Payment Methods:**
  1. **UK Faster Payments / SEPA Bank Transfer**: Generates account details and sort code (`20-00-00`, `89210044`), with reference number and manual verification queue in the Admin portal.
  2. **Cryptocurrency (BTC / ETH / USDT-TRC20)**: Automatic **5% business rule discount** applied to order totals.

---

## 4. Key Page Routes

| Route | Functionality |
|---|---|
| `/` | Homepage with hero, trust statistics, featured compounds, HPLC transparency |
| `/shop` | Full catalogue with search, category filtering, purity filters, grid/list view |
| `/product/:slug` | Deep technical specifications, COA viewer, bulk tier matrix, variant selection |
| `/cart` | Requisition basket, free shipping progress, tier discounts, coupon input |
| `/checkout` | 2-step checkout, bank transfer / crypto payment choice, compliance agreement |
| `/account` | Customer portal, order history with live status badges, saved compounds |
| `/admin` | Payment verification queue, courier dispatch tracking input, inventory manager |

---

## 5. Development & Execution

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
