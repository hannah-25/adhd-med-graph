// Pure clinical-effect-accrual model for accumulation-type medications
// (e.g., atomoxetine). This is NOT pharmacokinetics — it describes how the
// therapeutic effect builds over WEEKS, separate from the daily blood curve.
// Educational illustration only; not a clinical measurement.
//
// No DOM, drawing-surface, browser-storage, network, or framework imports here.

/**
 * Fraction (0..1) of the stabilized clinical effect reached at `weeks`.
 *
 * Modeled as a Weibull CDF calibrated so that:
 *   - onsetWeeks      ≈ 25% of full effect (effect becomes noticeable)
 *   - stabilizeWeeks  ≈ 90% of full effect (effect levels off)
 * Monotonic increasing, 0 at week 0, approaching 1 thereafter.
 */
export function effectAccrualFraction(weeks, { onsetWeeks, stabilizeWeeks }) {
  if (weeks <= 0) return 0;
  if (!(stabilizeWeeks > onsetWeeks) || onsetWeeks <= 0) {
    throw new Error("effectAccrual requires 0 < onsetWeeks < stabilizeWeeks");
  }
  // Anchors: F(onset)=0.25, F(stabilize)=0.90 for a Weibull CDF
  // F(w) = 1 - exp(-(w/A)^b).
  const b =
    Math.log(Math.log(0.1) / Math.log(0.75)) /
    Math.log(stabilizeWeeks / onsetWeeks);
  const A = onsetWeeks / Math.pow(-Math.log(0.75), 1 / b);
  return 1 - Math.exp(-Math.pow(weeks / A, b));
}

/**
 * Sampled effect-accrual series for charting a timeline.
 * Returns [{ week, percent }] from 0 to endWeeks inclusive.
 */
export function buildEffectAccrualSeries({ effectAccrual, endWeeks, stepWeeks = 0.25 }) {
  const out = [];
  for (let w = 0; w <= endWeeks + 1e-9; w += stepWeeks) {
    const week = Number(w.toFixed(4));
    out.push({ week, percent: Number((effectAccrualFraction(week, effectAccrual) * 100).toFixed(2)) });
  }
  return out;
}
