# Coding Conventions

## JavaScript

- Use ESM modules.
- Prefer small pure functions for model logic.
- Keep side effects at the edge of the app.
- Name domain concepts directly: `pkProfile`, `doseEvent`, `samplingGrid`, `concentrationSeries`.
- Use explicit units in property names: `halfLifeHours`, `stepMinutes`, `amountMg`.

## Comments

Add comments only when they explain non-obvious math, safety constraints, or licensing boundaries.

## Generated Files

Files in `docs/generated/` must start with a generated-file notice and must not be manually edited.
