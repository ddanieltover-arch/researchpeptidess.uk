# Autonomous Implementation & Validation

## Execution law

**Plan → Approve → Backup → Patch → Test → Re-audit → Report.**

Default to dry-run. Applying changes requires explicit approval. Every file mutation must be reversible through a backup or a deterministic inverse operation.

## Safe operations

Prefer narrowly scoped operations:
- exact text replacement with expected match count
- JSON field update
- metadata patch
- deterministic content-template change

## Restricted operations

Require explicit per-operation approval:
- redirects
- robots directives
- package/dependency changes
- production configuration
- routing/authentication/payment logic
- databases
- shell commands with side effects

## Validation

Run the smallest relevant checks first, then broader checks when needed:
1. formatting/lint
2. unit tests
3. type checks
4. build
5. crawl/SEO audit
6. before/after comparison

Never claim success from an exit code alone when the relevant artifact was not validated.

## Rollback

Back up each changed file before mutation. Store backups under `.search-growth-engine/backups` by default. Never delete the last known-good baseline automatically.
