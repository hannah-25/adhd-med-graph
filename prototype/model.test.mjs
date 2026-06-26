import assert from "node:assert/strict";
import test from "node:test";

import { getProfile, concertaOros, methylphenidateIr, medikinetRetard } from "./pk-profiles.js";
import { createDoseEvent, expandSchedule, activeDoseEvents } from "./dose-events.js";
import { buildConcentrationSeries } from "./concentration-series.js";

const grid = { startHour: 0, endHour: 30, stepMinutes: 1 };

function singleDoseSeries(amountMg, takenAtHour = 0) {
  return buildConcentrationSeries({
    profile: concertaOros,
    doseEvents: [createDoseEvent({ medicationId: concertaOros.id, amountMg, takenAtHour })],
    grid,
  });
}

test("model runs without DOM and returns chart-ready points", () => {
  const { series } = singleDoseSeries(18);
  assert.ok(series.length > 0);
  for (const p of series) {
    assert.equal(typeof p.hour, "number");
    assert.equal(typeof p.raw, "number");
    assert.equal(typeof p.percent, "number");
  }
});

test("18 mg single dose reproduces reference Cmax / Tmax / AUC", () => {
  const { series, stats } = singleDoseSeries(18);
  // Tmax 6.8 ± reasonable grid tolerance.
  assert.ok(Math.abs(stats.tmaxHour - 6.8) <= 0.6, `tmax=${stats.tmaxHour}`);
  // Cmax 3.7 within 10%.
  assert.ok(Math.abs(stats.cmaxRaw - 3.7) <= 0.37, `cmax=${stats.cmaxRaw}`);
  // AUC by trapezoid over the window, target 41.8 (tail beyond 30h truncated).
  let auc = 0;
  for (let i = 1; i < series.length; i += 1) {
    auc += ((series[i].raw + series[i - 1].raw) / 2) * (series[i].hour - series[i - 1].hour);
  }
  assert.ok(Math.abs(auc - 41.8) <= 3, `auc=${auc}`);
});

test("biphasic shape: early IR bump near 1h precedes the main ER peak", () => {
  const { series } = singleDoseSeries(18);
  const at = (h) => series.find((p) => Math.abs(p.hour - h) < 1e-6)?.raw ?? 0;
  // Early bump around 1h, a small dip after it, then the main peak much later.
  assert.ok(at(1) > at(0.25), "should rise to an early IR bump by 1h");
  assert.ok(at(1.5) < at(1), "small dip after the IR bump");
  assert.ok(at(6.5) > at(1), "ER peak well above the early bump");
});

test("dose proportionality: Cmax scales linearly with dose", () => {
  const c18 = singleDoseSeries(18).stats.cmaxRaw;
  const c36 = singleDoseSeries(36).stats.cmaxRaw;
  // Linear by construction; tolerance accounts for 4-decimal rounding of cmaxRaw.
  assert.ok(Math.abs(c36 / c18 - 2) < 1e-3, `ratio=${c36 / c18}`);
});

test("IR + ER components sum to the total series", () => {
  const { series, components } = singleDoseSeries(18);
  for (let i = 0; i < series.length; i += 1) {
    const sum = components.ir[i].raw + components.er[i].raw;
    assert.ok(Math.abs(sum - series[i].raw) < 0.02, `mismatch at ${series[i].hour}`);
  }
});

test("skipped doses do not contribute; schedule expands to concrete events", () => {
  const events = expandSchedule({
    medicationId: concertaOros.id,
    amountMg: 18,
    firstHour: 7,
    intervalHours: 24,
    count: 3,
  });
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((e) => e.takenAtHour), [7, 31, 55]);

  const withSkip = [...events, createDoseEvent({ medicationId: concertaOros.id, amountMg: 18, takenAtHour: 7, source: "skipped" })];
  assert.equal(activeDoseEvents(withSkip).length, 3);
});

test("getProfile returns the registered profile and throws on unknown", () => {
  assert.equal(getProfile("concerta-oros").id, "concerta-oros");
  assert.equal(getProfile("methylphenidate-ir").id, "methylphenidate-ir");
  assert.equal(getProfile("methylphenidate-medikinet").id, "methylphenidate-medikinet");
  assert.throws(() => getProfile("nope"));
});

test("Medikinet retard reproduces SmPC Cmax / Tmax (20 mg)", () => {
  const { series, stats } = buildConcentrationSeries({
    profile: medikinetRetard,
    doseEvents: [createDoseEvent({ medicationId: medikinetRetard.id, amountMg: 20, takenAtHour: 0 })],
    grid: { startHour: 0, endHour: 24, stepMinutes: 1 },
  });
  // SmPC: Cmax 6.4 ng/mL, Tmax 2.75 h.
  assert.ok(Math.abs(stats.cmaxRaw - 6.4) <= 0.5, `cmax=${stats.cmaxRaw}`);
  assert.ok(Math.abs(stats.tmaxHour - 2.75) <= 0.5, `tmax=${stats.tmaxHour}`);
  // Has a real ER contribution (50% ER), unlike the immediate-release profile.
  const { components } = buildConcentrationSeries({
    profile: medikinetRetard,
    doseEvents: [createDoseEvent({ medicationId: medikinetRetard.id, amountMg: 20, takenAtHour: 0 })],
    grid: { startHour: 0, endHour: 24, stepMinutes: 1 },
  });
  assert.ok(components.er.some((p) => p.raw > 1), "Medikinet should have a substantial ER contribution");

  // Plateau, not a sharp later peak: value at 3.5 h stays near the peak.
  const at = (h) => series.find((p) => Math.abs(p.hour - h) < 1e-6)?.raw ?? 0;
  assert.ok(at(3.5) > stats.cmaxRaw * 0.9, "should hold a plateau after the peak");
});

test("IR methylphenidate is a single-peak curve (no biphasic shape)", () => {
  const { series, stats } = buildConcentrationSeries({
    profile: methylphenidateIr,
    doseEvents: [createDoseEvent({ medicationId: methylphenidateIr.id, amountMg: 10, takenAtHour: 0 })],
    grid: { startHour: 0, endHour: 24, stepMinutes: 1 },
  });

  // Early single peak near 1.5 h (FDA IR label initial Tmax).
  assert.ok(Math.abs(stats.tmaxHour - 1.5) <= 0.4, `tmax=${stats.tmaxHour}`);

  // Strictly rises to the peak, then strictly falls — no second bump.
  const peakIdx = series.findIndex((p) => p.hour === stats.tmaxHour);
  for (let i = 1; i <= peakIdx; i += 1) {
    assert.ok(series[i].raw >= series[i - 1].raw - 1e-9, `not monotonic up at ${series[i].hour}`);
  }
  for (let i = peakIdx + 1; i < series.length; i += 1) {
    assert.ok(series[i].raw <= series[i - 1].raw + 1e-9, `not monotonic down at ${series[i].hour}`);
  }

  // No ER component: the ER series stays ~0 throughout.
  const { components } = buildConcentrationSeries({
    profile: methylphenidateIr,
    doseEvents: [createDoseEvent({ medicationId: methylphenidateIr.id, amountMg: 10, takenAtHour: 0 })],
    grid: { startHour: 0, endHour: 24, stepMinutes: 1 },
  });
  assert.ok(components.er.every((p) => p.raw < 1e-6), "IR profile should have no ER contribution");
});
