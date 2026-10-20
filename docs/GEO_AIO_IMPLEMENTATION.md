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
| Answer capsules | `GeoQuickAnswer` (`section#answer`) on home, catalogue, PDP, CMS, insights — see `src/lib/geo-quick-answers.ts` |
| Links | `internal-linking.ts`, footer, insights → PDPs |

## Route checklist

| Route | Quick Answer (`#answer`) | FAQ panel | FAQPage JSON-LD |
|-------|-------------|-----------------|
| `/` | Yes | HomeUkBuyerQuestions | Yes (home topics) |
| `/peptides` | Yes | Featured rail, LabInsightsPromo, CatalogueUkBuyerQuestions | Yes (catalogue) |
| `/shop`, `/research-chemicals` | Yes | CatalogueUkBuyerQuestions | Yes |
| `/category/*` | Yes (collection copy) | CatalogueUkBuyerQuestions | Category SEO |
| PDP | Yes (product copy) | ProductUkBuyerQuestions | Product + FAQPage |
| `/faq`, `/shipping`, `/research-use`, `/contact`, `/research` | Yes | UkBuyerQuestionsPanel where applicable | Yes |
| `/quality`, `/about` | Yes | UkBuyerQuestionsPanel (GEO topics) | Yes |
| `/insights` | Yes | Index FAQ panel | CollectionPage + FAQPage |
| `/insights/*` | Yes (from article meta) | Article body | BlogPosting |

## Explicitly not used

- `llms.txt` for Google (see tactics ledger)
- Dosage / “best supplier” doorway content
- Fabricated ratings in schema

## Operations

- Setup: [GSC_GEO_SETUP.md](./GSC_GEO_SETUP.md)
- Content calendar: [INSIGHTS_CONTENT_PLAN.md](../INSIGHTS_CONTENT_PLAN.md)
- Monitoring: SGE workspace `MONITORING.md`
