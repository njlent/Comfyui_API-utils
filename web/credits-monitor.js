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
  attachPanelEvents,
  renderPanel
} from "./credits-monitor-panel.js";
import {
  creditsIconMarkup,
  esc
} from "./credits-monitor-ui-fragments.js";

const EXTENSION_CSS_URL = new URL("./credits-monitor.css", import.meta.url).toString();

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
  const status = topbarStatus();
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
      </div>
      <div class="cae-topbar-actions">
        <button class="cae-button cae-button-pill" data-cae-action="refresh">Sync</button>
        <button class="cae-button cae-button-pill" data-cae-action="${authed ? "open" : "signin"}">${authed ? "Analytics" : "Sign In"}</button>
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
        ensureTopbar();
        renderPanel();
      });
      startAutoRefresh();
    }
    ensureTopbar();
    await refreshData(true);
  }
});
