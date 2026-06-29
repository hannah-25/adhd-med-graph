// Synthetic Attune-like journal fixtures for PD calibration prototyping.
// These records are invented and must not be treated as real patient data.

const CONDITION = "CONDITION";
const SIDE_EFFECT = "SIDE_EFFECT";
const TROUBLE = "TROUBLE";

const dateTime = (journalDate, hhmm) => `${journalDate}T${hhmm}:00`;

function tagCheck(journalDate, hhmm, tagId) {
  const tag = attuneJournalTags.find((item) => item.tagId === tagId);
  if (!tag) throw new Error(`Unknown fixture tag: ${tagId}`);
  return {
    tagId,
    journalDate,
    checkedAt: dateTime(journalDate, hhmm),
  };
}

function dose(journalDate, hhmm, amountMg = 18) {
  return {
    medicationId: "concerta-oros",
    amountMg,
    takenAt: dateTime(journalDate, hhmm),
    source: "synthetic-fixture",
  };
}

function context({ sleepHour, sleepQuality, breakfast = true, lunch = true, dinner = true }) {
  return {
    sleepHour,
    sleepQuality,
    ateBreakfast: breakfast,
    ateLunch: lunch,
    ateDinner: dinner,
  };
}

function goal(journalDate, score, content = "Focus block") {
  return {
    goalId: "goal-focus-block",
    journalDate,
    content,
    score,
  };
}

function day({ journalDate, doseTime = "08:00", amountMg = 18, context: dayContext, tags, score, memo }) {
  return {
    journalDate,
    doseEvents: [dose(journalDate, doseTime, amountMg)],
    context: dayContext,
    tagChecks: tags.map(([hhmm, tagId]) => tagCheck(journalDate, hhmm, tagId)),
    goals: [goal(journalDate, score)],
    memo,
  };
}

