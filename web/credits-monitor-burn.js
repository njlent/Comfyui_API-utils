import {
  aggregateModels,
  fmtCount,
  fmtCredits,
  fmtDateFull,
  fmtUsd,
  state
} from "./credits-monitor-data.js";
import { esc } from "./credits-monitor-ui-fragments.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

const burnState = {
  rangeValue: 7,
  rangeUnit: "days",
  rateUnit: "day",
  reserveCredits: 0,
  currentScope: true
};

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampRange(value) {
  const parsed = Math.floor(num(value, burnState.rangeValue));
  return Math.min(Math.max(parsed, 1), 3650);
}

function clampReserve(value) {
  return Math.max(0, num(value, burnState.reserveCredits));
}

function unitMs(unit) {
  if (unit === "hours") return HOUR_MS;
  if (unit === "weeks") return WEEK_MS;
  return DAY_MS;
}

function rateUnitMs(unit) {
  if (unit === "hour") return HOUR_MS;
  if (unit === "week") return WEEK_MS;
  return DAY_MS;
}

function configFrom(root) {
  return {
    rangeValue: clampRange(root.querySelector("[data-cae-burn-range]")?.value),
    rangeUnit: root.querySelector("[data-cae-burn-range-unit]")?.value || "days",
    rateUnit: root.querySelector("[data-cae-burn-rate-unit]")?.value || "day",
    reserveCredits: clampReserve(root.querySelector("[data-cae-burn-reserve]")?.value),
    currentScope: Boolean(root.querySelector("[data-cae-burn-scope]")?.checked)
  };
}

function syncState(config) {
  Object.assign(burnState, config);
}

function rangeLabel(config) {
  const label = config.rangeUnit === "hours" ? "hours" : config.rangeUnit === "weeks" ? "weeks" : "days";
  return `${config.rangeValue} ${label}`;
}

function scopedEvents(config) {
  const cutoff = Date.now() - config.rangeValue * unitMs(config.rangeUnit);
  return state.usageEvents
    .filter((event) => event.date.getTime() >= cutoff)
    .filter((event) => {
      if (!config.currentScope) return true;
      if (state.selectedProvider !== "all" && event.provider !== state.selectedProvider) return false;
      if (state.selectedModel !== "all" && event.model !== state.selectedModel) return false;
      return true;
    });
}

