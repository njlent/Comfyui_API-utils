import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { estimateCredits } from "./credits-monitor-pricing.js";

export const EXTENSION_NAME = "Comfy.ApiUtils.CreditsMonitor";
export const PANEL_TAB_ID = "credits-analytics";
export const CMD_OPEN = "creditsAnalytics.open";
export const CMD_REFRESH = "creditsAnalytics.refresh";

const WINDOW_KEY = "comfy.api_utils.window";
const SECTION_KEY = "comfy.api_utils.section";
const PROVIDER_KEY = "comfy.api_utils.provider";
const MODEL_KEY = "comfy.api_utils.model";
const STACKED_GROUP_KEY = "comfy.api_utils.stacked_group";
const PAGE_KEY = "comfy.api_utils.page";
const CUSTOM_WINDOW_DAYS_KEY = "comfy.api_utils.custom_window_days";
const CREDITS_PER_USD = 211;
const CLOUD_API_ORIGIN = "https://api.comfy.org";

const WINDOW_LABELS = {
  "1h": "Last hour",
  "24h": "Last day",
  "7d": "Last week",
  "30d": "Last month",
  all: "All time"
};

function clampCustomWindowDays(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 14;
  return Math.min(Math.max(parsed, 1), 3650);
}

function createState() {
  return {
    loading: false,
    error: "",
    mode: "personal",
    balance: null,
    events: [],
    usageEvents: [],
    creditAddedEvents: [],
    lastUpdated: null,
    selectedWindow: localStorage.getItem(WINDOW_KEY) || "24h",
    selectedSection: localStorage.getItem(SECTION_KEY) || "overview",
    selectedProvider: localStorage.getItem(PROVIDER_KEY) || "all",
    selectedModel: localStorage.getItem(MODEL_KEY) || "all",
    selectedStackedGroup: localStorage.getItem(STACKED_GROUP_KEY) || "provider",
    ledgerPage: Number(localStorage.getItem(PAGE_KEY) || 1),
    customWindowDays: clampCustomWindowDays(localStorage.getItem(CUSTOM_WINDOW_DAYS_KEY) || 14),
    listeners: new Set(),
    refreshPromise: null,
    topbarRoot: null,
    topbarRetryHandle: 0,
    autoRefreshHandle: 0,
    autoRefreshStarted: false,
    panelRoot: null,
    setupDone: false,
    cloudAuthDetected: false
  };
}

const previousState = window.__caeCreditsMonitorState || {};
export const state = Object.assign(createState(), previousState);
state.listeners = previousState.listeners instanceof Set ? previousState.listeners : new Set();
window.__caeCreditsMonitorState = state;

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toUsdFromCents(cents) {
  return cents / 100;
}

function toCreditsFromUsd(usd) {
  return usd * CREDITS_PER_USD;
}

function toCreditsFromCents(cents) {
  return toCreditsFromUsd(toUsdFromCents(cents));
}

function toUsdFromCredits(credits) {
  return credits / CREDITS_PER_USD;
}

function addHeader(headers, key, value) {
  if (!value) return;
  headers[key] = value;
}

export function fmtCredits(value) {
  const abs = Math.abs(value);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: abs > 0 && abs < 0.01 ? 4 : abs < 100 ? 2 : 0,
    maximumFractionDigits: abs > 0 && abs < 0.01 ? 4 : 2
  }).format(value);
}

export function fmtUsd(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function fmtCount(value) {
  return new Intl.NumberFormat().format(value);
}

export function fmtDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function fmtDateFull(value) {
  return new Date(value).toLocaleString();
}

function staticAuthHeaders() {
  const headers = {};
  addHeader(headers, "Authorization", api.authToken ? `Bearer ${api.authToken}` : "");
  addHeader(headers, "X-API-KEY", api.apiKey);
  const stored = localStorage.getItem("comfy_api_key");
  addHeader(headers, "X-API-KEY", stored);
  return headers;
}

function findFrontendAssetBase() {
  const urls = [
    ...[...document.scripts].map((script) => script.src),
    ...performance.getEntriesByType("resource").map((entry) => entry.name)
  ].filter(Boolean);
  const assetUrl = urls.find((url) => /\/assets\/(?:api|index)-[^/]+\.js(?:\?|$)/.test(url));
  if (assetUrl) return new URL("./", assetUrl);
  return new URL(`${api.api_base || ""}/assets/`, window.location.origin);
}

function storeValue(value) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForAuthStore(store) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (storeValue(store.isInitialized) !== false) return;
    await delay(100);
  }
}

