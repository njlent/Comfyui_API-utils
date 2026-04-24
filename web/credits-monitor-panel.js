import {
  aggregateModels, aggregateProviders, buildStackedTimeline, creditAddedEventsInWindow,
  filterUsageEvents, fmtCount, fmtCredits, fmtDateFull, fmtUsd, getModelOptions,
  getProviderOptions, hasCloudAuth, openUserSettings, paginateEvents, state, summarize,
  summarizeCreditsAdded, summariesByWindow, updateLedgerPage, updateCustomWindowDays,
  updateModelFilter, updateProviderFilter, updateSection, updateStackedGroup, updateWindow,
  usageEventsInWindow, windowLabel
} from "./credits-monitor-data.js";
import { renderDonutChart, renderStackedBarChart } from "./credits-monitor-charts.js";
import { burnMarkup, refreshBurnPreview } from "./credits-monitor-burn.js";
import {
  exportMarkup, handleExportAction, refreshExportPreview, syncExportSelectionCount, updateExportPage
} from "./credits-monitor-export.js";
import {
  billingLedgerMarkup, creditsIconMarkup, esc, modelRowsMarkup, selectMarkup,
  snapshotCardsMarkup, topUpTableMarkup, usageTableMarkup
} from "./credits-monitor-ui-fragments.js";

function buildContext() {
  const windowEvents = usageEventsInWindow();
  const providerOptions = getProviderOptions(windowEvents);
  const activeProvider = providerOptions.includes(state.selectedProvider) ? state.selectedProvider : "all";
  const providerEvents = filterUsageEvents({
    windowKey: state.selectedWindow,
    provider: activeProvider,
    model: "all"
  });
  const modelOptions = getModelOptions(windowEvents, activeProvider);
  const activeModel = modelOptions.includes(state.selectedModel) ? state.selectedModel : "all";
  const scopedEvents = filterUsageEvents({
    windowKey: state.selectedWindow,
    provider: activeProvider,
    model: activeModel
  });
  const modelLeaderboard = aggregateModels(providerEvents, Infinity);
  const topupEvents = creditAddedEventsInWindow();
  return {
    activeProvider,
    activeModel,
    providerOptions,
    modelOptions,
    providerEvents,
    scopedEvents,
    usageSummary: summarize(scopedEvents),
    providerSummary: aggregateProviders(providerEvents, 6),
    modelLeaderboard,
    snapshots: summariesByWindow(),
    pagedUsage: paginateEvents(scopedEvents, state.ledgerPage),
    recentBilling: paginateEvents(state.events, 1, 6),
    topupSummary: summarizeCreditsAdded(topupEvents),
    pagedTopups: paginateEvents(topupEvents, state.ledgerPage)
  };
}

function headerMarkup(context) {
  const balance = state.balance;
  const topModel = context.usageSummary.topModel?.name || "No usage yet";
  const updated = state.lastUpdated ? fmtDateFull(state.lastUpdated) : "Waiting for first sync";
  return `
    <section class="cae-shell-card cae-header-card">
      <div class="cae-header-main">
        <div>
          <div class="cae-panel-eyebrow">Credits</div>
          <h1 class="cae-panel-title">Credits analytics</h1>
          <p class="cae-panel-copy">Telemetry view: live balance, provider mix, model breakdowns, usage tables.</p>
        </div>
        <div class="cae-header-actions">
          <button class="cae-button cae-button-pill" data-cae-action="settings">Open Credits Settings</button>
          <button class="cae-button cae-button-pill" data-cae-action="refresh" ${state.loading ? "disabled" : ""}>Refresh data</button>
        </div>
      </div>
      <div class="cae-balance-hero">
        <div class="cae-balance-hero-main">
          <div class="cae-balance-label">Your credit balance</div>
          <div class="cae-balance-value">
            ${creditsIconMarkup(22, "is-large")}
            <span>${esc(balance ? `${fmtCredits(balance.credits)} Credits` : "Unavailable")}</span>
          </div>
          <div class="cae-balance-meta">Last updated: ${esc(updated)}</div>
        </div>
        <div class="cae-snapshot-grid">
          <div class="cae-snapshot-card">
            <span class="cae-snapshot-label">Window</span>
            <strong>${esc(windowLabel(state.selectedWindow))}</strong>
          </div>
          <div class="cae-snapshot-card">
            <span class="cae-snapshot-label">Top model</span>
            <strong title="${esc(topModel)}">${esc(topModel)}</strong>
          </div>
          <div class="cae-snapshot-card">
            <span class="cae-snapshot-label">Runs</span>
            <strong>${fmtCount(context.usageSummary.runCount)}</strong>
          </div>
          <div class="cae-snapshot-card">
            <span class="cae-snapshot-label">Spend</span>
            <strong>${fmtUsd(context.usageSummary.totalUsd)}</strong>
          </div>
        </div>
      </div>
    </section>
  `;
}

