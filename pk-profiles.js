// Medication / formulation PK metadata. Separate from user dose events.
// Numeric values: see docs/product/concerta-pk-reference.md.
//
// Calibration model fields (see pharmacokinetics.js):
//   release.irFraction         fraction of dose in the immediate-release coat
//   release.ir.rate            first-order IR release rate (per hour)
//   release.er { tLagHours, scaleHours, shape }  Weibull ER release
//   reference.calibrationDoseMg / cmaxNgPerMl / aucNgHPerMl / tmaxHours
//   effectStartHours / effectEndHours  임상 작용시간(duration of action) 추정.
//     농도 임계가 아니라 라벨/복용횟수 근거 (자극제 효과 ≠ 농도임계, 상승국면 연동).
//     출처·근거는 docs/product/pk-model-principles.md "작용시간" 표 참고.
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
  modelKind: "same-day-curve",
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
  modelKind: "same-day-curve",
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
  modelKind: "same-day-curve",
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

// Atomoxetine (스트라테라 외 국내 6종 = 동일 프로필) — non-stimulant NRI.
// Accumulation type: blood level reaches steady state within days, but the
// CLINICAL EFFECT builds over weeks. So we do not draw a single same-day curve;
// see docs/exec-plans + the demo's accumulation view (effect timeline + a
// normalized steady-state daily curve).
//
// PK for the daily curve (FDA Strattera label, extensive metabolizers):
//   Tmax 1–2 h, half-life 5.2 h (EM) / 21.6 h (poor metabolizers, CYP2D6).
// The daily curve is shown normalized (% of peak); see the exec-plan decision
// log — the label does not give a clean absolute Cmax/AUC to anchor ng/mL.
export const atomoxetine = {
  id: "atomoxetine",
  brandName: "스트라테라", // 상품명 (국내 대표; 동일 성분 6종 더 있음)
  displayName: "아토목세틴 캡슐",
  genericName: "atomoxetine",
  drugClass: "non-stimulant",
  releaseProfile: "immediate",
  modelKind: "accumulation",
  halfLifeHours: 5.2, // EM mean; PM ~21.6 h (see metabolismNote)

  peakTimeHours: 1.5,
  // Clinical effect time-course, evidence-based:
  //  - Endpoints/anchors: peer-reviewed time-course study (Newcorn/Canadian
  //    open-label, PMC3120776) — median time to improvement 3.7 weeks; response
  //    rises GRADUALLY and continues up to ~5 months (~20 weeks) before plateau.
  //    onsetWeeks 4 (≈ median improvement, ~25% anchor), stabilizeWeeks 20
  //    (~5-month plateau, ~90% anchor).
  //  - Shape: sigmoid (Weibull CDF) reflects the receptor-adaptation PD model
  //    standard for non-stimulant/neuropsychiatric drugs — slow build, mid rise,
  //    plateau. Not a linear or stimulant-like log rise. See evidence below.
  // FDA trials (6–10 weeks, significant by ~8 weeks) only captured the early
  // rising part; they do NOT mean the effect peaks at 8 weeks.
  effectAccrual: { onsetWeeks: 4, stabilizeWeeks: 20 },

  release: {
    irFraction: 1.0,
    ir: { rate: 1.9 }, // Tmax ~1.5 h
    er: { tLagHours: 0, scaleHours: 1, shape: 1 },
  },

  // Nominal reference — the daily curve is displayed normalized (%), so the
  // absolute scale is not used for atomoxetine.
  reference: {
    calibrationDoseMg: 40,
    cmaxNgPerMl: null,
    tmaxHours: 1.5,
    aucNgHPerMl: 100, // nominal; normalized display only
  },

  metabolismNote:
    "CYP2D6 저대사자(PM)는 반감기 ~21.6h로 노출이 크게 증가한다(EM ~5.2h).",

  evidence: [
    {
      source: "Strattera (atomoxetine) FDA label — Pharmacokinetics",
      url: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=309de576-c318-404a-bc15-660c2b1876fb",
      type: "regulatory-label",
      confidence: "high",
      note: "Tmax 1–2 h; half-life 5.2 h (EM) / 21.6 h (PM); F 63%/94%; CYP2D6. 라벨에 단일용량 Cmax/AUC 절대값 없음(전체 라벨 확인) → 일일 곡선은 정규화 표시.",
    },
    {
      source: "Strattera FDA label — Clinical Studies (ADHD 효능 시험)",
      url: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=309de576-c318-404a-bc15-660c2b1876fb",
      type: "regulatory-label",
      confidence: "medium",
      note: "효능 시험 6~10주; 위약 대비 유의한 개선이 ~8주까지 확인(짧은 시험이라 초기 상승 구간만 관찰).",
    },
    {
      source: "Time course of improvement on atomoxetine (Canadian open-label), PMC3120776",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3120776/",
      type: "peer-reviewed",
      confidence: "medium",
      note: "개선 중앙값 3.7주; 강한 개선 확률 4주 47% → 12주 76% → 26주 85% → 52주 96%; 점진적 상승 후 ~5개월 평탄화. → onset/stabilize 앵커 근거.",
    },
    {
      source: "Clemow & Bushe 2015, atomoxetine onset/trajectory review (J Psychopharmacol)",
      url: "https://journals.sagepub.com/doi/10.1177/0269881115602489",
      type: "model-form-reference",
      confidence: "medium",
      note: "지연 발현·점진적 궤적(수용체 적응 PD 모델) → S곡선(Weibull/sigmoid) 채택 근거. 직선/로그형이 아닌 이유. 곡선의 정확한 점별 값은 교육용 근사.",
    },
  ],
};

export const profiles = {
  [concertaOros.id]: concertaOros,
  [methylphenidateIr.id]: methylphenidateIr,
  [medikinetRetard.id]: medikinetRetard,
  [atomoxetine.id]: atomoxetine,
};

export function getProfile(medicationId) {
  const profile = profiles[medicationId];
  if (!profile) throw new Error(`Unknown medication profile: ${medicationId}`);
  return profile;
}
