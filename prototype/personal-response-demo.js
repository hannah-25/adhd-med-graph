import { concertaOros } from "./pk-profiles.js";
import { createDoseEvent } from "./dose-events.js";
import { buildConcentrationSeries } from "./concentration-series.js";
import { attuneJournalTags, attunePdCalibrationFixtures } from "./attune-journal-fixtures.js";
import { buildPdCalibrationModel, PD_SIGNAL } from "./pd-calibration.js";

const chart = document.getElementById("pdChart");
const personaSeg = document.getElementById("personaSeg");
const summaryBody = document.getElementById("summaryBody");
const observationBody = document.getElementById("observationBody");
const personaDescription = document.getElementById("personaDescription");

const W = 720;
const H = 280;
const padL = 44;
const padR = 18;
const padT = 20;
const padB = 34;
const plotW = W - padL - padR;
const plotH = H - padT - padB;
const grid = { startHour: 0, endHour: 12, stepMinutes: 15 };

let selectedPersonaId = attunePdCalibrationFixtures[0].personaId;
// Personal absorption-rate adjustment (inter-individual bioavailability /
// absorption differences shift Tmax). 1 = population default; >1 faster
// absorption → earlier peak. This is a what-if estimate, not a measurement.
let absorptionScale = 1;
let currentModel = null;

const TMAX_MIN = 2.5;
const TMAX_MAX = 10;
const doseEvents = [createDoseEvent({ medicationId: concertaOros.id, amountMg: 18, takenAtHour: 0 })];

const xOf = (hour) => padL + (hour / grid.endHour) * plotW;
const yOf = (percent) => padT + plotH - (percent / 100) * plotH;
const personaCopy = {
  "baseline-responder": {
    label: "기본 반응형",
    description: "기본 모델과 비슷하게 오전 반응이 나타나고, 오후 늦게 불편/실수 기록이 다시 늘어나는 예시입니다.",
  },
  "delayed-responder": {
    label: "늦은 반응형",
    description: "초반에는 멍함 기록이 있고, 기본 PK 피크보다 늦게 좋은 반응 기록이 나타나는 예시입니다.",
  },
  "short-duration-responder": {
    label: "짧은 지속형",
    description: "오전에는 반응이 좋지만 점심 이후 이른 시간부터 주의력/시간관리 문제가 다시 나타나는 예시입니다.",
  },
  "side-effect-sensitive-responder": {
    label: "부작용 민감형",
    description: "효과 기록은 있지만 피크 근처에 긴장감이나 부작용 기록이 함께 몰리는 예시입니다.",
  },
};
const burdenLabel = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};
const signalLabel = {
  [PD_SIGNAL.THERAPEUTIC_RESPONSE]: "좋은 반응",
  [PD_SIGNAL.IMPAIRMENT]: "불편/실수",
  [PD_SIGNAL.SIDE_EFFECT]: "부작용",
  [PD_SIGNAL.CONTEXT]: "컨텍스트",
};
const tagLabel = {
  "condition-up": "기분/활력 좋음",
  "condition-calm": "차분함",
  "condition-foggy": "멍함",
  "condition-down": "가라앉음",
  "condition-tight": "긴장감",
  "trouble-inattention": "주의산만",
  "trouble-time-management": "시간관리 어려움",
  "trouble-cognitive-error": "인지 실수",
  "trouble-impulsivity": "충동성",
  "side-effect-appetite": "식욕 저하",
  "side-effect-jittery": "초조함",
  "side-effect-headache": "두통",
};

function pathFrom(points, valueKey) {
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"}${xOf(point.hour).toFixed(1)} ${yOf(point[valueKey]).toFixed(1)}`)
    .join(" ");
}

// Journal records are placed in three fixed height lanes by signal type
// (side effect = high, good response = middle, impairment = low) and colored by
// type. The lane height is a CATEGORY layout only — not concentration and not
// effect magnitude. No shaded zone bands and no fixed concentration thresholds:
// the level at which side effects / response appear varies between individuals.
const signalColor = {
  [PD_SIGNAL.THERAPEUTIC_RESPONSE]: "var(--pd-response)",
  [PD_SIGNAL.SIDE_EFFECT]: "var(--pd-side)",
  [PD_SIGNAL.IMPAIRMENT]: "var(--pd-impairment)",
  [PD_SIGNAL.CONTEXT]: "var(--text-dim)",
};
const signalLaneY = {
  [PD_SIGNAL.SIDE_EFFECT]: 82,
  [PD_SIGNAL.THERAPEUTIC_RESPONSE]: 50,
  [PD_SIGNAL.IMPAIRMENT]: 18,
  [PD_SIGNAL.CONTEXT]: 50,
};

