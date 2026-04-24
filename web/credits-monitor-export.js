import {
  fmtCredits,
  fmtDateFull,
  fmtUsd,
  state
} from "./credits-monitor-data.js";
import { esc } from "./credits-monitor-ui-fragments.js";

const EXPORT_FIELDS = [
  ["createdAt", "Created"],
  ["type", "Type"],
  ["provider", "Provider"],
  ["model", "Model"],
  ["credits", "Credits"],
  ["usd", "USD"],
  ["estimated", "Estimated"],
  ["id", "Event ID"],
  ["cents", "Raw cents"],
  ["params", "Params JSON"]
];

const DEFAULT_FIELDS = new Set(["createdAt", "type", "provider", "model", "credits", "usd", "estimated", "id"]);
const EXPORT_PAGE_SIZE = 100;
const selectionState = {
  signature: "",
  page: 1,
  mode: "all",
  included: new Set(),
  excluded: new Set()
};

function defaultExportDays() {
  if (state.selectedWindow === "1h" || state.selectedWindow === "24h") return 1;
  if (state.selectedWindow === "7d") return 7;
  if (state.selectedWindow === "30d") return 30;
  if (state.selectedWindow === "custom") return state.customWindowDays;
  return 3650;
}

function clampDays(value) {
  const days = Math.floor(Number(value));
  return Number.isFinite(days) ? Math.min(Math.max(days, 1), 3650) : 30;
}

function exportConfig(container) {
  return {
    days: clampDays(container.querySelector("[data-cae-export-days]")?.value),
    dataset: container.querySelector("[data-cae-export-dataset]")?.value || "usage",
    currentScope: Boolean(container.querySelector("[data-cae-export-scope]")?.checked)
  };
}

function eventsForDataset(dataset) {
  if (dataset === "topups") return state.creditAddedEvents;
  if (dataset === "all") return state.events;
  return state.usageEvents;
}

function eventsForConfig(config) {
  const cutoff = Date.now() - config.days * 24 * 60 * 60 * 1000;
  return eventsForDataset(config.dataset)
    .filter((event) => event.date.getTime() >= cutoff)
    .filter((event) => {
      if (!config.currentScope) return true;
      if (state.selectedProvider !== "all" && event.provider !== state.selectedProvider) return false;
      if (state.selectedModel !== "all" && event.model !== state.selectedModel) return false;
      return true;
    });
}

function eventId(event) {
  return String(event.id);
}

function signatureFor(config, events) {
  const scope = config.currentScope ? `${state.selectedProvider}|${state.selectedModel}` : "all|all";
  return [
    config.days,
    config.dataset,
    scope,
    events.length,
    events[0]?.id || "",
    events[events.length - 1]?.id || ""
  ].join("::");
}

function ensureSelection(config, events) {
  const signature = signatureFor(config, events);
  if (selectionState.signature === signature) return;
  selectionState.signature = signature;
  selectionState.page = 1;
  selectionState.mode = "all";
  selectionState.included.clear();
  selectionState.excluded.clear();
}

function pageCount(events) {
  return Math.max(1, Math.ceil(events.length / EXPORT_PAGE_SIZE));
}

function clampPage(page, events) {
  const parsed = Math.floor(Number(page));
  const nextPage = Number.isFinite(parsed) ? parsed : 1;
  return Math.min(Math.max(nextPage, 1), pageCount(events));
}

function selectedCount(events) {
  if (selectionState.mode === "all") return Math.max(0, events.length - selectionState.excluded.size);
  return selectionState.included.size;
}

function isSelected(event) {
  const id = eventId(event);
  return selectionState.mode === "all" ? !selectionState.excluded.has(id) : selectionState.included.has(id);
}

function setRowSelected(id, checked) {
  if (selectionState.mode === "all") {
    if (checked) selectionState.excluded.delete(id);
    else selectionState.excluded.add(id);
    return;
  }
  if (checked) selectionState.included.add(id);
  else selectionState.included.delete(id);
}

function fieldsMarkup() {
  return EXPORT_FIELDS.map(([key, label]) => `
    <label class="cae-export-check">
      <input type="checkbox" value="${esc(key)}" data-cae-export-field ${DEFAULT_FIELDS.has(key) ? "checked" : ""} />
      <span>${esc(label)}</span>
    </label>
  `).join("");
}

function rowMarkup(event) {
  return `
    <label class="cae-export-row">
      <input type="checkbox" value="${esc(eventId(event))}" data-cae-export-row ${isSelected(event) ? "checked" : ""} />
      <span title="${esc(fmtDateFull(event.createdAt))}">${esc(fmtDateFull(event.createdAt))}</span>
      <span title="${esc(event.provider)} / ${esc(event.model)}">${esc(event.provider)} / ${esc(event.model)}</span>
      <span>${esc(event.type.replaceAll("_", " "))}</span>
      <span>${fmtCredits(event.credits)}</span>
      <span>${fmtUsd(event.usd)}</span>
    </label>
  `;
}