function formatDuration(hours) {
  if (!Number.isFinite(hours)) return "No active burn";
  if (hours <= 0) return "Now";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

function formatTopUpDate(hours) {
  if (!Number.isFinite(hours)) return "No top-up ETA";
  if (hours <= 0) return "Top up now";
  return fmtDateFull(new Date(Date.now() + hours * HOUR_MS));
}

function burnSummary(config) {
  const events = scopedEvents(config);
  const totalCredits = events.reduce((sum, event) => sum + event.credits, 0);
  const totalUsd = events.reduce((sum, event) => sum + event.usd, 0);
  const rangeMs = config.rangeValue * unitMs(config.rangeUnit);
  const hourlyCredits = totalCredits / (rangeMs / HOUR_MS);
  const hourlyUsd = totalUsd / (rangeMs / HOUR_MS);
  const displayFactor = rateUnitMs(config.rateUnit) / HOUR_MS;
  const balanceCredits = state.balance?.credits || 0;
  const balanceUsd = state.balance?.usd || 0;
  const usableCredits = balanceCredits - config.reserveCredits;
  const hoursToReserve = hourlyCredits > 0 ? usableCredits / hourlyCredits : Infinity;
  return {
    events,
    totalCredits,
    totalUsd,
    rateCredits: hourlyCredits * displayFactor,
    rateUsd: hourlyUsd * displayFactor,
    hourlyCredits,
    balanceCredits,
    balanceUsd,
    usableCredits,
    hoursToReserve,
    avgRun: events.length ? totalCredits / events.length : 0
  };
}

function option(value, current, label) {
  return `<option value="${esc(value)}"${value === current ? " selected" : ""}>${esc(label)}</option>`;
}

function metric(label, value, subvalue = "") {
  return `
    <div class="cae-burn-metric">
      <span>${esc(label)}</span>
      <strong title="${esc(value)}">${esc(value)}</strong>
      ${subvalue ? `<small>${esc(subvalue)}</small>` : ""}
    </div>
  `;
}

function modelBreakdown(events, totalCredits) {
  const models = aggregateModels(events, 5);
  if (!models.length) return `<div class="cae-empty">No burn source in this range.</div>`;
  return `
    <div class="cae-burn-source-list">
      ${models
        .map((item) => {
          const share = totalCredits ? Math.round((item.credits / totalCredits) * 1000) / 10 : 0;
          return `
            <div class="cae-burn-source">
              <div>
                <strong title="${esc(item.model)}">${esc(item.model)}</strong>
                <span>${esc(item.provider)} · ${fmtCount(item.count)} runs</span>
              </div>
              <div>
                <strong>${fmtCredits(item.credits)}</strong>
                <span>${share}%</span>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function burnBody(config) {
  const summary = burnSummary(config);
  const unitLabel = `/${config.rateUnit}`;
  const topUpDate = formatTopUpDate(summary.hoursToReserve);
  const runway = formatDuration(summary.hoursToReserve);
  return `
    <div class="cae-burn-grid">
      <div class="cae-burn-hero">
        <span>Top-up estimate</span>
        <strong>${esc(topUpDate)}</strong>
        <small>${esc(runway)} until ${fmtCredits(config.reserveCredits)} reserve</small>
      </div>
      <div class="cae-burn-metrics">
        ${metric(`Burn rate ${unitLabel}`, fmtCredits(summary.rateCredits), fmtUsd(summary.rateUsd))}
        ${metric("Balance runway", runway, `${fmtCredits(summary.balanceCredits)} credits available`)}
        ${metric("Range usage", fmtCredits(summary.totalCredits), `${fmtCount(summary.events.length)} runs · ${rangeLabel(config)}`)}
        ${metric("Average run", fmtCredits(summary.avgRun), summary.events.length ? "credits/run" : "no runs")}
      </div>
      <div class="cae-burn-note">
        Balance value: ${fmtUsd(summary.balanceUsd)}. Projection uses usage events in the configured range.
      </div>
      <div>
        <div class="cae-card-head cae-burn-source-head">
          <div>
            <h3>Burn sources</h3>
            <p>Largest model contributors inside this burn range.</p>
          </div>
        </div>
        ${modelBreakdown(summary.events, summary.totalCredits)}
      </div>
    </div>
  `;
}

export function burnMarkup() {
  const config = { ...burnState };
  return `
    <section class="cae-section-grid">
      <div class="cae-shell-card cae-card-span-3" data-cae-burn-root>
        <div class="cae-card-head">
          <div>
            <h3>Burn rate</h3>
            <p>Estimate depletion from recent API usage and current credit balance.</p>
          </div>
        </div>
        <div class="cae-burn-controls">
          <label class="cae-burn-control">
            <span>Range</span>
            <input type="number" min="1" max="3650" step="1" value="${config.rangeValue}" data-cae-burn-range />
          </label>
          <label class="cae-burn-control">
            <span>Range unit</span>
            <select data-cae-burn-range-unit>
              ${option("hours", config.rangeUnit, "Hours")}
              ${option("days", config.rangeUnit, "Days")}
              ${option("weeks", config.rangeUnit, "Weeks")}
            </select>
          </label>
          <label class="cae-burn-control">
            <span>Rate</span>
            <select data-cae-burn-rate-unit>
              ${option("hour", config.rateUnit, "Credits/hour")}
              ${option("day", config.rateUnit, "Credits/day")}
              ${option("week", config.rateUnit, "Credits/week")}
            </select>
          </label>
          <label class="cae-burn-control">
            <span>Reserve credits</span>
            <input type="number" min="0" step="1" value="${config.reserveCredits}" data-cae-burn-reserve />
          </label>
          <label class="cae-burn-scope">
            <input type="checkbox" data-cae-burn-scope ${config.currentScope ? "checked" : ""} />
            <span>Use current provider/model filters</span>
          </label>
        </div>
        <div data-cae-burn-preview>${burnBody(config)}</div>
      </div>
    </section>
  `;
}

export function refreshBurnPreview(container) {
  const root = container.querySelector("[data-cae-burn-root]");
  if (!root) return;
  const config = configFrom(root);
  syncState(config);
  root.querySelector("[data-cae-burn-preview]").innerHTML = burnBody(config);
}