export const attuneJournalTags = [
  {
    tagId: "condition-up",
    name: "Up",
    category: CONDITION,
    tagType: "UP",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "condition-calm",
    name: "Calm",
    category: CONDITION,
    tagType: "CALM",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "condition-foggy",
    name: "Foggy",
    category: CONDITION,
    tagType: "FOGGY",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "condition-down",
    name: "Down",
    category: CONDITION,
    tagType: "DOWN",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "condition-tight",
    name: "Tight",
    category: CONDITION,
    tagType: "TIGHT",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "trouble-inattention",
    name: "Inattention",
    category: TROUBLE,
    tagType: "INATTENTION",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "trouble-time-management",
    name: "Time management",
    category: TROUBLE,
    tagType: "TIME_MANAGEMENT",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "trouble-cognitive-error",
    name: "Cognitive error",
    category: TROUBLE,
    tagType: "COGNITIVE_ERROR",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "trouble-impulsivity",
    name: "Impulsivity",
    category: TROUBLE,
    tagType: "IMPULSIVITY",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "side-effect-appetite",
    name: "Low appetite",
    category: SIDE_EFFECT,
    tagType: "NONE",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "side-effect-jittery",
    name: "Jittery",
    category: SIDE_EFFECT,
    tagType: "NONE",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
  {
    tagId: "side-effect-headache",
    name: "Headache",
    category: SIDE_EFFECT,
    tagType: "NONE",
    source: "SYSTEM",
    enabled: true,
    visible: true,
  },
];

export const attunePdCalibrationFixtures = [
  {
    personaId: "baseline-responder",
    label: "Baseline responder",
    description: "Positive response appears near the population curve, then trouble events return late afternoon.",
    expectedPdPattern: {
      primaryFit: "standard-effect-delay",
      perceivedOnsetAfterDoseHours: [1, 1.75],
      perceivedPeakAfterDoseHours: [2, 4],
      perceivedOffsetAfterDoseHours: [7.5, 9],
      sideEffectBurden: "low",
    },
    days: [
      day({
        journalDate: "2026-02-02",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:20", "condition-up"],
          ["10:15", "condition-calm"],
          ["13:10", "condition-calm"],
          ["16:20", "trouble-time-management"],
        ],
        score: 8,
        memo: "Synthetic: clear morning response, late afternoon planning friction.",
      }),
      day({
        journalDate: "2026-02-03",
        context: context({ sleepHour: 8, sleepQuality: "GOOD" }),
        tags: [
          ["09:35", "condition-up"],
          ["11:10", "condition-calm"],
          ["15:55", "trouble-inattention"],
          ["16:40", "condition-foggy"],
        ],
        score: 8,
        memo: "Synthetic: good response window with mild late-day fade.",
      }),
      day({
        journalDate: "2026-02-04",
        context: context({ sleepHour: 6, sleepQuality: "NORMAL" }),
        tags: [
          ["09:45", "condition-up"],
          ["12:20", "condition-calm"],
          ["15:50", "trouble-cognitive-error"],
          ["17:15", "trouble-time-management"],
        ],
        score: 7,
        memo: "Synthetic: response present, sleep context makes offset noisier.",
      }),
      day({
        journalDate: "2026-02-05",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:30", "condition-up"],
          ["10:45", "condition-calm"],
          ["14:50", "condition-calm"],
          ["16:35", "trouble-inattention"],
        ],
        score: 8,
        memo: "Synthetic: repeatable onset and late-day impairment marker.",
      }),
    ],
  },
  {
    personaId: "delayed-responder",
    label: "Delayed perceived peak",
    description: "Early foggy markers are followed by positive response later than the default PK peak would suggest.",
    expectedPdPattern: {
      primaryFit: "effect-delay",
      perceivedOnsetAfterDoseHours: [2.25, 3],
      perceivedPeakAfterDoseHours: [3.5, 5.25],
      perceivedOffsetAfterDoseHours: [9, 10.5],
      sideEffectBurden: "low",
    },
    days: [
      day({
        journalDate: "2026-02-09",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:20", "condition-foggy"],
          ["10:45", "condition-up"],
          ["12:20", "condition-calm"],
          ["17:40", "trouble-time-management"],
        ],
        score: 7,
        memo: "Synthetic: response starts late despite adequate sleep.",
      }),
      day({
        journalDate: "2026-02-10",
        context: context({ sleepHour: 8, sleepQuality: "GOOD" }),
        tags: [
          ["09:40", "condition-foggy"],
          ["11:05", "condition-up"],
          ["13:10", "condition-calm"],
          ["17:25", "trouble-inattention"],
        ],
        score: 7,
        memo: "Synthetic: later positive response repeats.",
      }),
      day({
        journalDate: "2026-02-11",
        context: context({ sleepHour: 7, sleepQuality: "NORMAL", breakfast: false }),
        tags: [
          ["10:10", "condition-foggy"],
          ["11:40", "condition-up"],
          ["13:20", "condition-calm"],
          ["18:15", "trouble-time-management"],
        ],
        score: 6,
        memo: "Synthetic: no breakfast is a context flag, not proof of slower absorption.",
      }),
      day({
        journalDate: "2026-02-12",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:35", "condition-foggy"],
          ["11:15", "condition-up"],
          ["12:45", "condition-calm"],
          ["17:55", "condition-down"],
        ],
        score: 7,
        memo: "Synthetic: delayed effect pattern remains visible.",
      }),
    ],
  },
  {
    personaId: "short-duration-responder",
    label: "Short perceived duration",
    description: "Early positive response appears, but trouble markers return soon after lunch.",
    expectedPdPattern: {
      primaryFit: "offset-sensitivity",
      perceivedOnsetAfterDoseHours: [1, 1.75],
      perceivedPeakAfterDoseHours: [2, 3.25],
      perceivedOffsetAfterDoseHours: [5, 6.5],
      sideEffectBurden: "low",
    },
    days: [
      day({
        journalDate: "2026-02-16",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:15", "condition-up"],
          ["10:20", "condition-calm"],
          ["13:25", "trouble-inattention"],
          ["14:05", "trouble-time-management"],
        ],
        score: 6,
        memo: "Synthetic: early response with early afternoon offset.",
      }),
      day({
        journalDate: "2026-02-17",
        context: context({ sleepHour: 8, sleepQuality: "GOOD" }),
        tags: [
          ["09:25", "condition-up"],
          ["10:35", "condition-calm"],
          ["13:10", "condition-foggy"],
          ["14:30", "trouble-cognitive-error"],
        ],
        score: 6,
        memo: "Synthetic: short duration pattern repeats.",
      }),
      day({
        journalDate: "2026-02-18",
        context: context({ sleepHour: 6, sleepQuality: "BAD" }),
        tags: [
          ["09:40", "condition-up"],
          ["12:35", "condition-foggy"],
          ["13:15", "trouble-inattention"],
          ["15:00", "trouble-time-management"],
        ],
        score: 5,
        memo: "Synthetic: poor sleep worsens impairment, should be treated as context.",
      }),
      day({
        journalDate: "2026-02-19",
        context: context({ sleepHour: 7, sleepQuality: "NORMAL" }),
        tags: [
          ["09:30", "condition-up"],
          ["10:10", "condition-calm"],
          ["13:45", "trouble-inattention"],
          ["14:40", "trouble-cognitive-error"],
        ],
        score: 6,
        memo: "Synthetic: afternoon trouble returns before expected end window.",
      }),
    ],
  },
  {
    personaId: "side-effect-sensitive-responder",
    label: "Side-effect sensitive responder",
    description: "Therapeutic response is present, but side-effect and tightness markers cluster near the response peak.",
    expectedPdPattern: {
      primaryFit: "side-effect-sensitivity",
      perceivedOnsetAfterDoseHours: [1, 1.75],
      perceivedPeakAfterDoseHours: [2, 4],
      perceivedOffsetAfterDoseHours: [7, 9],
      sideEffectBurden: "high",
    },
    days: [
      day({
        journalDate: "2026-02-23",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:30", "condition-up"],
          ["10:15", "condition-tight"],
          ["10:35", "side-effect-jittery"],
          ["12:20", "side-effect-appetite"],
        ],
        score: 6,
        memo: "Synthetic: response and side effects overlap.",
      }),
      day({
        journalDate: "2026-02-24",
        context: context({ sleepHour: 8, sleepQuality: "GOOD" }),
        tags: [
          ["09:40", "condition-up"],
          ["10:20", "condition-tight"],
          ["10:55", "side-effect-jittery"],
          ["13:05", "condition-calm"],
        ],
        score: 6,
        memo: "Synthetic: peak window includes tightness.",
      }),
      day({
        journalDate: "2026-02-25",
        context: context({ sleepHour: 7, sleepQuality: "NORMAL" }),
        tags: [
          ["09:25", "condition-up"],
          ["10:05", "side-effect-headache"],
          ["10:45", "condition-tight"],
          ["15:50", "trouble-time-management"],
        ],
        score: 5,
        memo: "Synthetic: side-effect burden reduces functional score.",
      }),
      day({
        journalDate: "2026-02-26",
        context: context({ sleepHour: 7, sleepQuality: "GOOD" }),
        tags: [
          ["09:35", "condition-up"],
          ["10:30", "side-effect-jittery"],
          ["11:00", "condition-tight"],
          ["12:10", "side-effect-appetite"],
        ],
        score: 6,
        memo: "Synthetic: repeated side-effect clustering around expected peak.",
      }),
    ],
  },
];

export function flattenFixtureDays(fixtures = attunePdCalibrationFixtures) {
  return fixtures.flatMap((fixture) =>
    fixture.days.map((fixtureDay) => ({
      ...fixtureDay,
      personaId: fixture.personaId,
    })),
  );
}

export function flattenFixtureTagChecks(fixtures = attunePdCalibrationFixtures) {
  return flattenFixtureDays(fixtures).flatMap((fixtureDay) =>
    fixtureDay.tagChecks.map((check) => ({
      ...check,
      personaId: fixtureDay.personaId,
    })),
  );
}
