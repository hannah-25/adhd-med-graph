# Module Rules

## Hard Rules

- Keep reference source under `research/open-source/`.
- Do not import from `research/open-source/` into prototype code.
- Keep `pharmacokinetics.js` free of DOM, canvas, localStorage, network, and framework code.
- Keep `concentration-series.js` focused on chart-ready data generation.
- Keep UI rendering in HTML/CSS/UI modules.
- Keep medication profile metadata separate from user dose events.

## Soft Rules

These become hard checks once matching code exists:

- Add focused tests for pure model modules.
- Keep one module responsibility per file.
- Do not hide repeated dosing inside a low-level concentration function. Expand schedules into dose events first.

## Current Automated Coverage

`scripts/agent/architecture-check.mjs` checks model-boundary keywords when `prototype/` files exist.