function filtersMarkup(context) {
  const windowButtons = ["1h", "24h", "7d", "30d", "all"]
    .map(
      (key) => `
        <button class="cae-filter-pill ${state.selectedWindow === key ? "is-active" : ""}" data-cae-window="${key}">
          ${key.toUpperCase()}
        </button>
      `
    )
    .join("");
  const sectionButtons = [
    ["overview", "Overview"],
    ["activity", "Activity"],
    ["topups", "Credits Added"],
    ["burn", "Burn Rate"],
    ["export", "Export"]
  ]
    .map(
      ([key, label]) => `
        <button class="cae-tab ${state.selectedSection === key ? "is-active" : ""}" data-cae-section="${key}">
          ${label}
        </button>
      `
    )
    .join("");

  return `
    <section class="cae-shell-card cae-toolbar-card">
      <div class="cae-toolbar-row">
        <div class="cae-filter-group">
          ${windowButtons}
          <label class="cae-custom-window ${state.selectedWindow === "custom" ? "is-active" : ""}" data-cae-window="custom">
            <span>Custom</span>
            <input
              type="number"
              min="1"
              max="3650"
              step="1"
              value="${state.customWindowDays}"
              data-cae-custom-days
              aria-label="Custom range in days"
            />
            <span>days</span>
          </label>
        </div>
        <div class="cae-filter-group cae-filter-group-selects">
          ${selectMarkup("Provider", context.activeProvider, context.providerOptions, "All providers")}
          ${selectMarkup("Model", context.activeModel, context.modelOptions, "All models")}
        </div>
      </div>
      <div class="cae-tab-row">${sectionButtons}</div>
    </section>
  `;
}

function overviewMarkup(context) {
  const stackedGroup = state.selectedStackedGroup === "model" ? "model" : "provider";
  const overviewEvents = context.scopedEvents;
  const overviewLeaderboard = aggregateModels(overviewEvents, Infinity);
  const overviewProviderSummary = aggregateProviders(overviewEvents, 6);
  const stacked = buildStackedTimeline(overviewEvents, {
    windowKey: state.selectedWindow,
    groupBy: stackedGroup,
    topN: 5
  });
  const shareItems =
    stackedGroup === "model"
      ? overviewLeaderboard.slice(0, 6).map((item) => ({
          key: `${item.provider}|||${item.model}`,
          label: item.model,
          value: item.credits,
          total: item.credits
        }))
      : overviewProviderSummary.map((item) => ({
          key: item.provider,
          label: item.provider,
          value: item.credits,
          total: item.credits
        }));
  return `
    <section class="cae-section-grid">
      <div class="cae-shell-card cae-card-span-2">
        <div class="cae-card-head">
          <div>
            <h3>Stacked usage</h3>
            <p>Credits consumed per time bucket, stacked by ${stackedGroup === "model" ? "model" : "provider"}.</p>
          </div>
          <div class="cae-chart-toggle-group">
            <button class="cae-filter-pill cae-chart-toggle ${stackedGroup === "provider" ? "is-active" : ""}" data-cae-stack-group="provider">Providers</button>
            <button class="cae-filter-pill cae-chart-toggle ${stackedGroup === "model" ? "is-active" : ""}" data-cae-stack-group="model">Models</button>
          </div>
        </div>
        ${renderStackedBarChart({
          bins: stacked.bins,
          series: stacked.series,
          valueFormatter: (value) => fmtCredits(value),
          usdFormatter: (value) => fmtUsd(value / 211),
          tooltipFormatter: (bin, segment) => `${segment.label} - ${bin.label}: ${fmtCredits(segment.value)} credits / ${fmtUsd(segment.value / 211)}`,
          emptyMessage: `No ${stackedGroup} usage in this scope.`,
          splitXAxisLabels: ["1h", "7d"].includes(state.selectedWindow)
        })}
      </div>
      <div class="cae-shell-card">
        <div class="cae-card-head">
          <div>
            <h3>${stackedGroup === "model" ? "Model share" : "Provider share"}</h3>
            <p>Pie-style share of credits by ${stackedGroup === "model" ? "model" : "provider"}.</p>
          </div>
        </div>
        ${renderDonutChart({
          items: shareItems,
          valueFormatter: (value) => fmtCredits(value),
          usdFormatter: (value) => fmtUsd(value / 211),
          centerValue: fmtCredits(context.usageSummary.totalCredits),
          centerSubvalue: fmtUsd(context.usageSummary.totalUsd),
          compactCenter: true,
          emptyMessage: `No ${stackedGroup} share yet.`
        })}
      </div>
      <div class="cae-shell-card cae-card-span-2">
        <div class="cae-card-head">
          <div>
            <h3>Models</h3>
            <p>All models with usage in the current scope.</p>
          </div>
        </div>
        ${modelRowsMarkup(overviewLeaderboard, context.usageSummary.totalCredits)}
      </div>
      <div class="cae-shell-card">
        <div class="cae-card-head">
          <div>
            <h3>Window snapshots</h3>
            <p>Quick compare across the preset ranges.</p>
          </div>
        </div>
        ${snapshotCardsMarkup(context)}
      </div>
    </section>
  `;
}

