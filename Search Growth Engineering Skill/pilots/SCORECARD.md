# Pilot scorecard

Score after strategy review, before broad implementation. The question is not “how many findings,” but whether an experienced SEO strategist would agree with the high-value actions.

| Area | Question | Pass? |
|---|---|---|
| Classification | Did SGOS correctly understand the business/project? | |
| Technical | Did it find real, material technical problems? | |
| Search | Did it identify genuine search opportunities? | |
| Content | Are recommended topics/pages commercially useful? | |
| Competitors | Did it identify meaningful search competitors? | |
| GEO/AIO | Are AI-search findings evidence-based? | |
| Prioritization | Are the top opportunities actually the best ones? | |
| Implementation | Are proposed changes technically safe? | |
| Reporting | Can a client understand the result? | |
| Efficiency | Did SGOS save meaningful human research time? | |

## Strategist override rate

```text
overridden recommendations
──────────────────────────── × 100
total recommendations reviewed
```

Machine-readable copies: `pilots/templates/scorecard.json` and `pilots/templates/review.json`.

Do not judge a pilot only by rankings. Fill `pilots/templates/baseline.json` from first-party evidence; leave unused metrics `null`.
