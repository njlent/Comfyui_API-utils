import {
  describeEvent,
  fmtCount,
  fmtCredits,
  fmtDate,
  fmtDateFull,
  fmtUsd
} from "./credits-monitor-data.js";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function creditsIconMarkup(size = 16, extraClass = "") {
  return `
    <svg viewBox="0 0 24 24" class="cae-credit-icon ${extraClass}" width="${size}" height="${size}" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="6" rx="1.4" transform="rotate(45 12 5.5)"></rect>
      <rect x="2.5" y="9" width="6" height="6" rx="1.4" transform="rotate(45 5.5 12)"></rect>
      <rect x="15.5" y="9" width="6" height="6" rx="1.4" transform="rotate(45 18.5 12)"></rect>
      <rect x="9" y="15.5" width="6" height="6" rx="1.4" transform="rotate(45 12 18.5)"></rect>
      <circle cx="12" cy="12" r="1.4" class="cae-credit-icon-core"></circle>
    </svg>
  `;
}

export function selectMarkup(name, value, options, allLabel) {
  return `
    <label class="cae-select-wrap">
      <span class="cae-select-label">${esc(name)}</span>
      <select class="cae-select" data-cae-select="${esc(name.toLowerCase())}">
        <option value="all"${value === "all" ? " selected" : ""}>${esc(allLabel)}</option>
        ${options
          .map((option) => `<option value="${esc(option)}"${option === value ? " selected" : ""}>${esc(option)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

export function snapshotCardsMarkup(context) {
  return `
    <div class="cae-mini-grid">
      ${context.snapshots
        .map(
          (snapshot) => `
            <div class="cae-mini-card">
              <span class="cae-mini-label">${esc(snapshot.label)}</span>
              <strong>${fmtCredits(snapshot.totalCredits)}</strong>
              <span>${fmtCount(snapshot.runCount)} runs</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

export function modelRowsMarkup(items, totalCredits) {
  if (!items.length) return `<div class="cae-empty">No model activity in this scope.</div>`;
  return `
    <div class="cae-data-list">
      ${items
        .map((item) => {
          const share = totalCredits ? (item.credits / totalCredits) * 100 : 0;
          return `
            <div class="cae-data-row cae-model-row">
              <div class="cae-data-row-main">
                <strong title="${esc(item.model)}">${esc(item.model)}</strong>
                <span>${esc(item.provider)}</span>
              </div>
              <div class="cae-data-row-metric cae-model-row-metric">
                <strong>${fmtCredits(item.credits)}</strong>
                <span>${fmtUsd(item.usd)}</span>
              </div>
              <div class="cae-data-row-metric cae-model-row-metric">
                <strong>${share.toFixed(1)}%</strong>
                <span>${fmtCount(item.count)} runs</span>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function tableBadge(event) {
  if (event.type === "api_usage_completed") return "API Usage";
  if (event.type === "cloud_workflow_executed") return "Cloud Workflow";
  if (event.type === "credit_added") return "Top-up";
  return event.type.replaceAll("_", " ");
}

function tableBadgeClass(event) {
  if (event.type === "cloud_workflow_executed") return "cae-cloud-workflow-badge";
  return "";
}

function detailValue(value) {
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function eventDetailsText(event) {
  const params = event.params || {};
  const lines = [
    `ID: ${event.id}`,
    `Type: ${event.type}`,
    `Provider: ${event.provider}`,
    `Model: ${event.model}`,
    `Estimated: ${event.estimated ? "yes" : "no"}`,
    `Credits: ${fmtCredits(event.credits)}`,
    `USD: ${fmtUsd(event.usd)}`,
    `Time: ${fmtDateFull(event.createdAt)}`
  ];
  const paramLines = Object.keys(params)
    .sort()
    .map((key) => `${key}: ${detailValue(params[key])}`);
  return [...lines, "", "Params:", ...(paramLines.length ? paramLines : ["none"])].join("\n");
}

function infoButtonMarkup(event) {
  return `
    <span class="cae-info-wrap">
      <span class="cae-info-dot" tabindex="0" aria-label="Event details">i</span>
      <span class="cae-info-popover" role="tooltip"><pre>${esc(eventDetailsText(event))}</pre></span>
    </span>
  `;
}

export function usageTableMarkup(context) {
  if (!context.pagedUsage.items.length) return `<div class="cae-empty">No usage activity in this filter scope.</div>`;
  const rows = context.pagedUsage.items
    .map(
      (event) => `
        <div class="cae-activity-row">
          <div><span class="cae-usage-badge ${tableBadgeClass(event)}">${esc(tableBadge(event))}</span></div>
          <div class="cae-activity-details">
            <strong>${esc(event.provider)}</strong>
            <span title="${esc(event.model)}">Model: ${esc(event.model)}</span>
          </div>
          <div class="cae-activity-time" title="${esc(fmtDateFull(event.createdAt))}">${esc(fmtDate(event.createdAt))}</div>
          <div class="cae-activity-credits">
            <strong>${fmtCredits(event.credits)}</strong>
            <span>${fmtUsd(event.usd)}</span>
          </div>
          <div class="cae-activity-info">${infoButtonMarkup(event)}</div>
        </div>
      `
    )
    .join("");

  const pages = [];
  const start = Math.max(1, context.pagedUsage.page - 2);
  const end = Math.min(context.pagedUsage.pageCount, start + 4);
  for (let page = start; page <= end; page += 1) pages.push(page);

  return `
    <div class="cae-activity-table">
      <div class="cae-activity-row is-head">
        <div>Event Type</div>
        <div>Details</div>
        <div>Time</div>
        <div>Credits</div>
        <div></div>
      </div>
      ${rows}
      <div class="cae-pagination">
        <button class="cae-page-button is-wide" data-cae-page="1" ${context.pagedUsage.page <= 1 ? "disabled" : ""}>First</button>
        <button class="cae-page-button" data-cae-page="${context.pagedUsage.page - 1}" ${context.pagedUsage.page <= 1 ? "disabled" : ""}>‹</button>
        ${pages
          .map(
            (page) => `
              <button class="cae-page-button ${page === context.pagedUsage.page ? "is-active" : ""}" data-cae-page="${page}">
                ${page}
              </button>
            `
          )
          .join("")}
        <label class="cae-page-jump">
          <span>Page</span>
          <input
            type="number"
            min="1"
            max="${context.pagedUsage.pageCount}"
            value="${context.pagedUsage.page}"
            data-cae-page-jump
            aria-label="Activity page"
          />
          <span>of ${fmtCount(context.pagedUsage.pageCount)}</span>
        </label>
        <button class="cae-page-button" data-cae-page="${context.pagedUsage.page + 1}" ${context.pagedUsage.page >= context.pagedUsage.pageCount ? "disabled" : ""}>›</button>
        <button class="cae-page-button is-wide" data-cae-page="${context.pagedUsage.pageCount}" ${context.pagedUsage.page >= context.pagedUsage.pageCount ? "disabled" : ""}>Last</button>
      </div>
    </div>
  `;
}

export function billingLedgerMarkup(context) {
  return `
    <div class="cae-ledger-list">
      ${context.recentBilling.items
        .map(
          (event) => `
            <div class="cae-ledger-row">
              <div>
                <strong>${esc(describeEvent(event))}</strong>
                <span>${esc(fmtDate(event.createdAt))}</span>
              </div>
              <div class="cae-ledger-metric ${event.type === "credit_added" ? "cae-positive" : "cae-negative"}">
                ${event.type === "credit_added" ? "+" : "-"}${fmtCredits(event.credits)}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

export function topUpTableMarkup(context) {
  if (!context.pagedTopups.items.length) return `<div class="cae-empty">No credits added in this window.</div>`;
  const rows = context.pagedTopups.items
    .map(
      (event) => `
        <div class="cae-activity-row cae-topup-row">
          <div><span class="cae-usage-badge cae-topup-badge">Credits Added</span></div>
          <div class="cae-activity-details">
            <strong class="cae-positive">+${fmtUsd(event.usd)}</strong>
            <span>${fmtCredits(event.credits)} credits added</span>
          </div>
          <div class="cae-activity-time" title="${esc(fmtDateFull(event.createdAt))}">${esc(fmtDate(event.createdAt))}</div>
          <div class="cae-activity-details">
            <strong>${esc(event.id)}</strong>
            <span>${Object.keys(event.params || {}).length ? "Details available in event payload" : "No extra details"}</span>
          </div>
        </div>
      `
    )
    .join("");

  const pages = [];
  const start = Math.max(1, context.pagedTopups.page - 2);
  const end = Math.min(context.pagedTopups.pageCount, start + 4);
  for (let page = start; page <= end; page += 1) pages.push(page);

  return `
    <div class="cae-activity-table">
      <div class="cae-activity-row cae-topup-row is-head">
        <div>Event Type</div>
        <div>Amount</div>
        <div>Time</div>
        <div>Event ID</div>
      </div>
      ${rows}
      <div class="cae-pagination">
        <button class="cae-page-button is-wide" data-cae-page="1" ${context.pagedTopups.page <= 1 ? "disabled" : ""}>First</button>
        <button class="cae-page-button" data-cae-page="${context.pagedTopups.page - 1}" ${context.pagedTopups.page <= 1 ? "disabled" : ""}>&lsaquo;</button>
        ${pages
          .map(
            (page) => `
              <button class="cae-page-button ${page === context.pagedTopups.page ? "is-active" : ""}" data-cae-page="${page}">
                ${page}
              </button>
            `
          )
          .join("")}
        <label class="cae-page-jump">
          <span>Page</span>
          <input
            type="number"
            min="1"
            max="${context.pagedTopups.pageCount}"
            value="${context.pagedTopups.page}"
            data-cae-page-jump
            aria-label="Credits added page"
          />
          <span>of ${fmtCount(context.pagedTopups.pageCount)}</span>
        </label>
        <button class="cae-page-button" data-cae-page="${context.pagedTopups.page + 1}" ${context.pagedTopups.page >= context.pagedTopups.pageCount ? "disabled" : ""}>&rsaquo;</button>
        <button class="cae-page-button is-wide" data-cae-page="${context.pagedTopups.pageCount}" ${context.pagedTopups.page >= context.pagedTopups.pageCount ? "disabled" : ""}>Last</button>
      </div>
    </div>
  `;
}