function activityMarkup(context) {
  return `
    <section class="cae-section-grid">
      <div class="cae-shell-card cae-card-span-2">
        <div class="cae-card-head">
          <div>
            <h3>Activity</h3>
            <p>Filterable usage feed with pagination and per-model drilldown.</p>
          </div>
          <div class="cae-inline-note">${fmtCount(context.pagedUsage.total)} matching events</div>
        </div>
        ${usageTableMarkup(context)}
      </div>
      <div class="cae-shell-card">
        <div class="cae-card-head">
          <div>
            <h3>Recent billing ledger</h3>
            <p>Top-ups plus latest usage charges.</p>
          </div>
        </div>
        ${billingLedgerMarkup(context)}
      </div>
    </section>
  `;
}

function topupsMarkup(context) {
  const latest = context.topupSummary.latest
    ? fmtDateFull(context.topupSummary.latest.createdAt)
    : "No top-ups yet";
  return `
    <section class="cae-section-grid">
      <div class="cae-shell-card cae-card-span-3">
        <div class="cae-metric-strip">
          <div class="cae-metric-card">
            <span>Total added</span>
            <strong>${fmtCredits(context.topupSummary.totalCredits)}</strong>
          </div>
          <div class="cae-metric-card">
            <span>USD value</span>
            <strong>${fmtUsd(context.topupSummary.totalUsd)}</strong>
          </div>
          <div class="cae-metric-card">
            <span>Top-ups</span>
            <strong>${fmtCount(context.topupSummary.count)}</strong>
          </div>
          <div class="cae-metric-card">
            <span>Latest</span>
            <strong title="${esc(latest)}">${esc(latest)}</strong>
          </div>
        </div>
      </div>
      <div class="cae-shell-card cae-card-span-3">
        <div class="cae-card-head">
          <div>
            <h3>Credits added history</h3>
            <p>Top-up events in the selected window, with added value and converted credits.</p>
          </div>
          <div class="cae-inline-note">${fmtCount(context.pagedTopups.total)} top-up events</div>
        </div>
        ${topUpTableMarkup(context)}
      </div>
    </section>
  `;
}

function sectionMarkup(context) {
  if (state.selectedSection === "activity") return activityMarkup(context);
  if (state.selectedSection === "topups") return topupsMarkup(context);
  if (state.selectedSection === "burn") return burnMarkup(context);
  if (state.selectedSection === "export") return exportMarkup(context);
  return overviewMarkup(context);
}

export function panelMarkup() {
  if (!hasCloudAuth()) {
    return `
      <div class="cae-error">
        <p>Sign in to Comfy first. This local ComfyUI session has no cloud auth token, so credits history endpoints stay unavailable.</p>
        <button class="cae-button cae-button-pill" data-cae-action="signin">Open User Settings</button>
      </div>
    `;
  }
  if (state.error) return `<div class="cae-error">${esc(state.error)}</div>`;
  const context = buildContext();
  return `
    <div class="cae-panel-inner">
      ${headerMarkup(context)}
      ${filtersMarkup(context)}
      ${sectionMarkup(context)}
    </div>
  `;
}

export function renderPanel() {
  if (!state.panelRoot) return;
  if (state.loading && !state.events.length && !state.error) {
    state.panelRoot.innerHTML = `<div class="cae-empty">Loading credits telemetry...</div>`;
    ensureChartTooltip(state.panelRoot);
    return;
  }
  state.panelRoot.innerHTML = panelMarkup();
  ensureChartTooltip(state.panelRoot);
}

