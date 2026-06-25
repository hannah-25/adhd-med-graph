# Error Handling Rules

## Current State

There is no runtime app yet. Error handling currently applies to scripts and future prototype modules.

## Script Errors

Agent scripts should:

- print the failing check,
- print a next action,
- exit non-zero only when the failure should block verification.

## Model Errors

Future model modules should:

- validate dose amount and time ranges,
- reject invalid sampling grids,
- return explicit errors for unknown medication profiles,
- avoid silently producing misleading graph data.

## UI Errors

Future UI should display clear non-medical error messages and preserve visible safety copy.
