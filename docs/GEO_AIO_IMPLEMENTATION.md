# GEO / AIO implementation map — researchpeptidess.uk

**GEO** = structured, citable research-use content for generative systems.  
**AIO** = Google AI Overviews and similar surfaces (indexed HTML + trust; not guaranteed).

## Layers

| Layer | Implementation |
|-------|----------------|
| Crawl | `generateRobotsTxt()`, sitemap, prerender shells, OAI-SearchBot allows |
| Extract | H1 + short blocks; UK buyer panels; CMS “at a glance”; Lab Insights |
| Entity | Organization, WebSite, Product, BlogPosting; no fake reviews |
| Answers | `FAQPage` JSON-LD + visible `UkBuyerQuestionsPanel` on key routes |
| Links | `internal-linking.ts`, footer, insights → PDPs |

## Route checklist

| Route | Visible GEO | FAQPage JSON-LD |
|-------|-------------|-----------------|
| `/` | HomeUkBuyerQuestions | Yes (home topics) |
| `/peptides` | Featured rail, LabInsightsPromo, CatalogueUkBuyerQuestions | Yes (catalogue) |
| `/shop` | CatalogueUkBuyerQuestions | Yes (shop) |
| PDP | ProductUkBuyerQuestions | Product + FAQPage |
| `/faq`, `/shipping` | UkBuyerQuestionsPanel | Yes |
| `/quality`, `/about` | UkBuyerQuestionsPanel (GEO topics) | Yes |
| `/insights` | Index FAQ panel | CollectionPage + FAQPage |
| `/insights/*` | Article body | BlogPosting |

## Explicitly not used

- `llms.txt` for Google (see tactics ledger)
- Dosage / “best supplier” doorway content
- Fabricated ratings in schema

## Operations

- Setup: [GSC_GEO_SETUP.md](./GSC_GEO_SETUP.md)
- Content calendar: [INSIGHTS_CONTENT_PLAN.md](../INSIGHTS_CONTENT_PLAN.md)
- Monitoring: SGE workspace `MONITORING.md`