function renderPersonaSegments() {
  personaSeg.innerHTML = attunePdCalibrationFixtures
    .map((fixture) => `
      <button data-persona="${fixture.personaId}" aria-pressed="${fixture.personaId === selectedPersonaId}">
        ${personaCopy[fixture.personaId]?.label ?? fixture.label}
      </button>
    `)
    .join("");
}

// Clone the profile with absorption timing scaled by `scale`. Faster absorption
// (larger scale) shortens the release time constants and speeds the IR rate,
// shifting Tmax earlier — the PK signature of a faster-absorbing individual.
// Elimination half-life is left unchanged (a separate physiological parameter).
function profileForScale(scale) {
  const r = concertaOros.release;
  return {
    ...concertaOros,
    release: {
      irFraction: r.irFraction,
      ir: { ...r.ir, rate: r.ir.rate * scale },
      er: { ...r.er, tLagHours: r.er.tLagHours / scale, scaleHours: r.er.scaleHours / scale },
    },
  };
}

function seriesForScale(scale) {
  return buildConcentrationSeries({ profile: profileForScale(scale), doseEvents, grid });
}

// Tmax decreases monotonically as scale increases, so binary-search the scale
// that puts the peak at the dragged target hour.
function solveScaleForTmax(targetTmax) {
  let lo = 0.4;
  let hi = 3.0;
  for (let i = 0; i < 26; i += 1) {
    const mid = (lo + hi) / 2;
    if (seriesForScale(mid).stats.tmaxHour > targetTmax) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function renderChart(model) {
  const pkResult = seriesForScale(absorptionScale);
  const pk = pkResult.series;
  const tmax = pkResult.stats.tmaxHour;
  const svg = [];

  // y reference gridlines for the two curves (% of each curve's own peak).
  for (const pct of [0, 50, 100]) {
    const y = yOf(pct).toFixed(1);
    svg.push(`<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`);
    svg.push(`<text x="${padL - 8}" y="${(+y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-dim)">${pct}</text>`);
  }

  for (const hour of [0, 2, 4, 6, 8, 10, 12]) {
    svg.push(`<text x="${xOf(hour).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--text-dim)">${hour}h</text>`);
  }

  // Population concentration (PK), dashed. No fitted effect curve is drawn:
  // a quantitative stimulant effect curve cannot be honestly grounded here
  // (acute-tolerance evidence is mixed and endpoint-dependent). See the note.
  svg.push(`<path d="${pathFrom(pk, "percent")}" fill="none" stroke="var(--pd-pk)" stroke-width="2" stroke-dasharray="6 5"/>`);

  // Journal records placed in fixed height lanes by signal type (color + lane).
  // Lane height is a category layout, not concentration (see signalLaneY note).
  for (const obs of model.observations) {
    if (obs.hoursAfterDose < grid.startHour || obs.hoursAfterDose > grid.endHour) continue;
    const cy = yOf(signalLaneY[obs.signal] ?? 50);
    const tagText = tagLabel[obs.tagId] ?? attuneJournalTags.find((t) => t.tagId === obs.tagId)?.name ?? obs.tagId;
    svg.push(`
      <circle
        class="obs-dot"
        data-tag="${tagText}"
        data-signal="${signalLabel[obs.signal] ?? obs.signal}"
        data-hours="${obs.hoursAfterDose.toFixed(2)}"
        cx="${xOf(obs.hoursAfterDose).toFixed(1)}"
        cy="${cy.toFixed(1)}"
        r="4.5"
        fill="${signalColor[obs.signal] ?? "var(--text-dim)"}"
        stroke="var(--surface)"
        stroke-width="1.5"
      ></circle>
    `);
  }

  // Draggable peak handle — drag left/right to set absorption speed (Tmax).
  // A wide transparent grab strip along the whole vertical makes it easy to hit.
  const hx = xOf(tmax);
  const hy = yOf(100);
  svg.push(`<line class="pk-handle" x1="${hx.toFixed(1)}" y1="${padT}" x2="${hx.toFixed(1)}" y2="${yOf(0).toFixed(1)}" stroke="transparent" stroke-width="20" pointer-events="stroke"/>`);
  svg.push(`<line x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${yOf(0).toFixed(1)}" stroke="var(--pd-pk)" stroke-width="1" stroke-dasharray="2 3" opacity="0.5" pointer-events="none"/>`);
  svg.push(`<circle class="pk-handle" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="8" fill="var(--pd-pk)" stroke="var(--surface)" stroke-width="2"/>`);
  svg.push(`<text x="${hx.toFixed(1)}" y="${(hy - 13).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--text)" pointer-events="none">Tmax ${tmax.toFixed(1)}h</text>`);

  chart.innerHTML = svg.join("");
}

function renderSummary(model, fixture) {
  const s = model.summary;
  personaDescription.textContent = personaCopy[fixture.personaId]?.description ?? fixture.description;
  summaryBody.innerHTML = `
    <div class="metric"><span>긍정 기록 시작</span><strong>${s.perceivedOnsetHour.toFixed(2)}시간</strong></div>
    <div class="metric"><span>긍정 기록 중앙</span><strong>${s.perceivedPeakHour.toFixed(2)}시간</strong></div>
    <div class="metric"><span>불편 기록 복귀</span><strong>${s.perceivedOffsetHour.toFixed(2)}시간</strong></div>
    <div class="metric"><span>부작용 부담</span><strong>${burdenLabel[s.sideEffectBurden] ?? s.sideEffectBurden}</strong></div>
    <div class="metric"><span>관찰 기록</span><strong>${s.observationCount}개</strong></div>
  `;
}

function renderObservations(model) {
  const visible = model.observations
    .filter((obs) => obs.hoursAfterDose >= grid.startHour && obs.hoursAfterDose <= grid.endHour)
    .sort((a, b) => a.hoursAfterDose - b.hoursAfterDose);

  observationBody.innerHTML = visible
    .map((obs) => {
      const tag = attuneJournalTags.find((item) => item.tagId === obs.tagId);
      return `
        <tr>
          <td>${obs.hoursAfterDose.toFixed(2)}시간</td>
          <td><span class="signal-dot signal-${obs.signal}"></span>${signalLabel[obs.signal] ?? obs.signal}</td>
          <td>${tagLabel[obs.tagId] ?? tag?.name ?? obs.tagId}</td>
          <td>${obs.contextQuality.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

function render() {
  const fixture = attunePdCalibrationFixtures.find((item) => item.personaId === selectedPersonaId);
  const model = buildPdCalibrationModel({
    personaFixture: fixture,
    tags: attuneJournalTags,
  });

  currentModel = model;
  renderPersonaSegments();
  renderChart(model);
  renderSummary(model, fixture);
  renderObservations(model);
}

personaSeg.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-persona]");
  if (!button) return;
  selectedPersonaId = button.dataset.persona;
  render();
});

// --- Draggable absorption (Tmax) handle ---
function svgHourFromClientX(clientX) {
  const rect = chart.getBoundingClientRect();
  const svgX = ((clientX - rect.left) / rect.width) * W;
  return ((svgX - padL) / plotW) * grid.endHour;
}

let dragging = false;
chart.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".pk-handle")) return;
  dragging = true;
  event.preventDefault();
  updateAbsorptionFromClientX(event.clientX);
});
window.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  event.preventDefault();
  updateAbsorptionFromClientX(event.clientX);
});
window.addEventListener("pointerup", () => {
  dragging = false;
});

function updateAbsorptionFromClientX(clientX) {
  const target = Math.min(TMAX_MAX, Math.max(TMAX_MIN, svgHourFromClientX(clientX)));
  absorptionScale = solveScaleForTmax(target);
  if (currentModel) renderChart(currentModel);
}

document.getElementById("resetPk")?.addEventListener("click", () => {
  absorptionScale = 1;
  if (currentModel) renderChart(currentModel);
});

// --- Journal point tooltip (hover / click) ---
const tooltip = document.getElementById("pdTooltip");
const chartWrap = chart.closest(".chart-wrap");

function showTooltip(dot, clientX, clientY) {
  tooltip.innerHTML = `<strong>${dot.dataset.tag}</strong><br>${dot.dataset.signal} · 복용 후 ${dot.dataset.hours}시간`;
  tooltip.hidden = false;
  const wrap = chartWrap.getBoundingClientRect();
  let x = clientX - wrap.left + 12;
  let y = clientY - wrap.top + 12;
  if (x + tooltip.offsetWidth > wrap.width) x = wrap.width - tooltip.offsetWidth - 4;
  if (y + tooltip.offsetHeight > wrap.height) y = clientY - wrap.top - tooltip.offsetHeight - 12;
  tooltip.style.left = `${Math.max(0, x)}px`;
  tooltip.style.top = `${Math.max(0, y)}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

chart.addEventListener("pointermove", (event) => {
  if (dragging) return;
  const dot = event.target.closest(".obs-dot");
  if (dot) showTooltip(dot, event.clientX, event.clientY);
  else hideTooltip();
});
chart.addEventListener("pointerleave", hideTooltip);
chart.addEventListener("click", (event) => {
  const dot = event.target.closest(".obs-dot");
  if (dot) showTooltip(dot, event.clientX, event.clientY);
  else hideTooltip();
});

render();
