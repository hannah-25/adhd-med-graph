import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getProfile, concertaOros, methylphenidateIr, medikinetRetard, atomoxetine } from "./pk-profiles.js";
import { createDoseEvent, expandSchedule, activeDoseEvents } from "./dose-events.js";
import { buildConcentrationSeries } from "./concentration-series.js";
import { effectAccrualFraction, buildEffectAccrualSeries } from "./effect-model.js";
import {
  attuneJournalTags,
  attunePdCalibrationFixtures,
  flattenFixtureDays,
  flattenFixtureTagChecks,
} from "./attune-journal-fixtures.js";
import {
  buildDoseRelativeObservations,
  buildPdCalibrationModel,
  buildPersonaObservations,
  classifyJournalTag,
  contextQualityScore,
  PD_SIGNAL,
  summarizePdObservations,
} from "./pd-calibration.js";

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
  assert.equal(getProfile("atomoxetine").id, "atomoxetine");
  assert.throws(() => getProfile("nope"));
});

test("modelKind classifies stimulants vs accumulation drugs", () => {
  assert.equal(concertaOros.modelKind, "same-day-curve");
  assert.equal(methylphenidateIr.modelKind, "same-day-curve");
  assert.equal(medikinetRetard.modelKind, "same-day-curve");
  assert.equal(atomoxetine.modelKind, "accumulation");
});

test("effectAccrualFraction is monotonic, 0 at week 0, ~25%/90% at onset/stabilize", () => {
  const accrual = { onsetWeeks: 2, stabilizeWeeks: 6 };
  assert.equal(effectAccrualFraction(0, accrual), 0);
  assert.ok(Math.abs(effectAccrualFraction(2, accrual) - 0.25) < 0.02, "onset ~25%");
  assert.ok(Math.abs(effectAccrualFraction(6, accrual) - 0.9) < 0.02, "stabilize ~90%");
  let prev = -1;
  for (let w = 0; w <= 12; w += 0.5) {
    const f = effectAccrualFraction(w, accrual);
    assert.ok(f >= prev - 1e-9, `monotonic at week ${w}`);
    assert.ok(f >= 0 && f <= 1, `bounded at week ${w}`);
    prev = f;
  }
  assert.throws(() => effectAccrualFraction(1, { onsetWeeks: 6, stabilizeWeeks: 2 }));
});

test("buildEffectAccrualSeries spans 0..endWeeks rising to near full effect", () => {
  const endWeeks = atomoxetine.effectAccrual.stabilizeWeeks + 4;
  const series = buildEffectAccrualSeries({ effectAccrual: atomoxetine.effectAccrual, endWeeks });
  assert.equal(series[0].week, 0);
  assert.equal(series[0].percent, 0);
  assert.equal(series[series.length - 1].week, endWeeks);
  assert.ok(series[series.length - 1].percent > 90, "near full effect past stabilize");
  // stabilizeWeeks anchor (~90%)
  const atStabilize = series.find((s) => Math.abs(s.week - atomoxetine.effectAccrual.stabilizeWeeks) < 1e-9);
  assert.ok(Math.abs(atStabilize.percent - 90) < 2, `~90% at stabilize, got ${atStabilize.percent}`);
});