async function getFirebaseAuthStore() {
  if (typeof api.getAuthStore === "function") {
    try {
      const store = await api.getAuthStore();
      if (store) {
        await waitForAuthStore(store);
        return store;
      }
    } catch {
      // Non-cloud builds return no store here; fall through to module discovery.
    }
  }

  const source = typeof api.getAuthStore === "function" ? String(api.getAuthStore) : "";
  const moduleName = source.match(/firebaseAuthStore-[^"`')]+\.js/)?.[0];
  if (!moduleName) return null;

  const moduleUrl = new URL(moduleName, findFrontendAssetBase()).toString();
  const module = await import(moduleUrl);
  const store = module.useFirebaseAuthStore?.() || null;
  if (store) await waitForAuthStore(store);
  return store;
}

async function firebaseAuthHeaders() {
  try {
    const store = await getFirebaseAuthStore();
    if (!store) return {};
    let header = null;
    if (typeof store.getFirebaseAuthHeader === "function") {
      header = await store.getFirebaseAuthHeader();
    }
    if (!header && typeof store.getAuthHeader === "function") {
      header = await store.getAuthHeader();
    }
    return header || {};
  } catch (error) {
    console.warn("ComfyUI API Enhance: failed to read Comfy auth store", error);
    return {};
  }
}

async function authHeaders() {
  const headers = staticAuthHeaders();
  if (Object.keys(headers).length) {
    state.cloudAuthDetected = true;
    return headers;
  }

  const firebaseHeaders = await firebaseAuthHeaders();
  state.cloudAuthDetected = Object.keys(firebaseHeaders).length > 0;
  return firebaseHeaders;
}

export function hasCloudAuth() {
  return Boolean(
    api.authToken ||
      api.apiKey ||
      localStorage.getItem("comfy_api_key") ||
      state.cloudAuthDetected
  );
}

async function hasCloudAuthAsync() {
  return Object.keys(await authHeaders()).length > 0;
}

export function openUserSettings() {
  const buttons = [...document.querySelectorAll("button")];
  const settingsButton = buttons.find((button) =>
    (button.getAttribute("aria-label") || "").includes("Settings")
  );
  settingsButton?.click();
  let attempts = 0;
  const tick = () => {
    attempts += 1;
    const creditsButton = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Credits"
    );
    if (creditsButton) {
      creditsButton.click();
      return;
    }
    const userButton = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "User"
    );
    if (userButton) {
      userButton.click();
      return;
    }
    if (attempts < 20) window.setTimeout(tick, 150);
  };
  window.setTimeout(tick, settingsButton ? 100 : 0);
}

