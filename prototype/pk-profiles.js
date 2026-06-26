// Medication / formulation PK metadata. Separate from user dose events.
// Numeric values: see docs/product/concerta-pk-reference.md.
//
// Calibration model fields (see pharmacokinetics.js):
//   release.irFraction         fraction of dose in the immediate-release coat
//   release.ir.rate            first-order IR release rate (per hour)
//   release.er { tLagHours, scaleHours, shape }  Weibull ER release
//   reference.calibrationDoseMg / cmaxNgPerMl / aucNgHPerMl / tmaxHours
//
// Calibration targets come from the 18 mg adult-mean data. The free shape
// parameters are tuned to reproduce Tmax and Cmax; the elimination half-life
// fixes the decay and the AUC fixes the dose-to-concentration scale.

export const concertaOros = {
  id: "concerta-oros",
  brandName: "콘서타", // 상품명
  displayName: "콘서타 서방정",
  genericName: "methylphenidate",
  releaseProfile: "oros-dual",
  halfLifeHours: 3.5,

  // Display/effect annotations (educational chips).
  peakTimeHours: 6.8,
  effectStartHours: 1,
  effectEndHours: 12.5,

  // Release model used by pharmacokinetics.js.
  release: {
    irFraction: 0.22,
    ir: { rate: 3.0 },
    er: { tLagHours: 1.5, scaleHours: 4.25, shape: 1.75 },
  },

  // Reference data the model is calibrated against (18 mg adult mean).
  reference: {
    calibrationDoseMg: 18,
    cmaxNgPerMl: 3.7,
    tmaxHours: 6.8,
    aucNgHPerMl: 41.8,
  },

  evidence: [
    {
      source: "FDA Concerta label (2023, 021121s049)",
      url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021121s049lbl.pdf",
      type: "regulatory-label",
      confidence: "high",
      note: "18 mg single dose: Cmax 3.7 ± 1.0 ng/mL, Tmax 6.8 ± 1.8 h, AUCinf 41.8 ± 13.9, t½ 3.5 ± 0.4 h. No accumulation on repeat dosing.",
    },
    {
      source: "Kimko et al. 2016, PLOS One (PBPK / Weibull ER release model), doi:10.1371/journal.pone.0164641",
      url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0164641",
      type: "model-form-reference",
      confidence: "medium",
      note: "Methodology only (ER release modeled as a Weibull function); not a validation/calibration data source. Calibration numbers come from the FDA label above.",
    },
  ],
};

// Immediate-release methylphenidate (e.g., Ritalin / 페니드 속방정).
// A single fast first-order release, no ER stage. Calibrated to the FDA IR tablet
// label only (methylphenidate HCl tablets, DailyMed): 5 mg TID gave AUCinf 38.0
// ng·h/mL over 15 mg/day, Cmax 4.2 ng/mL, t½ 3.0 h, initial Tmax1 ~1.5 h. The
// concentration scale is anchored to AUC/mg = 38.0 / 15 = 2.53 ng·h/mL per mg —
// consistent with the Concerta label (2.32), as expected for the same drug.
export const methylphenidateIr = {
  id: "methylphenidate-ir",
  brandName: "페니드", // 상품명 (국내 대표 속방정)
  displayName: "메틸페니데이트 속방정",
  genericName: "methylphenidate",
  releaseProfile: "immediate",
  halfLifeHours: 3.0, // FDA IR label

  peakTimeHours: 1.5,
  effectStartHours: 0.5,
  effectEndHours: 4,

  release: {
    irFraction: 1.0,
    ir: { rate: 1.45 }, // single-dose Tmax ~1.5 h (FDA label)
    // No ER stage; kept for a uniform model shape (erFraction = 0).
    er: { tLagHours: 0, scaleHours: 1, shape: 1 },
  },

  // 10 mg reference. AUC anchors the scale: 2.53 ng·h/mL/mg (= label 38.0 / 15 mg).
  reference: {
    calibrationDoseMg: 10,
    cmaxNgPerMl: 4.1, // modeled single 10 mg dose (label value is a 5 mg-TID composite)
    tmaxHours: 1.5,
    aucNgHPerMl: 25.3, // = 2.53 × 10
  },

  evidence: [
    {
      source: "FDA methylphenidate HCl IR tablet label (DailyMed)",
      url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2bfb390f-ba99-4d21-8a9e-50fa8ec217c0",
      type: "regulatory-label",
      confidence: "high",
      note: "5 mg TID: Cmax 4.2 ± 1.0 ng/mL, AUCinf 38.0 ± 11.0 ng·h/mL, t½ 3.0 ± 0.5 h, initial Tmax1 ~1.5 h.",
    },
  ],
};

// Medikinet retard (메디키넷 리타드) — 50% IR + 50% ER methylphenidate capsule.
// Taken after breakfast it gives an initial IR peak followed by a 3–4 h plateau
// (a single overall Tmax, not a distinct second peak). Calibrated to the EU SmPC
// (Medikinet XL, single 20 mg after breakfast): Cmax 6.4 ng/mL, Tmax 2.75 h,
// AUC 48.9 ng·h/mL, t½ 3.2 h. AUC/mg = 2.45, consistent with the other adult MPH
// labels. Medikinet is not FDA-approved; the SmPC is the regulatory source.
export const medikinetRetard = {
  id: "methylphenidate-medikinet",
  brandName: "메디키넷 리타드", // 상품명
  displayName: "메디키넷 리타드",
  genericName: "methylphenidate",
  releaseProfile: "er-capsule",
  halfLifeHours: 3.2,

  peakTimeHours: 2.75,
  effectStartHours: 1,
  effectEndHours: 8,

  release: {
    irFraction: 0.5,
    ir: { rate: 1.2 },
    er: { tLagHours: 0, scaleHours: 2.25, shape: 1.75 },
  },

  // 20 mg reference (SmPC, after breakfast). AUC anchors the scale.
  reference: {
    calibrationDoseMg: 20,
    cmaxNgPerMl: 6.4,
    tmaxHours: 2.75,
    aucNgHPerMl: 48.9,
  },

  evidence: [
    {
      source: "Medikinet XL modified-release capsules SmPC (EMA/emc)",
      url: "https://www.medicines.org.uk/emc/product/313/smpc",
      type: "regulatory-label",
      confidence: "high",
      note: "Single 20 mg after breakfast: Cmax 6.4 ng/mL, Tmax 2.75 h, AUC 48.9 ng·h/mL, t½ 3.2 h; 50% IR + 50% ER, initial peak then 3–4 h plateau.",
    },
  ],
};

export const profiles = {
  [concertaOros.id]: concertaOros,
  [methylphenidateIr.id]: methylphenidateIr,
  [medikinetRetard.id]: medikinetRetard,
};

export function getProfile(medicationId) {
  const profile = profiles[medicationId];
  if (!profile) throw new Error(`Unknown medication profile: ${medicationId}`);
  return profile;
}
