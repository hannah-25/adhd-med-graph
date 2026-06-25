# Domain Overview

## Domain

The project models estimated medication concentration curves for educational visualization. The model is intended to help validate UI and data structures, not to calculate clinical dosing.

## Core Concepts

- `pkProfile`: medication/formulation metadata such as half-life, peak time, and release profile.
- `doseEvent`: a concrete scheduled or actual medication event.
- `samplingGrid`: observation window and sample interval for graph generation.
- `concentrationSeries`: normalized chart-ready time series derived from model inputs.

## Safety Boundary

The graph is an estimate. Actual blood concentration, clinical effect, side effects, and personal response can differ materially.

Medical safety copy must stay visible in the prototype. Any wording that implies advice, prescription, diagnosis, or dose optimization needs human review.

## Current Product State

Current implementation state: no executable prototype exists in the tracked root. Existing docs define the planned `prototype/` structure.

ASSUMPTION: Initial product focus is Concerta OROS and methylphenidate-style event-based medication graphing.
