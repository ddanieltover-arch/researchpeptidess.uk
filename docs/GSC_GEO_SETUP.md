# Google Search Console + GEO measurement

Use this after the production site serves the latest bundle on **apex** `researchpeptidess.uk`.

## 1. Search Console property

1. Add property **`https://researchpeptidess.uk`** (URL-prefix, apex) or **`sc-domain:researchpeptidess.uk`** (domain).
2. Verify via DNS or HTML (Vercel).
3. Submit sitemap: `https://researchpeptidess.uk/sitemap.xml`
4. URL inspection (priority): `/`, `/peptides`, `/faq`, `/quality`, `/insights`, `/product/kpv`, `/product/bacteriostatic-water-0-9-benzyl`

## 2. Local credentials (never commit JSON keys)

In project `.env` (see `.env.example` §11):

```env
SGE_ENV_FILE=".env"
GSC_SITE_URL="sc-domain:researchpeptidess.uk"
GOOGLE_APPLICATION_CREDENTIALS="C:/path/to/service-account.json"
```

The service account email must be added as a **user** on the GSC property (Full permission).

## 3. SGE CLI (from repo root)

```powershell
cd "Search Growth Engineering Skill"
pip install -r requirements-connectors.txt
python -m sge orchestrate --workspace research-peptides-uk --workspaces-root workspaces --mode audit
python -m sge orchestrate --workspace research-peptides-uk --workspaces-root workspaces --mode strategy
```

Or use npm shortcuts from the site root:

```powershell
npm run sge:audit
npm run sge:strategy
```

Reports land under `Search Growth Engineering Skill/workspaces/research-peptides-uk/`.

## 4. Generative AI performance (Google)

When the API exposes the Generative AI report for your property, export it into the workspace baseline folder and update `intelligence/ai-search/observations.json` eligibility flags.

## 5. Manual AI citation log (no Google scraping)

Monthly, for queries in `observations.json`, record whether `researchpeptidess.uk` appears in:

- Google AI Overviews / AI Mode (manual check in browser)
- ChatGPT search (if you use it)
- Perplexity (optional)

Append rows to `observations` with `evidence_type: "observed"`.

## 6. Fortnightly GSC export

See `Search Growth Engineering Skill/workspaces/research-peptides-uk/MONITORING.md` (local workspace copy).