function previewMarkup(events) {
  if (!events.length) return `<div class="cae-empty">No export rows match this range.</div>`;
  selectionState.page = clampPage(selectionState.page, events);
  const totalPages = pageCount(events);
  const start = (selectionState.page - 1) * EXPORT_PAGE_SIZE;
  const pageEvents = events.slice(start, start + EXPORT_PAGE_SIZE);
  const firstRow = start + 1;
  const lastRow = start + pageEvents.length;
  return `
    <div class="cae-export-pager">
      <div class="cae-export-pager-copy">
        Showing ${firstRow}-${lastRow} of ${events.length} filtered rows
      </div>
      <div class="cae-export-pager-actions">
        <button class="cae-button cae-button-pill" data-cae-export-action="prev" ${selectionState.page <= 1 ? "disabled" : ""}>Prev</button>
        <label class="cae-export-page-control">
          <span>Page</span>
          <input type="number" min="1" max="${totalPages}" value="${selectionState.page}" data-cae-export-page />
          <span>of ${totalPages}</span>
        </label>
        <button class="cae-button cae-button-pill" data-cae-export-action="next" ${selectionState.page >= totalPages ? "disabled" : ""}>Next</button>
      </div>
    </div>
    <div class="cae-export-table">
      <div class="cae-export-row is-head">
        <span></span><span>Created</span><span>Provider / Model</span><span>Type</span><span>Credits</span><span>USD</span>
      </div>
      ${pageEvents.map(rowMarkup).join("")}
    </div>
  `;
}

function renderExport(root, events) {
  root.querySelector("[data-cae-export-preview]").innerHTML = previewMarkup(events);
  root.querySelector("[data-cae-export-count]").textContent = `${selectedCount(events)} selected rows`;
}

export function exportMarkup() {
  const days = defaultExportDays();
  const config = { days, dataset: "usage", currentScope: true };
  const events = eventsForConfig(config);
  ensureSelection(config, events);
  return `
    <section class="cae-section-grid">
      <div class="cae-shell-card cae-card-span-3">
        <div class="cae-card-head">
          <div>
            <h3>CSV export</h3>
            <p>Choose range, dataset, fields, and exact rows before downloading.</p>
          </div>
          <div class="cae-inline-note" data-cae-export-count>${events.length} selected rows</div>
        </div>
        <div class="cae-export-controls">
          <label class="cae-export-control">
            <span>Day range</span>
            <input type="number" min="1" max="3650" step="1" value="${days}" data-cae-export-days />
          </label>
          <label class="cae-export-control">
            <span>Dataset</span>
            <select data-cae-export-dataset>
              <option value="usage">Usage events</option>
              <option value="topups">Credits added</option>
              <option value="all">All billing rows</option>
            </select>
          </label>
          <label class="cae-export-scope">
            <input type="checkbox" data-cae-export-scope checked />
            <span>Use current provider/model filters</span>
          </label>
        </div>
        <div class="cae-export-fields">${fieldsMarkup()}</div>
        <div class="cae-export-actions">
          <button class="cae-button cae-button-pill" data-cae-export-action="all">Select all rows</button>
          <button class="cae-button cae-button-pill" data-cae-export-action="none">Clear all rows</button>
          <button class="cae-button cae-button-pill" data-cae-export-action="download">Download CSV</button>
        </div>
        <div data-cae-export-preview>${previewMarkup(events)}</div>
      </div>
    </section>
  `;
}

function selectedFields(container) {
  return [...container.querySelectorAll("[data-cae-export-field]:checked")].map((input) => input.value);
}

function fieldValue(event, field) {
  if (field === "params") return JSON.stringify(event.params || {});
  if (field === "estimated") return event.estimated ? "true" : "false";
  return event[field] ?? "";
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, rows) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function refreshExportPreview(container) {
  const root = container.querySelector("[data-cae-export-preview]")?.closest(".cae-shell-card");
  if (!root) return;
  const config = exportConfig(root);
  const events = eventsForConfig(config);
  ensureSelection(config, events);
  renderExport(root, events);
}

export function syncExportSelectionCount(container, row) {
  const root = container.querySelector("[data-cae-export-preview]")?.closest(".cae-shell-card");
  if (!root) return;
  if (row) setRowSelected(row.value, row.checked);
  const events = eventsForConfig(exportConfig(root));
  root.querySelector("[data-cae-export-count]").textContent = `${selectedCount(events)} selected rows`;
}

export function handleExportAction(container, action) {
  const root = container.querySelector("[data-cae-export-preview]")?.closest(".cae-shell-card");
  if (!root) return;
  const config = exportConfig(root);
  const events = eventsForConfig(config);
  ensureSelection(config, events);
  if (action === "prev" || action === "next") {
    selectionState.page = clampPage(selectionState.page + (action === "next" ? 1 : -1), events);
    renderExport(root, events);
    return;
  }
  if (action === "all" || action === "none") {
    selectionState.mode = action === "all" ? "all" : "none";
    selectionState.included.clear();
    selectionState.excluded.clear();
    renderExport(root, events);
    return;
  }
  if (action !== "download") return;

  const fields = selectedFields(root);
  const rows = events.filter(isSelected);
  if (!fields.length || !rows.length) return;

  const header = fields.map((field) => EXPORT_FIELDS.find(([key]) => key === field)?.[1] || field);
  const csvRows = [
    header.map(csvCell).join(","),
    ...rows.map((event) => fields.map((field) => csvCell(fieldValue(event, field))).join(","))
  ];
  downloadCsv(`comfy-credits-${new Date().toISOString().slice(0, 10)}.csv`, csvRows);
}

export function updateExportPage(container) {
  const root = container.querySelector("[data-cae-export-preview]")?.closest(".cae-shell-card");
  if (!root) return;
  const config = exportConfig(root);
  const events = eventsForConfig(config);
  ensureSelection(config, events);
  selectionState.page = clampPage(root.querySelector("[data-cae-export-page]")?.value, events);
  renderExport(root, events);
}
