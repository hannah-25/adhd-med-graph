# Dependency Rules

## Runtime Dependencies

Current tracked package metadata has no runtime dependencies.

New dependencies must have:

- a clear purpose,
- license compatibility,
- low maintenance risk,
- no unnecessary production surface.

## Reference Source Boundary

`research/open-source/` may contain local clones or copied reference projects. These are ignored by git except for `README.md`.

Rules:

- GPL projects are concept references only.
- Unlicensed projects are behavior/UX references only until license is clarified.
- MIT projects may be candidates for reuse only after explicit decision and attribution plan.
- Do not paste reference source into prototype code without documenting license review.

## Tooling Dependencies

Prefer standard Node scripts until the prototype requires a fuller toolchain. Add ESLint, TypeScript, dependency-cruiser, or test frameworks only when implementation exists and the value is concrete.
