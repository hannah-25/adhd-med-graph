# Performance Workflow

1. Define the metric and baseline.
2. Identify whether the issue is model calculation, rendering, IO, or build tooling.
3. Make one measurable change at a time.
4. Preserve graph correctness and safety copy.
5. Record the before/after result.
6. Run `npm run agent:verify`.