test("atomoxetine steady-state daily curve is single-peak near Tmax 1.5 h", () => {
  const { stats } = buildConcentrationSeries({
    profile: atomoxetine,
    doseEvents: [createDoseEvent({ medicationId: atomoxetine.id, amountMg: 40, takenAtHour: 0 })],
    grid: { startHour: 0, endHour: 24, stepMinutes: 1 },
  });
  assert.ok(Math.abs(stats.tmaxHour - 1.5) <= 0.4, `tmax=${stats.tmaxHour}`);
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

function hoursAfterDose(fixtureDay, tagCheck) {
  const doseAt = Date.parse(fixtureDay.doseEvents[0].takenAt);
  const checkedAt = Date.parse(tagCheck.checkedAt);
  return (checkedAt - doseAt) / (60 * 60 * 1000);
}

function checksForPersona(personaId) {
  const fixture = attunePdCalibrationFixtures.find((item) => item.personaId === personaId);
  return fixture.days.flatMap((fixtureDay) =>
    fixtureDay.tagChecks.map((check) => ({
      ...check,
      hoursAfterDose: hoursAfterDose(fixtureDay, check),
    })),
  );
}

test("Attune PD fixtures use synthetic timestamped journal shapes", () => {
  assert.equal(attunePdCalibrationFixtures.length, 4);
  assert.ok(attuneJournalTags.length > 0);

  const tagIds = new Set(attuneJournalTags.map((tag) => tag.tagId));
  assert.equal(tagIds.size, attuneJournalTags.length, "tag ids should be unique");

  for (const fixture of attunePdCalibrationFixtures) {
    assert.match(fixture.personaId, /^[a-z0-9-]+$/);
    assert.ok(fixture.description.includes("response") || fixture.description.includes("Side-effect"));
    assert.ok(fixture.days.length >= 4);
    assert.ok(fixture.expectedPdPattern.primaryFit);

    for (const fixtureDay of fixture.days) {
      assert.match(fixtureDay.journalDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(fixtureDay.doseEvents.length, 1);
      assert.equal(fixtureDay.doseEvents[0].source, "synthetic-fixture");
      assert.equal(fixtureDay.doseEvents[0].medicationId, "concerta-oros");
      assert.ok(Number.isFinite(Date.parse(fixtureDay.doseEvents[0].takenAt)));
      assert.ok([4, 5, 6, 7, 8, 9].includes(fixtureDay.context.sleepHour));
      assert.ok(["GOOD", "NORMAL", "BAD"].includes(fixtureDay.context.sleepQuality));
      assert.equal(typeof fixtureDay.context.ateBreakfast, "boolean");
      assert.equal(typeof fixtureDay.context.ateLunch, "boolean");
      assert.equal(typeof fixtureDay.context.ateDinner, "boolean");
      assert.equal(fixtureDay.goals.length, 1);
      assert.ok(fixtureDay.goals[0].score >= 0 && fixtureDay.goals[0].score <= 10);
      assert.ok(fixtureDay.memo.startsWith("Synthetic:"));

      for (const check of fixtureDay.tagChecks) {
        assert.ok(tagIds.has(check.tagId), `unknown tag ${check.tagId}`);
        assert.equal(check.journalDate, fixtureDay.journalDate);
        assert.ok(Number.isFinite(Date.parse(check.checkedAt)));
        assert.ok(hoursAfterDose(fixtureDay, check) >= 0);
      }
    }
  }
});

test("Attune PD fixtures expose the intended calibration patterns", () => {
  const baseline = checksForPersona("baseline-responder");
  assert.ok(baseline.some((check) => check.tagId === "condition-up" && check.hoursAfterDose >= 1 && check.hoursAfterDose <= 2));
  assert.ok(baseline.some((check) => check.tagId.startsWith("trouble-") && check.hoursAfterDose >= 7.5));

  const delayed = checksForPersona("delayed-responder");
  assert.ok(delayed.some((check) => check.tagId === "condition-foggy" && check.hoursAfterDose < 2.5));
  assert.ok(delayed.some((check) => check.tagId === "condition-up" && check.hoursAfterDose >= 2.5));

  const shortDuration = checksForPersona("short-duration-responder");
  assert.ok(shortDuration.some((check) => check.tagId === "condition-up" && check.hoursAfterDose <= 2));
  assert.ok(shortDuration.some((check) => check.tagId.startsWith("trouble-") && check.hoursAfterDose >= 5 && check.hoursAfterDose <= 7));

  const sideEffectSensitive = checksForPersona("side-effect-sensitive-responder");
  assert.ok(sideEffectSensitive.some((check) => check.tagId === "condition-up" && check.hoursAfterDose <= 2));
  assert.ok(sideEffectSensitive.some((check) => check.tagId.startsWith("side-effect-") && check.hoursAfterDose >= 2 && check.hoursAfterDose <= 5));
});

test("fixture flatten helpers preserve persona and event counts", () => {
  const days = flattenFixtureDays();
  const tagChecks = flattenFixtureTagChecks();
  const directDayCount = attunePdCalibrationFixtures.reduce((count, fixture) => count + fixture.days.length, 0);
  const directTagCount = attunePdCalibrationFixtures.reduce(
    (count, fixture) => count + fixture.days.reduce((dayCount, fixtureDay) => dayCount + fixtureDay.tagChecks.length, 0),
    0,
  );

  assert.equal(days.length, directDayCount);
  assert.equal(tagChecks.length, directTagCount);
  assert.ok(days.every((fixtureDay) => fixtureDay.personaId));
  assert.ok(tagChecks.every((check) => check.personaId));
});

test("PD calibration classifies Attune tags into response, impairment, and side-effect signals", () => {
  const tag = (id) => attuneJournalTags.find((item) => item.tagId === id);
  assert.equal(classifyJournalTag(tag("condition-up")).signal, PD_SIGNAL.THERAPEUTIC_RESPONSE);
  assert.equal(classifyJournalTag(tag("condition-calm")).signal, PD_SIGNAL.THERAPEUTIC_RESPONSE);
  assert.equal(classifyJournalTag(tag("condition-foggy")).signal, PD_SIGNAL.IMPAIRMENT);
  assert.equal(classifyJournalTag(tag("trouble-inattention")).signal, PD_SIGNAL.IMPAIRMENT);
  assert.equal(classifyJournalTag(tag("condition-tight")).signal, PD_SIGNAL.SIDE_EFFECT);
  assert.equal(classifyJournalTag(tag("side-effect-jittery")).signal, PD_SIGNAL.SIDE_EFFECT);
});

test("PD calibration converts timestamped checks to dose-relative observations", () => {
  const fixture = attunePdCalibrationFixtures.find((item) => item.personaId === "baseline-responder");
  const observations = buildDoseRelativeObservations(fixture.days[0], attuneJournalTags);

  assert.equal(observations.length, fixture.days[0].tagChecks.length);
  assert.deepEqual(
    observations.map((item) => item.hoursAfterDose),
    [1.3333, 2.25, 5.1667, 8.3333],
  );
  assert.equal(observations[0].signal, PD_SIGNAL.THERAPEUTIC_RESPONSE);
  assert.equal(observations.at(-1).signal, PD_SIGNAL.IMPAIRMENT);
  assert.equal(observations[0].medicationId, "concerta-oros");
  assert.equal(observations[0].amountMg, 18);
  assert.ok(observations.every((item) => item.contextQuality > 0));
});

test("PD calibration context score treats sleep and meals as observation context", () => {
  assert.ok(contextQualityScore({
    sleepHour: 8,
    sleepQuality: "GOOD",
    ateBreakfast: true,
    ateLunch: true,
    ateDinner: true,
  }) > 0.8);
  assert.ok(contextQualityScore({
    sleepHour: 4,
    sleepQuality: "BAD",
    ateBreakfast: false,
    ateLunch: true,
    ateDinner: false,
  }) < 0);
});

test("PD calibration summaries preserve persona-level timing differences", () => {
  const summaryFor = (personaId) => {
    const fixture = attunePdCalibrationFixtures.find((item) => item.personaId === personaId);
    return summarizePdObservations(buildPersonaObservations(fixture, attuneJournalTags));
  };

  const baseline = summaryFor("baseline-responder");
  const delayed = summaryFor("delayed-responder");
  const shortDuration = summaryFor("short-duration-responder");
  const sideEffectSensitive = summaryFor("side-effect-sensitive-responder");

  assert.ok(delayed.perceivedPeakHour > baseline.perceivedPeakHour + 1, `${delayed.perceivedPeakHour} vs ${baseline.perceivedPeakHour}`);
  assert.ok(shortDuration.perceivedOffsetHour < baseline.perceivedOffsetHour, `${shortDuration.perceivedOffsetHour} vs ${baseline.perceivedOffsetHour}`);
  assert.equal(sideEffectSensitive.sideEffectBurden, "high");
  assert.ok(sideEffectSensitive.sideEffectPeakHour >= 2 && sideEffectSensitive.sideEffectPeakHour <= 4);
});

test("PD calibration model bundles observations and a descriptive summary only (no fitted curve)", () => {
  const fixture = attunePdCalibrationFixtures.find((item) => item.personaId === "side-effect-sensitive-responder");
  const model = buildPdCalibrationModel({
    personaFixture: fixture,
    tags: attuneJournalTags,
  });

  assert.equal(model.personaId, fixture.personaId);
  assert.equal(model.observations.length, fixture.days.reduce((count, fixtureDay) => count + fixtureDay.tagChecks.length, 0));
  assert.equal(model.summary.sideEffectBurden, "high");
  // We deliberately do not synthesize a continuous response curve from sparse,
  // binary self-report data — only raw observations and descriptive summaries.
  assert.equal(model.responseSeries, undefined);
});

test("personal response demo exposes the PK/PD safety boundary", () => {
  const html = readFileSync(new URL("./personal-response-demo.html", import.meta.url), "utf8");
  assert.ok(html.includes("personal-response-demo.js"));
  assert.ok(html.includes("기본 PK 추정 곡선"));
  assert.ok(html.includes("이론적 PK"));
  // No fitted PD/effect curve is drawn — acute tolerance is a caveat only.
  assert.ok(html.includes("급성 내성"));
  assert.ok(html.includes("정량 효과 곡선은 그리지 않았습니다"));
  // Individual thresholds vary, so points are not laned/thresholded.
  assert.ok(html.includes("개인마다 다릅니다"));
  assert.ok(html.includes("진단, 치료 조언, 실제 혈중농도 측정, 복용 지침이 아닙니다"));

  const js = readFileSync(new URL("./personal-response-demo.js", import.meta.url), "utf8");
  assert.ok(js.includes("buildPdCalibrationModel"));
  assert.ok(js.includes("buildConcentrationSeries"));
  assert.ok(js.includes("기본 반응형"));
  assert.ok(js.includes("좋은 반응"));
});
