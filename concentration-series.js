// Chart-ready concentration time series. Depends on the pure model code only.
import {
  eliminationRate,
  buildHourGrid,
  singleDoseConcentration,
} from "./pharmacokinetics.js";
import { activeDoseEvents } from "./dose-events.js";

/**
 * Dose-to-concentration scale (ng/mL per mg) so that a single calibration-dose
 * gives the reference AUC. Because AUC = scale * dose / ke for this model,
 * scalePerMg = (aucTarget * ke) / calibrationDoseMg.
 */
function concentrationScalePerMg(profile, ke) {
  const { aucNgHPerMl, calibrationDoseMg } = profile.reference;
  return (aucNgHPerMl * ke) / calibrationDoseMg;
}

/**
 * Build a normalized chart-ready series.
 *
 *   buildConcentrationSeries({ profile, doseEvents, grid })
 *
 * grid: { startHour, endHour, stepMinutes }
 *
 * Returns:
 *   {
 *     series:   [{ hour, raw, percent }],
 *     components: { ir: [...], er: [...] },   // raw ng/mL per release component
 *     stats: { cmaxRaw, tmaxHour, peakHour }
 *   }
 *
 * raw     = estimated ng/mL (absolute)
 * percent = percent of the peak raw value in this window
 */
export function buildConcentrationSeries({ profile, doseEvents, grid }) {
  const hours = buildHourGrid(grid);
  const ke = eliminationRate(profile.halfLifeHours);
  const scalePerMg = concentrationScalePerMg(profile, ke);

  const total = new Array(hours.length).fill(0);
  const irTotal = new Array(hours.length).fill(0);
  const erTotal = new Array(hours.length).fill(0);

  const irModel = { irFraction: 1, ir: profile.release.ir, er: profile.release.er };
  const erModel = { irFraction: 0, ir: profile.release.ir, er: profile.release.er };
  const fullModel = profile.release;

  for (const event of activeDoseEvents(doseEvents)) {
    const scale = event.amountMg * scalePerMg;
    // Shift each dose's contribution to its intake time.
    const shifted = hours.map((h) => h - event.takenAtHour);
    addContribution(total, singleDoseOnShiftedGrid(shifted, fullModel, ke, scale));
    addContribution(
      irTotal,
      singleDoseOnShiftedGrid(shifted, irModel, ke, scale * profile.release.irFraction),
    );
    addContribution(
      erTotal,
      singleDoseOnShiftedGrid(shifted, erModel, ke, scale * (1 - profile.release.irFraction)),
    );
  }

  let cmaxRaw = 0;
  let tmaxHour = hours[0];
  for (let i = 0; i < hours.length; i += 1) {
    if (total[i] > cmaxRaw) {
      cmaxRaw = total[i];
      tmaxHour = hours[i];
    }
  }
  const peak = cmaxRaw > 0 ? cmaxRaw : 1;

  const series = hours.map((hour, i) => ({
    hour,
    raw: round(total[i], 4),
    percent: round((total[i] / peak) * 100, 2),
  }));

  return {
    series,
    components: {
      ir: hours.map((hour, i) => ({ hour, raw: round(irTotal[i], 4) })),
      er: hours.map((hour, i) => ({ hour, raw: round(erTotal[i], 4) })),
    },
    stats: { cmaxRaw: round(cmaxRaw, 4), tmaxHour, peakHour: tmaxHour },
  };
}

/**
 * Concentration of one dose on a grid that has already been shifted so the
 * dose is taken at relative hour 0. Negative (pre-dose) times stay at 0.
 */
function singleDoseOnShiftedGrid(shiftedHours, releaseModel, ke, scale) {
  // singleDoseConcentration expects monotonically increasing hours starting
  // near 0; clamp negative pre-dose times to 0 so they contribute nothing.
  const clamped = shiftedHours.map((h) => (h < 0 ? 0 : h));
  const conc = singleDoseConcentration(clamped, releaseModel, ke, scale);
  return shiftedHours.map((h, i) => (h < 0 ? 0 : conc[i]));
}

function addContribution(target, contribution) {
  for (let i = 0; i < target.length; i += 1) target[i] += contribution[i];
}

function round(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