async function requestJson(route, params = {}) {
  const url = new URL(api.apiURL(route), window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store"
  });
  if (!response.ok) {
    const error = new Error(`${route} -> ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return await response.json();
}

async function requestCloudJson(route, params = {}) {
  const url = new URL(route, CLOUD_API_ORIGIN);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store"
  });
  if (!response.ok) {
    const error = new Error(`${url.pathname} -> ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return await response.json();
}

function normalizeBalance(payload) {
  const cents = num(
    payload?.effective_balance_micros ??
      payload?.effectiveBalanceMicros ??
      payload?.amount_micros ??
      payload?.amountMicros
  );
  const usd = toUsdFromCents(cents);
  return {
    cents,
    usd,
    credits: toCreditsFromCents(cents),
    currency: payload?.currency || "USD"
  };
}

function normalizeEvent(event) {
  const params = event?.params || {};
  const type = String(event?.event_type || event?.eventType || "unknown");
  const estimatedCredits = estimateCredits(event);
  const cents = num(
    params.cost ??
      params.amount_cents ??
      params.charge_cents ??
      params.amount ??
      params.amount_micros ??
      params.amountMicros
  );
  const explicitCredits = estimatedCredits ?? params.credits_used ?? params.credits ?? null;
  const credits =
    explicitCredits !== null && explicitCredits !== undefined
      ? num(explicitCredits)
      : toCreditsFromCents(cents);
  const explicitUsd = params.usd ?? params.amount_usd ?? null;
  const usd =
    explicitUsd !== null && explicitUsd !== undefined
      ? num(explicitUsd)
      : cents
        ? toUsdFromCents(cents)
        : toUsdFromCredits(credits);
  const provider =
    type === "cloud_workflow_executed"
      ? "Comfy Cloud"
      : String(params.api_name ?? params.provider ?? params.service ?? "API");
  const model =
    type === "cloud_workflow_executed"
      ? String(params.workflow_name ?? params.workflowName ?? params.name ?? "Cloud workflow")
      : String(params.model ?? params.model_name ?? params.engine ?? "Unknown model");
  const createdAt = event?.createdAt || event?.created_at || new Date().toISOString();
  return {
    id: event?.event_id || event?.eventId || event?.id || crypto.randomUUID(),
    type,
    createdAt,
    date: new Date(createdAt),
    provider,
    model,
    cents,
    usd,
    credits,
    estimated: estimatedCredits !== null && estimatedCredits !== undefined,
    params
  };
}

async function fetchPagedEvents(route, request = requestCloudJson) {
  const limit = 100;
  const firstPage = await request(route, { page: 1, limit });
  const totalPages = num(firstPage?.totalPages ?? firstPage?.total_pages, 1);
  const events = [...(firstPage?.events || [])];
  for (let start = 2; start <= totalPages; start += 8) {
    const size = Math.min(8, totalPages - start + 1);
    const pages = await Promise.all(
      Array.from({ length: size }, (_, offset) => request(route, { page: start + offset, limit }))
    );
    pages.forEach((page) => events.push(...(page?.events || [])));
  }
  return events;
}

async function fetchPersonalData() {
  const [balance, events] = await Promise.all([
    requestCloudJson("/customers/balance"),
    fetchPagedEvents("/customers/events", requestCloudJson)
  ]);
  return { mode: "personal", balance, events };
}

async function fetchWorkspaceData() {
  const [balance, events] = await Promise.all([
    requestJson("/billing/balance"),
    fetchPagedEvents("/billing/events", requestJson)
  ]);
  return { mode: "workspace", balance, events };
}

async function fetchDataSet() {
  let personalError;
  try {
    return await fetchPersonalData();
  } catch (error) {
    personalError = error;
  }
  try {
    return await fetchWorkspaceData();
  } catch (workspaceError) {
    throw workspaceError?.status ? workspaceError : personalError;
  }
}

function notify() {
  for (const listener of state.listeners) listener();
}

export function subscribe(listener) {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function windowLabel(windowKey) {
  if (windowKey === "custom") return `Last ${state.customWindowDays} days`;
  return WINDOW_LABELS[windowKey] || WINDOW_LABELS.all;
}

export function topbarStatus() {
  if (!hasCloudAuth()) return "Sign in to Comfy in Settings > User.";
  if (state.loading) return "Refreshing credits...";
  if (state.error) return state.error;
  if (state.lastUpdated) return `Updated ${state.lastUpdated.toLocaleTimeString()}`;
  return "Waiting for first sync";
}

function setStoredValue(key, value) {
  localStorage.setItem(key, String(value));
}

export function updateWindow(windowKey) {
  state.selectedWindow = windowKey === "custom" ? "custom" : WINDOW_LABELS[windowKey] ? windowKey : "all";
  state.ledgerPage = 1;
  setStoredValue(WINDOW_KEY, state.selectedWindow);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateCustomWindowDays(days) {
  state.customWindowDays = clampCustomWindowDays(days);
  state.selectedWindow = "custom";
  state.ledgerPage = 1;
  setStoredValue(CUSTOM_WINDOW_DAYS_KEY, state.customWindowDays);
  setStoredValue(WINDOW_KEY, state.selectedWindow);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateSection(section) {
  state.selectedSection =
    section === "activity" || section === "topups" || section === "export" || section === "burn"
      ? section
      : "overview";
  state.ledgerPage = 1;
  setStoredValue(SECTION_KEY, state.selectedSection);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateProviderFilter(provider) {
  state.selectedProvider = provider || "all";
  state.selectedModel = "all";
  state.ledgerPage = 1;
  setStoredValue(PROVIDER_KEY, state.selectedProvider);
  setStoredValue(MODEL_KEY, state.selectedModel);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateModelFilter(model) {
  state.selectedModel = model || "all";
  state.ledgerPage = 1;
  setStoredValue(MODEL_KEY, state.selectedModel);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateStackedGroup(group) {
  state.selectedStackedGroup = group === "model" ? "model" : "provider";
  setStoredValue(STACKED_GROUP_KEY, state.selectedStackedGroup);
  notify();
}

export function updateLedgerPage(page) {
  state.ledgerPage = Math.max(1, Number(page) || 1);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function openPanel() {
  app.extensionManager.command.execute(`Workspace.ToggleBottomPanelTab.${PANEL_TAB_ID}`);
}

export async function refreshData(force = false) {
  if (state.refreshPromise && !force) return state.refreshPromise;
  if (!(await hasCloudAuthAsync())) {
    state.loading = false;
    state.error = "Sign in to Comfy in Settings > User.";
    notify();
    return;
  }
  state.loading = true;
  state.error = "";
  notify();
  state.refreshPromise = (async () => {
    try {
      const payload = await fetchDataSet();
      state.mode = payload.mode;
      state.balance = normalizeBalance(payload.balance);
      state.events = payload.events
        .map(normalizeEvent)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      state.usageEvents = state.events.filter((event) =>
        event.type === "api_usage_completed" || event.type === "cloud_workflow_executed"
      );
      state.creditAddedEvents = state.events.filter((event) => event.type === "credit_added");
      state.lastUpdated = new Date();
    } catch (error) {
      state.error =
        error?.status === 401 || error?.status === 403
          ? "Sign in to Comfy credits first."
          : error?.message || "Failed to load credits data.";
    } finally {
      state.loading = false;
      state.refreshPromise = null;
      notify();
    }
  })();
  return state.refreshPromise;
}
