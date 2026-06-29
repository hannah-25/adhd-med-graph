// Pure PD calibration helpers for Attune-like timestamped journal data.
// These functions transform observed response events, not measured PK values.

export const PD_SIGNAL = {
  THERAPEUTIC_RESPONSE: "therapeutic-response",
  IMPAIRMENT: "impairment",
  SIDE_EFFECT: "side-effect",
  CONTEXT: "context",
};

const RESPONSE_TYPES = new Set(["UP", "CALM"]);
const IMPAIRMENT_CONDITION_TYPES = new Set(["FOGGY", "DOWN"]);
const SIDE_EFFECT_CONDITION_TYPES = new Set(["TIGHT"]);

function parseTime(value, fieldName) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${fieldName}: ${value}`);
  return parsed;
}

function hoursBetween(start, end) {
  return (parseTime(end, "end time") - parseTime(start, "start time")) / (60 * 60 * 1000);
}

function round(value, digits = 4) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function tagById(tags) {
  return new Map(tags.map((tag) => [tag.tagId, tag]));
}

function nearestDoseBeforeOrAt(check, doseEvents) {
  const checkedAtMs = parseTime(check.checkedAt, "checkedAt");
  const candidates = doseEvents
    .map((doseEvent) => ({ doseEvent, deltaMs: checkedAtMs - parseTime(doseEvent.takenAt, "takenAt") }))
    .filter((item) => item.deltaMs >= 0)
    .sort((a, b) => a.deltaMs - b.deltaMs);
  return candidates[0] ?? null;
}

export function classifyJournalTag(tag) {
  if (tag.category === "SIDE_EFFECT") {
    return { signal: PD_SIGNAL.SIDE_EFFECT, value: 1 };
  }
  if (tag.category === "TROUBLE") {
    return { signal: PD_SIGNAL.IMPAIRMENT, value: 1 };
  }
  if (tag.category === "CONDITION" && RESPONSE_TYPES.has(tag.tagType)) {
    return { signal: PD_SIGNAL.THERAPEUTIC_RESPONSE, value: 1 };
  }
  if (tag.category === "CONDITION" && IMPAIRMENT_CONDITION_TYPES.has(tag.tagType)) {
    return { signal: PD_SIGNAL.IMPAIRMENT, value: 1 };
  }
  if (tag.category === "CONDITION" && SIDE_EFFECT_CONDITION_TYPES.has(tag.tagType)) {
    return { signal: PD_SIGNAL.SIDE_EFFECT, value: 1 };
  }
  return { signal: PD_SIGNAL.CONTEXT, value: 0 };
}

export function contextQualityScore(context) {
  let score = 0;
  if (context.sleepQuality === "GOOD") score += 0.35;
  if (context.sleepQuality === "BAD") score -= 0.35;
  if (context.sleepHour >= 7 && context.sleepHour <= 9) score += 0.35;
  if (context.sleepHour <= 5) score -= 0.35;
  if (context.ateBreakfast) score += 0.1;
  if (context.ateLunch) score += 0.1;
  if (context.ateDinner) score += 0.1;
  return round(Math.max(-1, Math.min(1, score)), 3);
}

export function buildDoseRelativeObservations(journalDay, tags) {
  const tagsById = tagById(tags);
  return journalDay.tagChecks.map((check) => {
    const tag = tagsById.get(check.tagId);
    if (!tag) throw new Error(`Unknown journal tag: ${check.tagId}`);

    const doseMatch = nearestDoseBeforeOrAt(check, journalDay.doseEvents);
    if (!doseMatch) {
      throw new Error(`No dose event before check ${check.tagId} at ${check.checkedAt}`);
    }

    const classification = classifyJournalTag(tag);
    return {
      journalDate: journalDay.journalDate,
      checkedAt: check.checkedAt,
      doseTakenAt: doseMatch.doseEvent.takenAt,
      medicationId: doseMatch.doseEvent.medicationId,
      amountMg: doseMatch.doseEvent.amountMg,
      hoursAfterDose: round(doseMatch.deltaMs / (60 * 60 * 1000), 4),
      tagId: check.tagId,
      category: tag.category,
      tagType: tag.tagType,
      signal: classification.signal,
      value: classification.value,
      contextQuality: contextQualityScore(journalDay.context),
    };
  });
}

export function buildPersonaObservations(personaFixture, tags) {
  return personaFixture.days.flatMap((journalDay) =>
    buildDoseRelativeObservations(journalDay, tags).map((observation) => ({
      ...observation,
      personaId: personaFixture.personaId,
    })),
  );
}

export function summarizePdObservations(observations) {
  const responseHours = observations
    .filter((item) => item.signal === PD_SIGNAL.THERAPEUTIC_RESPONSE)
    .map((item) => item.hoursAfterDose);
  const impairmentHours = observations
    .filter((item) => item.signal === PD_SIGNAL.IMPAIRMENT)
    .map((item) => item.hoursAfterDose);
  const sideEffectHours = observations
    .filter((item) => item.signal === PD_SIGNAL.SIDE_EFFECT)
    .map((item) => item.hoursAfterDose);
  const lateImpairmentHours = impairmentHours.filter((hour) => responseHours.length && hour > Math.min(...responseHours));

  return {
    observationCount: observations.length,
    responseCount: responseHours.length,
    impairmentCount: impairmentHours.length,
    sideEffectCount: sideEffectHours.length,
    perceivedOnsetHour: round(quantile(responseHours, 0.1) ?? 0, 2),
    perceivedPeakHour: round(median(responseHours) ?? 0, 2),
    perceivedOffsetHour: round(quantile(lateImpairmentHours, 0.25) ?? quantile(impairmentHours, 0.75) ?? 0, 2),
    sideEffectPeakHour: round(median(sideEffectHours) ?? 0, 2),
    sideEffectBurden:
      sideEffectHours.length / Math.max(1, observations.length) >= 0.28 ? "high" : sideEffectHours.length > 0 ? "medium" : "low",
  };
}

// NOTE: We deliberately do NOT fit a continuous "personalized response curve"
// from these journal tags. The data is binary (tag present / absent), sparsely
// and non-randomly self-reported (~4 events per signal), so a smoothed curve
// would conflate report density with effect magnitude and overclaim a PD
// dose-response that the data cannot support. The demo instead plots the raw
// observations as points against the population PK curve and a label-based
// duration-of-action band. Only descriptive summaries are derived here.

export function buildPdCalibrationModel({ personaFixture, tags }) {
  const observations = buildPersonaObservations(personaFixture, tags);
  const summary = summarizePdObservations(observations);
  return {
    personaId: personaFixture.personaId,
    observations,
    summary,
  };
}
