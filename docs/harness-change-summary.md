# Harness Change Summary

## 2026-06-25

Built the initial Harness Engineering system for `adhd-med-graph`.

## Added

- Root agent map in `AGENTS.md`.
- Root architecture entry point in `ARCHITECTURE.md`.
- Structured documentation under `docs/`.
- Execution plan system under `docs/exec-plans/`.
- Agent workflows and PR review checklist under `docs/agent/`.
- Quality, reliability, security, and maintainability docs under `docs/quality/`.
- Generated project, dependency, API, and data schema maps under `docs/generated/`.
- Standard agent scripts under `scripts/agent/`.
- GitHub Actions CI in `.github/workflows/ci.yml`.
- `.env.example` with no real secrets.

## Enforced

- Documentation link checks.
- Generated-doc notice checks.
- Reference-source boundary checks.
- Prototype model purity checks when prototype files exist.
- Secret-file ignore expectations.

## Deferred

- Real formatter/linter integration.
- Unit tests for model modules.
- Browser smoke tests for the future demo.
- Dependency/license audit automation.
