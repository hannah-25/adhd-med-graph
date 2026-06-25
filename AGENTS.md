# adhd-med-graph Agent Map

## Project Purpose

`adhd-med-graph` is a local research/prototype repository for validating ADHD medication concentration and effect graph models before porting them into Attune.

Current state: documentation and research workspace only. The planned executable prototype belongs under `prototype/`.

## Stack Summary

- Runtime: Node.js with ESM package metadata.
- Frontend target: browser prototype first; future Attune FE mapping is React/TypeScript.
- Backend target: none in this repository.
- Database: none in this repository.
- Tests: lightweight Node-based harness scripts for now.
- CI/CD: GitHub Actions via `.github/workflows/ci.yml`.

## Key Directories

- `docs/`: human-maintained project, architecture, engineering, and agent guidance.
- `docs/generated/`: generated maps. Do not edit by hand.
- `docs/exec-plans/`: plans for complex work.
- `research/`: research notes and open-source analysis.
- `research/open-source/`: ignored local reference clones/copies.
- `scripts/agent/`: standard commands for agents and CI.
- `prototype/`: planned browser prototype location.
- `.env.example`: example environment variable names only.

## Common Commands

- Bootstrap checks: `npm run agent:bootstrap`
- Run locally: `npm run agent:run-local`
- Test: `npm test`
- Build: `npm run build`
- Lint: `npm run agent:lint`
- Docs check: `npm run agent:check-docs`
- Architecture check: `npm run agent:architecture-check`
- Full verification: `npm run agent:verify`
- Regenerate maps: `npm run agent:generate`

PowerShell wrappers exist under `scripts/agent/*.ps1`. Extensionless Node entrypoints also exist under `scripts/agent/` for agents that expect paths such as `scripts/agent/verify`.

## Before Work

Read these first:

- [docs/README.md](docs/README.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/agent/agent-workflow.md](docs/agent/agent-workflow.md)
- Relevant workflow in `docs/agent/`
- Existing active plans in `docs/exec-plans/active/`

## PR Checklist

- Run `npm run agent:verify`.
- Update related docs when code, workflow, security, or architecture changes.
- Keep generated docs in `docs/generated/` current with `npm run agent:generate`.
- Add or update an execution plan for complex changes.
- Confirm no secrets, medical advice, or copied restricted-license source were added.
- Update [docs/harness-change-summary.md](docs/harness-change-summary.md) when the harness itself changes.

## Do Not

- Do not commit secrets, tokens, patient data, or production credentials.
- Do not copy GPL or unlicensed reference source into product/prototype code.
- Do not put DOM, canvas, localStorage, or framework code into pure PK calculation modules.
- Do not modify Attune repositories from this prototype repository.
- Do not present graph output as medical advice.

## Ask A Human When

- A decision changes medical safety wording or product claims.
- A reference project license is unclear.
- The work requires real Attune API, DB, auth, or production deployment details.
- A rule would break current work unless relaxed.
- A document and code disagree and the intended behavior is not obvious.
