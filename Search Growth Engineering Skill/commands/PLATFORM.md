# /sge orchestrate

```bash
python -m sge orchestrate --workspace client-a --mode audit
python -m sge orchestrate --workspace client-a --mode strategy
python -m sge orchestrate --workspace client-a --mode implementation
python -m sge orchestrate --workspace client-a --mode growth
```

| Mode | Pipeline |
|---|---|
| audit | Discover → Collect → Analyze → Report |
| strategy | Audit → Market Map → Topic Map → Roadmap |
| implementation | Strategy → Execute → Validate (dry-run unless `--apply`) |
| growth | Monitor → Learn → Alert → Recommend |

Flag form still works: `--sync --observe --strategy --monitor`.

```bash
python -m sge connectors certify --id gsc
```
