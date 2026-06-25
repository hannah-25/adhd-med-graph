# Agent Workflow

Use this loop for every change:

1. Read [../../AGENTS.md](../../AGENTS.md).
2. Find related docs under [../README.md](../README.md).
3. Inspect the current code and file structure.
4. Write or update a small plan for the change.
5. Implement in small, reviewable steps.
6. Run tests and harness checks.
7. If checks fail, diagnose the root cause and fix it.
8. Update related docs.
9. Run architecture checks.
10. Write a concise change summary or PR description.

## Required Commands

Use these before handing off work:

```bash
npm run agent:verify
```

If generated docs are intentionally changed:

```bash
npm run agent:generate
```

## When To Create An Execution Plan

Create a plan in `docs/exec-plans/active/` when work:

- changes architecture,
- spans several modules,
- affects safety, security, or data models,
- introduces dependencies,
- changes CI or deployment.

Move it to `docs/exec-plans/completed/` when done.

Keep `.gitkeep` files in both directories so the planning structure remains visible before plans exist.
