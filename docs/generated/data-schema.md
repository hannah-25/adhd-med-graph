# Data Schema

> GENERATED FILE. Do not edit by hand. Run `npm run agent:generate`.

## Current State

No persisted database schema exists in this repository.

## Domain Shapes

### pkProfile

- `id`: stable medication/formulation id
- `displayName`: user-facing label
- `genericName`: generic medication name
- `halfLifeHours`: elimination half-life in hours
- `releaseProfile`: formulation/release model id
- `peakTimeHours`: expected peak time in hours
- `evidence`: source metadata array

### doseEvent

- `medicationId`: references a `pkProfile.id`
- `amountMg`: dose amount in milligrams
- `takenAtHour`: local day hour as decimal hours
- `source`: scheduled, actual, skipped, or adjustment event source

### samplingGrid

- `startHour`: start of observation window
- `endHour`: end of observation window
- `stepMinutes`: sample interval

### concentrationSeries item

- `hour`: sample hour
- `percent`: normalized concentration percentage
- `raw`: raw model output

## Existing Prototype Files

Prototype directory does not exist yet.

## Source Rule Document

See [../architecture/data-rules.md](../architecture/data-rules.md).
