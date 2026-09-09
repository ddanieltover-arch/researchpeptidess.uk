# v1.4 Commands

`execution-plan <strategy.json>` — convert strategy evidence into an approval-ready implementation plan.

`execute <plan.json>` — dry-run a plan.

`execute <plan.json> --apply` — apply only an explicitly approved plan.

`validate --commands "cmd1;;cmd2;;cmd3"` — run validation commands sequentially and stop on failure.
