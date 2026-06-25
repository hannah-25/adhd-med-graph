# Doc Gardening Workflow

## Purpose

Keep project knowledge current without turning `AGENTS.md` into a large manual.

## Loop

1. Run `npm run agent:check-docs`.
2. Read stale or conflicting docs.
3. Compare docs against current files and scripts.
4. Update human-maintained docs.
5. Regenerate generated docs with `npm run agent:generate`.
6. Mark uncertainty as `ASSUMPTION`.
7. Track unresolved work as `TODO(owner, YYYY-MM-DD, reason)`.
8. Run `npm run agent:verify`.

## Deprecating Docs

Before deleting an outdated doc:

- mark it deprecated,
- link the replacement,
- keep the transition in the same PR when possible.

## Generated Docs

Do not hand-edit `docs/generated/` files.
