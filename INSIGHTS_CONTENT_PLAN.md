# Lab Insights — content calendar & keyword map

Editorial route: **`/insights`** (index) and **`/insights/{slug}`** (articles).  
All posts are **research-use** oriented — no dosage guides, “best supplier” listicles, or human-use claims.

## Publishing schedule (staggered dates)

| Publish date | Slug | Primary keywords (intent) | Pillar links |
|--------------|------|---------------------------|--------------|
| 2025-06-10 | `bacteriostatic-water-uk-laboratories` | bacteriostatic water, bacteriostatic water uk | Bac water PDP, /peptides |
| 2025-06-24 | `buy-research-peptides-uk-compliance` | buy peptides uk, buy research peptides uk | /peptides, /research-use, /faq |
| 2025-07-08 | `igf-1-lr3-research-catalogue-notes` | igf-1 lr3, igf1 lr3 | IGF-1 LR3 PDP |
| 2025-07-22 | `kpv-peptide-inflammation-research-models` | kpv peptide, kpv | KPV PDP, /quality |
| 2025-08-05 | `bpc-157-tb-500-blend-preclinical-overview` | bpc157 tb500, bpc 157 tb 500 | BPC/TB blend PDP |
| 2025-08-19 | `nad-peptide-cellular-metabolism-research` | nad peptide, nad+ peptide | NAD 250 mg PDP (honest strength) |
| 2025-09-02 | `cjc-1295-ipamorelin-endocrine-research` | cjc 1295 ipamorelin, cjc ipamorelin | CJC/ipa blend PDP |
| 2025-09-16 | `five-amino-1mq-nnmt-laboratory-research` | 5 amino 1mq, 5-amino-1mq | 5-amino-1mq PDP |
| 2025-09-30 | `peptide-research-uk-documentation-hplc` | peptide research uk, peptide research | /quality, /peptides |
| 2025-10-14 | `glow-peptide-blend-ghk-cu-research-context` | glow peptide, glow blend | Glow blend PDP |
| 2025-10-28 | `follistatin-344-research-material-overview` | follistatin, follistatin 344 | Follistatin PDP |
| 2026-02-10 | `uk-laboratory-peptide-reconstitution-workflow` | peptides shop, bacteriostatic water for peptides | /shop, bac water PDP |

**Cadence:** ~1 post every 14 days Jun–Oct 2025, then a freshness post Feb 2026.

## Phase 2 topics (not yet written — queue)

| Target window | Topic | Keywords | Notes |
|---------------|-------|----------|-------|
| 2026-03 | GHRP-2 in GH secretagogue models | ghrp-2 | Link GHRP-2 PDP |
| 2026-04 | HGH fragment 176-191 naming | hgh fragment 176-191 | No performance claims |
| 2026-05 | “Can you buy peptides in the UK?” (expanded) | can you buy peptides in the uk | Overlap FAQ — keep single canonical FAQ |
| 2026-06 | Wholesale / bulk inquiries | wholesale peptides uk | B2B → contact, not consumer |

## Explicitly excluded keyword types

- Competitor **brand navigational** (uk-peptides, rize, precision, etc.)
- **Dosage** queries (kpv dosage, ss-31 dosage, …)
- **Review / best supplier** queries (pure peptides uk review, best uk peptide supplier)
- **Muscle growth / weight loss** buy intent

## GEO / AIO sitewide

See **`docs/GEO_AIO_IMPLEMENTATION.md`** and **`docs/GSC_GEO_SETUP.md`** for FAQ surfaces, schema, and GSC measurement.

## Ops checklist when adding a post

1. Add entry to `src/lib/cms-insights-posts.ts` with unique `publishedAt` (YYYY-MM-DD).
2. Run `npm test` (insight paths + SEO).
3. Build regenerates sitemap + prerender (`/insights`, `/insights/{slug}`).
4. GSC: inspect URL after deploy; internal link from `/insights` index and one related PDP.

## Source data

Competitive keyword exports are baselined under  
`Search Growth Engineering Skill/workspaces/research-peptides-uk/baselines/`.
