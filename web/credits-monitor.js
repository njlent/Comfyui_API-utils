import { app } from "../../scripts/app.js";
import {
  CMD_OPEN,
  CMD_REFRESH,
  EXTENSION_NAME,
  PANEL_TAB_ID,
  fmtCredits,
  fmtUsd,
  hasCloudAuth,
  openPanel,
  openUserSettings,
  refreshData,
  state,
  subscribe,
  topbarStatus
} from "./credits-monitor-data.js";
import {
  formatBurnDuration,
  formatBurnTopUpDate,
  summarizeBurn
} from "./credits-monitor-burn.js";
import {
  attachPanelEvents,
  renderPanel
} from "./credits-monitor-panel.js";
import {
  creditsIconMarkup,
  esc
} from "./credits-monitor-ui-fragments.js";
import {
  currentSettings,
  showCreditsWidget,
  subscribeSettings
} from "./credits-monitor-settings.js";

const EXTENSION_CSS_URL = new URL("./credits-monitor.css", import.meta.url).toString();

function ensureStyles() {
  if (document.querySelector(`link[href="${EXTENSION_CSS_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = EXTENSION_CSS_URL;
  document.head.appendChild(link);
}

function widgetBurnConfig(settings) {
  return {
    rangeValue: settings.creditsWidgetBurnRateRange,
    rangeUnit: settings.creditsWidgetBurnRateRangeUnit,
    rateUnit: settings.creditsWidgetBurnRateUnit,
    reserveCredits: settings.creditsWidgetReserveCredits,
    currentScope: false
  };
}

function topbarBurnLines(settings) {
  if (!hasCloudAuth() || (!settings.showCreditsWidgetBurnRate && !settings.showCreditsWidgetTopUpEta)) return "";
  const summary = summarizeBurn(widgetBurnConfig(settings));
  const lines = [];
  if (settings.showCreditsWidgetBurnRate) {
    lines.push(`Burn rate ${fmtCredits(summary.rateCredits)} credits/${settings.creditsWidgetBurnRateUnit}`);
  }
  if (settings.showCreditsWidgetTopUpEta) {
    const eta = formatBurnTopUpDate(summary.hoursToReserve);
    const runway = formatBurnDuration(summary.hoursToReserve);
    lines.push(Number.isFinite(summary.hoursToReserve) ? `Top-up ${eta} (${runway})` : "Top-up ETA unavailable");
  }
  return lines.map((line) => `<div class="cae-topbar-secondary">${esc(line)}</div>`).join("");
}

function topbarMarkup(settings = currentSettings()) {
  const balance = state.balance;
  const authed = hasCloudAuth();
  const status = topbarStatus();
  const showRefresh = settings.showCreditsWidgetRefreshButton;
  const primary = authed
    ? balance
      ? `${fmtCredits(balance.credits)} Credits`
      : "Credits unavailable"
    : "Comfy sign-in required";
  const secondary = authed
    ? balance
      ? `${fmtUsd(balance.usd)} value`
      : "No balance loaded"
    : "Settings > User";
  return `
    <div class="cae-topbar-card">
      <div class="cae-topbar-balance">
        <div class="cae-topbar-primary" title="${esc(status)}">
          ${creditsIconMarkup(15)}
          <span>${esc(primary)}</span>
        </div>
        <div class="cae-topbar-secondary">${esc(secondary)}</div>
        ${topbarBurnLines(settings)}
      </div>
      <div class="cae-topbar-actions">
        ${showRefresh ? `
          <button class="cae-button cae-button-icon" data-cae-action="refresh" title="Sync credits" aria-label="Sync credits">
            <i class="mdi mdi-refresh"></i>
          </button>
        ` : ""}
        <button
          class="cae-button cae-button-icon"
          data-cae-action="${authed ? "open" : "signin"}"
          title="${authed ? "Open analytics" : "Open sign in"}"
          aria-label="${authed ? "Open analytics" : "Open sign in"}"
        >
          <i class="mdi ${authed ? "mdi-chart-box-outline" : "mdi-login"}"></i>
        </button>
      </div>
    </div>
  `;
}

function scheduleTopbarRetry(attempt = 0) {
  if (state.topbarRetryHandle || attempt > 20) return;
  state.topbarRetryHandle = window.setTimeout(() => {
    state.topbarRetryHandle = 0;
    ensureTopbar(attempt + 1);
  }, 400);
}

function ensureTopbar(attempt = 0, settings = currentSettings()) {
  ensureStyles();
  const menu = app.menu?.element;
  if (!menu) {
    scheduleTopbarRetry(attempt);
    return;
  }
  if (!showCreditsWidget()) {
    state.topbarRoot?.remove();
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
  state.topbarRoot.innerHTML = topbarMarkup(settings);
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
        attachPanelEvents(container, () => refreshData(true));
        renderPanel();
      }
    }
  ],
  async setup() {
    if (!state.setupDone) {
      state.setupDone = true;
      subscribe(() => {
        ensureTopbar(0, currentSettings());
        renderPanel();
      });
      subscribeSettings((settings) => {
        ensureTopbar(0, settings);
      });
      startAutoRefresh();
    }
    ensureTopbar();
    await refreshData(true);
  }
});
