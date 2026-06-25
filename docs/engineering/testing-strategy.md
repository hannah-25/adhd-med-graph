# Testing Strategy

## Current Strategy

Because the tracked repository currently has no executable prototype, tests are harness checks:

- docs link validation,
- architecture boundary checks,
- generated documentation updates.

Run:

```bash
npm test
```

## Target Strategy

When `prototype/` is implemented:

- add unit tests for pharmacokinetic math,
- add snapshot or fixture tests for `concentrationSeries`,
- add input validation tests for invalid grids and dose events,
- add a browser smoke test for the demo page if a dev server is introduced.

## Medical Safety Testing

Tests should verify that safety copy remains present in user-facing prototype pages.
