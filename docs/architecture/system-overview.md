# System Overview

## Current System

The repository currently contains:

- project and architecture docs,
- research notes,
- ignored local reference clones/copies,
- package metadata,
- agent harness scripts.

There is no tracked runtime application yet.

## Target System

The next implementation layer is a browser prototype:

```txt
prototype/
├─ pk-profiles.js
├─ dose-events.js
├─ pharmacokinetics.js
├─ concentration-series.js
├─ concentration-demo.html
└─ styles.css
```

## Data Flow

```txt
pkProfile
  + doseEvents
  + samplingGrid
      -> pharmacokinetic calculations
      -> concentrationSeries
      -> chart UI
```

## Integration Boundary

Attune integration is future work. Before modifying Attune repositories, write or update an integration spec and execution plan.
