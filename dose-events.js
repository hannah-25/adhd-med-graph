// User dose events. Kept separate from medication PK profiles (data-rules.md).
//
// A doseEvent is a concrete medication intake:
//   { medicationId, amountMg, takenAtHour, source }
// source: "scheduled" | "taken" | "skipped" | "adjusted"

/** Create a single concrete dose event. */
export function createDoseEvent({ medicationId, amountMg, takenAtHour, source = "scheduled" }) {
  return { medicationId, amountMg, takenAtHour, source };
}

/**
 * Expand a repeating schedule into a concrete list of dose events BEFORE any
 * concentration math runs (module-rules.md: do not hide repeat dosing inside
 * low-level functions).
 *
 * spec: { medicationId, amountMg, firstHour, intervalHours, count, source }
 */
export function expandSchedule({
  medicationId,
  amountMg,
  firstHour,
  intervalHours,
  count,
  source = "scheduled",
}) {
  const events = [];
  for (let i = 0; i < count; i += 1) {
    events.push(
      createDoseEvent({
        medicationId,
        amountMg,
        takenAtHour: firstHour + i * intervalHours,
        source,
      }),
    );
  }
  return events;
}

/** Dose events that actually contribute to concentration (skipped excluded). */
export function activeDoseEvents(doseEvents) {
  return doseEvents.filter((e) => e.source !== "skipped" && e.amountMg > 0);
}
