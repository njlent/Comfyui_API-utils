import { app } from "../../scripts/app.js";
import {
  CMD_OPEN,
  CMD_REFRESH,
  EXTENSION_NAME,
  PANEL_TAB_ID,
  aggregateModels,
  buildBins,
  describeEvent,
  fmtCount,
  fmtCredits,
  fmtDate,
  fmtUsd,
  hasCloudAuth,
  openPanel,
  openUserSettings,
  recentLedger,
  refreshData,
  state,
  subscribe,
  summarize,
  summariesByWindow,
  topbarStatus,
  updateWindow,
  usageEventsInWindow,
  windowLabel
} from "./credits-monitor-data.js";

const EXTENSION_CSS_URL = new URL("./credits-monitor.css", import.meta.url).toString();

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureStyles() {
  if (document.querySelector(`link[href="${EXTENSION_CSS_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = EXTENSION_CSS_URL;
  document.head.appendChild(link);
}

function topbarMarkup() {
  const balance = state.balance;
  const authed = hasCloudAuth();
  const primary = authed
    ? balance
      ? `${fmtCredits(balance.credits)} credits`
      : "Credits unavailable"
    : "Comfy sign-in required";
  const secondary = authed
    ? balance
      ? `${fmtUsd(balance.usd)} value`
      : "No balance loaded"
    : "Settings > User";
  return `
    <div class="cae-topbar-card" title="${esc(topbarStatus())}">
      <div class="cae-topbar-balance">
        <div class="cae-topbar-kicker">Comfy Credits</div>
        <div class="cae-topbar-primary">${esc(primary)}</div>
        <div class="cae-topbar-secondary">${esc(secondary)}</div>
      </div>
      <div class="cae-topbar-actions">
        <button class="cae-button cae-button-pill" data-cae-action="refresh">Sync</button>
        <button class="cae-button cae-button-pill" data-cae-action="${authed ? "open" : "signin"}">${authed ? "Analytics" : "Sign In"}</button>
      </div>
    </div>
    <div class="cae-topbar-status">${esc(topbarStatus())}</div>
  `;
}

function scheduleTopbarRetry(attempt = 0) {
  if (state.topbarRetryHandle || attempt > 20) return;
  state.topbarRetryHandle = window.setTimeout(() => {
    state.topbarRetryHandle = 0;
    ensureTopbar(attempt + 1);
  }, 400);
}

function ensureTopbar(attempt = 0) {
  ensureStyles();
  const menu = app.menu?.element;
  if (!menu) {
    scheduleTopbarRetry(attempt);
    return;
  }
  if (!state.topbarRoot) {
    const shell = document.createElement("div");
    shell.className = "cae-topbar-shell";
    shell.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("[data-cae-action]");
      if (!button) return;
      if (button.dataset.caeAction === "refresh") refreshData(true);
      if (button.dataset.caeAction === "open") openPanel();
      if (button.dataset.caeAction === "signin") openUserSettings();
    });
    state.topbarRoot = shell;
  }
  if (state.topbarRoot.parentElement !== menu) menu.appendChild(state.topbarRoot);
  state.topbarRoot.innerHTML = topbarMarkup();
}

function heroMarkup(windowSummary) {
  const balance = state.balance;
  const stats = summariesByWindow()
    .map(
      (summary) => `
        <div class="cae-stat">
          <div class="cae-stat-label">${summary.label}</div>
          <div class="cae-stat-value">${fmtCredits(summary.totalCredits)}</div>
          <div class="cae-stat-sub">${fmtUsd(summary.totalUsd)} across ${fmtCount(summary.runCount)} runs</div>
        </div>
      `
    )
    .join("");
  return `
    <section class="cae-hero">
      <div class="cae-hero-card cae-hero-main">
        <h2 class="cae-hero-title">Credits telemetry, not guesswork.</h2>
        <div class="cae-hero-copy">
          Track live balance, dollar value, model mix, and estimated spend from the same Comfy billing feeds the official UI already uses.
        </div>
        <div class="cae-hero-meta">
          <div class="cae-chip"><strong>Balance</strong> ${esc(balance ? `${fmtCredits(balance.credits)} / ${fmtUsd(balance.usd)}` : "Unavailable")}</div>
          <div class="cae-chip"><strong>Window</strong> ${esc(windowSummary.label)}</div>
          <div class="cae-chip"><strong>Top model</strong> ${esc(windowSummary.topModel ? windowSummary.topModel.name : "None yet")}</div>
        </div>
      </div>
      <div class="cae-hero-card cae-hero-side">${stats}</div>
    </section>
  `;
}

function chartMarkup(bins) {
  if (!bins.length) return `<div class="cae-empty">No usage yet for this window.</div>`;
  const peak = Math.max(...bins.map((bin) => bin.credits), 1);
  const bars = bins
    .map((bin) => {
      const height = Math.max((bin.credits / peak) * 180, bin.credits ? 12 : 8);
      return `
        <div class="cae-bar-wrap" title="${esc(`${bin.label}: ${fmtCredits(bin.credits)} credits / ${fmtUsd(bin.usd)}`)}">
          <div class="cae-bar" style="height:${height}px"></div>
          <div class="cae-bar-label">${esc(bin.label)}</div>
        </div>
      `;
    })
    .join("");
  return `<div class="cae-chart" style="--cae-bars:${bins.length}">${bars}</div>`;
}

function modelsMarkup(models, totalCredits) {
  if (!models.length) return `<div class="cae-empty">No model usage in this range.</div>`;
  return `
    <div class="cae-list">
      ${models
        .map((item) => {
          const share = totalCredits ? (item.credits / totalCredits) * 100 : 0;
          return `
            <div class="cae-list-row">
              <div class="cae-list-main">
                <div class="cae-list-title">${esc(item.model)}</div>
                <div class="cae-list-sub">${esc(item.provider)}</div>
              </div>
              <div class="cae-list-metric">
                <strong>${fmtCredits(item.credits)}</strong>
                <span>${fmtUsd(item.usd)}</span>
              </div>
              <div class="cae-list-metric">
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

function ledgerMarkup() {
  const rows = recentLedger()
    .map(
      (event) => `
        <div class="cae-table-row">
          <div>${esc(fmtDate(event.createdAt))}</div>
          <div>${esc(describeEvent(event))}</div>
          <div class="${event.type === "credit_added" ? "cae-positive" : "cae-negative"}">
            ${event.type === "credit_added" ? "+" : "-"}${fmtCredits(event.credits)}
          </div>
          <div>${fmtUsd(event.usd)}</div>
        </div>
      `
    )
    .join("");
  return `
    <div class="cae-table">
      <div class="cae-table-row is-head">
        <div>Time</div>
        <div>Event</div>
        <div>Credits</div>
        <div>USD</div>
      </div>
      ${rows || `<div class="cae-empty">No credit events loaded yet.</div>`}
    </div>
  `;
}

function panelMarkup() {
  if (!hasCloudAuth()) {
    return `
      <div class="cae-error">
        <p>Sign in to Comfy first. This local ComfyUI session has no cloud auth token, so credits history endpoints stay unavailable.</p>
        <button class="cae-button cae-button-pill" data-cae-action="signin">Open User Settings</button>
      </div>
    `;
  }
  if (state.error) return `<div class="cae-error">${esc(state.error)}</div>`;
  const windowEvents = usageEventsInWindow();
  const windowSummary = { label: windowLabel(state.selectedWindow), ...summarize(windowEvents) };
  const bins = buildBins(windowEvents);
  const models = aggregateModels(windowEvents);
  const windowButtons = ["1h", "24h", "7d", "30d", "all"]
    .map(
      (key) => `
        <button class="cae-button cae-window ${state.selectedWindow === key ? "is-active" : ""}" data-cae-window="${key}">
          ${key.toUpperCase()}
        </button>
      `
    )
    .join("");
  return `
    <div class="cae-panel-inner">
      ${heroMarkup(windowSummary)}
      <div class="cae-toolbar">
        <div class="cae-toolbar-group">${windowButtons}</div>
        <div class="cae-toolbar-group">
          <button class="cae-button cae-button-pill" data-cae-action="refresh" ${state.loading ? "disabled" : ""}>Refresh data</button>
        </div>
      </div>
      <section class="cae-grid">
        <div class="cae-card">
          <h3>Spend curve</h3>
          <p>Usage-only view. Spend is estimated from token counts and published Comfy pricing. Top-ups stay in the ledger below.</p>
          ${chartMarkup(bins)}
        </div>
        <div class="cae-card">
          <h3>Model breakdown</h3>
          <p>Which provider/model drove usage in the selected window.</p>
          ${modelsMarkup(models, windowSummary.totalCredits)}
        </div>
      </section>
      <section class="cae-card">
        <h3>Recent credit ledger</h3>
        <p>Top-ups plus completed API usage.</p>
        ${ledgerMarkup()}
      </section>
    </div>
  `;
}

function renderPanel() {
  if (!state.panelRoot) return;
  if (state.loading && !state.events.length && !state.error) {
    state.panelRoot.innerHTML = `<div class="cae-empty">Loading credits telemetry...</div>`;
    return;
  }
  state.panelRoot.innerHTML = panelMarkup();
}

function attachPanelEvents(container) {
  if (container.dataset.caeBound === "true") return;
  container.dataset.caeBound = "true";
  container.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const refreshButton = event.target.closest("[data-cae-action='refresh']");
    if (refreshButton) {
      refreshData(true);
      return;
    }
    const signInButton = event.target.closest("[data-cae-action='signin']");
    if (signInButton) {
      openUserSettings();
      return;
    }
    const windowButton = event.target.closest("[data-cae-window]");
    if (windowButton) updateWindow(windowButton.dataset.caeWindow);
  });
}

function startAutoRefresh() {
  if (state.autoRefreshStarted) return;
  state.autoRefreshStarted = true;
  state.autoRefreshHandle = window.setInterval(() => {
    ensureTopbar();
    if (!document.hidden) refreshData();
  }, 2 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshData();
  });
}

ensureStyles();

app.registerExtension({
  name: EXTENSION_NAME,
  commands: [
    {
      id: CMD_OPEN,
      label: "Toggle Credits Analytics",
      function: () => openPanel()
    },
    {
      id: CMD_REFRESH,
      label: "Refresh Credits Analytics",
      function: () => refreshData(true)
    }
  ],
  menuCommands: [
    {
      path: ["Extensions", "Credits Analytics"],
      commands: [CMD_OPEN, CMD_REFRESH]
    }
  ],
  bottomPanelTabs: [
    {
      id: PANEL_TAB_ID,
      title: "Credits Analytics",
      type: "custom",
      render: (container) => {
        container.classList.add("cae-panel");
        state.panelRoot = container;
        attachPanelEvents(container);
        renderPanel();
      }
    }
  ],
  async setup() {
    if (!state.setupDone) {
      state.setupDone = true;
      subscribe(() => {
        ensureTopbar();
        renderPanel();
      });
      startAutoRefresh();
    }
    ensureTopbar();
    await refreshData(true);
  }
});
