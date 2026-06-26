// Pure pharmacokinetic model code.
// No DOM, drawing-surface, browser-storage, network, or framework imports here.
//
// Model (agreed 2026-06-27, see docs/product/concerta-pk-reference.md):
//   release input (IR + ER Weibull) convolved with a 1-compartment
//   first-order elimination kernel exp(-ke * t).
//   AUC = (total released amount) / ke, so exposure scale and curve shape
//   are tuned independently.

/** First-order elimination rate constant ke (per hour) from half-life. */
export function eliminationRate(halfLifeHours) {
  return Math.LN2 / halfLifeHours;
}

/**
 * Cumulative released fraction from a Weibull release function at time t.
 * Release(t) = 1 - exp(-((t - tLagHours) / scaleHours)^shape) for t > tLag, else 0.
 */
export function weibullReleasedFraction(hour, { tLagHours, scaleHours, shape }) {
  const elapsed = hour - tLagHours;
  if (elapsed <= 0) return 0;
  return 1 - Math.exp(-Math.pow(elapsed / scaleHours, shape));
}

/**
 * Cumulative released fraction from a first-order (single time-constant)
 * release at time t: 1 - exp(-rate * t). Used for the IR component.
 */
export function firstOrderReleasedFraction(hour, { rate }) {
  if (hour <= 0) return 0;
  return 1 - Math.exp(-rate * hour);
}

/**
 * Sampled instantaneous release rate (amount-fraction per hour) for a single
 * dose, combining the IR and ER components, on the supplied hour grid.
 * Returns an array aligned to `hours`. Uses backward differences of the
 * cumulative released fraction so the discrete integral conserves total mass.
 */
export function releaseRateSeries(hours, releaseModel) {
  const { irFraction, ir, er } = releaseModel;
  const erFraction = 1 - irFraction;
  const cumulative = hours.map(
    (h) =>
      irFraction * firstOrderReleasedFraction(h, ir) +
      erFraction * weibullReleasedFraction(h, er),
  );
  const rates = new Array(hours.length).fill(0);
  for (let i = 1; i < hours.length; i += 1) {
    const dt = hours[i] - hours[i - 1];
    rates[i] = dt > 0 ? (cumulative[i] - cumulative[i - 1]) / dt : 0;
  }
  return rates;
}

/**
 * Concentration contribution (in scaled units) of a single dose over the grid.
 * Numerically convolves the release rate with exp(-ke * t).
 *
 * The contribution at grid index i is:
 *   sum over j<=i of releaseRate[j] * exp(-ke * (t_i - t_j)) * dt_j
 * multiplied by `scale` (amount-to-concentration factor, e.g. amountMg * F / V).
 *
 * Implemented incrementally: a running compartment amount decays each step and
 * receives the release of that step. O(n) over the grid.
 */
export function singleDoseConcentration(hours, releaseModel, ke, scale) {
  const rates = releaseRateSeries(hours, releaseModel);
  const out = new Array(hours.length).fill(0);
  let amount = 0;
  for (let i = 1; i < hours.length; i += 1) {
    const dt = hours[i] - hours[i - 1];
    // Decay the existing central amount over the step.
    amount *= Math.exp(-ke * dt);
    // Add the mass released during this step.
    amount += rates[i] * dt;
    out[i] = amount * scale;
  }
  return out;
}

/** Build an evenly spaced hour grid from a sampling grid spec. */
export function buildHourGrid({ startHour, endHour, stepMinutes }) {
  const step = stepMinutes / 60;
  const hours = [];
  for (let h = startHour; h <= endHour + 1e-9; h += step) {
    hours.push(Number(h.toFixed(6)));
  }
  return hours;
}
