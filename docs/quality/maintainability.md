# Maintainability

## Current Strengths

- Research references are separated from tracked prototype code.
- Architecture intent is documented before implementation.
- Agent commands provide one verification entry point.

## Current Risks

- No executable prototype exists yet.
- No unit test framework exists yet.
- Existing reference source must not leak into tracked code.

## Maintenance Rules

- Keep documents short and linked.
- Prefer generated maps for file indexes.
- Track deferred cleanup in [../exec-plans/tech-debt-tracker.md](../exec-plans/tech-debt-tracker.md).
- Add stricter tooling only when it can run reliably in CI.