function ensureChartTooltip(container) {
  let tooltip = document.body.querySelector(".cae-chart-floating-tooltip");
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.className = "cae-chart-floating-tooltip";
  tooltip.innerHTML = `
    <div class="cae-chart-floating-tooltip-title"></div>
    <div class="cae-chart-floating-tooltip-body"></div>
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

function hideChartTooltip(tooltip) {
  tooltip.classList.remove("is-visible");
  tooltip.style.transform = "translate(-9999px, -9999px)";
}

function placeChartTooltip(container, tooltip, clientX, clientY) {
  const tooltipRect = tooltip.getBoundingClientRect();
  const offsetX = 18;
  const offsetY = 18;
  const minLeft = 12;
  const maxLeft = window.innerWidth - tooltipRect.width - 12;
  const minTop = 12;
  const maxTop = window.innerHeight - tooltipRect.height - 12;
  let left = clientX + offsetX;
  let top = clientY + offsetY;
  if (left > maxLeft) left = clientX - tooltipRect.width - offsetX;
  left = Math.max(minLeft, Math.min(left, maxLeft));
  top = Math.max(minTop, Math.min(top, maxTop));
  tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

function showChartTooltip(container, tooltip, node, clientX, clientY) {
  const title = node.dataset.caeTooltipTitle || "";
  const body = node.dataset.caeTooltipBody || "";
  tooltip.querySelector(".cae-chart-floating-tooltip-title").textContent = title;
  tooltip.querySelector(".cae-chart-floating-tooltip-body").textContent = body;
  tooltip.classList.add("is-visible");
  placeChartTooltip(container, tooltip, clientX, clientY);
}

export function attachPanelEvents(container, onRefresh) {
  if (container.dataset.caeBound === "true") return;
  container.dataset.caeBound = "true";
  let tooltip = ensureChartTooltip(container);
  const getTooltip = () => {
    if (!tooltip.isConnected) tooltip = ensureChartTooltip(container);
    return tooltip;
  };

  container.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const actionButton = event.target.closest("[data-cae-action]");
    if (actionButton) {
      const { caeAction } = actionButton.dataset;
      if (caeAction === "refresh") onRefresh();
      if (caeAction === "signin" || caeAction === "settings") openUserSettings();
      return;
    }
    const windowButton = event.target.closest("[data-cae-window]");
    if (windowButton) {
      updateWindow(windowButton.dataset.caeWindow);
      return;
    }
    const sectionButton = event.target.closest("[data-cae-section]");
    if (sectionButton) {
      updateSection(sectionButton.dataset.caeSection);
      return;
    }
    const stackedButton = event.target.closest("[data-cae-stack-group]");
    if (stackedButton) {
      updateStackedGroup(stackedButton.dataset.caeStackGroup);
      return;
    }
    const pageButton = event.target.closest("[data-cae-page]");
    if (pageButton) updateLedgerPage(pageButton.dataset.caePage);
    const exportButton = event.target.closest("[data-cae-export-action]");
    if (exportButton) handleExportAction(container, exportButton.dataset.caeExportAction);
  });

  container.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    if (event.target.dataset.caeSelect === "provider") {
      updateProviderFilter(event.target.value);
      return;
    }
    if (event.target.dataset.caeSelect === "model") updateModelFilter(event.target.value);
    if (event.target.matches("[data-cae-export-dataset]")) refreshExportPreview(container);
    if (event.target.matches("[data-cae-burn-range-unit], [data-cae-burn-rate-unit]")) refreshBurnPreview(container);
  });

  container.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.matches("[data-cae-custom-days]")) updateCustomWindowDays(event.target.value);
    if (event.target.matches("[data-cae-page-jump]")) updateLedgerPage(event.target.value);
    if (event.target.matches("[data-cae-export-days], [data-cae-export-scope]")) refreshExportPreview(container);
    if (event.target.matches("[data-cae-export-row]")) syncExportSelectionCount(container, event.target);
    if (event.target.matches("[data-cae-export-page]")) updateExportPage(container);
    if (event.target.matches("[data-cae-burn-range], [data-cae-burn-reserve], [data-cae-burn-scope]")) refreshBurnPreview(container);
  });

  container.addEventListener("mousemove", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest(".cae-chart-node");
    if (!node) {
      hideChartTooltip(getTooltip());
      return;
    }
    showChartTooltip(container, getTooltip(), node, event.clientX, event.clientY);
  });

  container.addEventListener("mouseleave", () => {
    hideChartTooltip(getTooltip());
  });

  container.addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest(".cae-chart-node");
    if (!node) return;
    const rect = node.getBoundingClientRect();
    showChartTooltip(container, getTooltip(), node, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  container.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      const active = document.activeElement instanceof Element ? document.activeElement.closest(".cae-chart-node") : null;
      if (!active) hideChartTooltip(getTooltip());
    });
  });

  container.addEventListener("scroll", () => {
    hideChartTooltip(getTooltip());
  });
}
