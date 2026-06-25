# Architecture

This file is the short architecture entry point. Detailed rules live under [docs/architecture/](docs/architecture/index.md).

## Current State

`adhd-med-graph` is a research and prototype-preparation repository. It currently contains docs, package metadata, research notes, ignored open-source reference copies, and agent harness scripts.

ASSUMPTION: The next implementation step is a browser prototype under `prototype/`, as described in existing project docs.

## Target Shape

```txt
pkProfile + doseEvents + samplingGrid -> concentrationSeries -> chart UI
```

Target modules:

```txt
prototype/
├─ pk-profiles.js
├─ dose-events.js
├─ pharmacokinetics.js
├─ concentration-series.js
├─ concentration-demo.html
└─ styles.css
```

## Core Boundaries

- Research references stay under `research/open-source/` and are not imported by prototype code.
- PK calculation code is pure model code.
- UI rendering code depends on model output, not the other way around.
- Medication profile data and user dose events remain separate.
- Medical safety copy is visible and must not be weakened without review.
- Future Attune integration is specified before Attune code is changed.

## Enforced Checks

Run:

```bash
npm run agent:verify
```

The current custom architecture check verifies:

- expected project metadata,
- ignored reference-source boundary,
- absence of old root demo entry files,
- prototype pure-model boundaries when prototype files exist,
- no generated docs are manually marked as editable.

See [docs/architecture/module-rules.md](docs/architecture/module-rules.md) and [docs/architecture/dependency-rules.md](docs/architecture/dependency-rules.md).
