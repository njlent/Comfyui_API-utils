import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { estimateCredits } from "./credits-monitor-pricing.js";

export const EXTENSION_NAME = "Comfy.ApiEnhance.CreditsMonitor";
export const PANEL_TAB_ID = "credits-analytics";
export const CMD_OPEN = "creditsAnalytics.open";
export const CMD_REFRESH = "creditsAnalytics.refresh";

const WINDOW_KEY = "comfy.api_enhance.window";
const SECTION_KEY = "comfy.api_enhance.section";
const PROVIDER_KEY = "comfy.api_enhance.provider";
const MODEL_KEY = "comfy.api_enhance.model";
const PAGE_KEY = "comfy.api_enhance.page";
const CREDITS_PER_USD = 211;
const CLOUD_API_ORIGIN = "https://api.comfy.org";

const WINDOW_LABELS = {
  "1h": "Last hour",
  "24h": "Last day",
  "7d": "Last week",
  "30d": "Last month",
  all: "All time"
};

function createState() {
  return {
    loading: false,
    error: "",
    mode: "personal",
    balance: null,
    events: [],
    usageEvents: [],
    lastUpdated: null,
    selectedWindow: localStorage.getItem(WINDOW_KEY) || "24h",
    selectedSection: localStorage.getItem(SECTION_KEY) || "overview",
    selectedProvider: localStorage.getItem(PROVIDER_KEY) || "all",
    selectedModel: localStorage.getItem(MODEL_KEY) || "all",
    ledgerPage: Number(localStorage.getItem(PAGE_KEY) || 1),
    listeners: new Set(),
    refreshPromise: null,
    topbarRoot: null,
    topbarRetryHandle: 0,
    autoRefreshHandle: 0,
    autoRefreshStarted: false,
    panelRoot: null,
    setupDone: false
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

export function fmtCredits(value) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2
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

function authHeaders() {
  if (api.authToken) return { Authorization: `Bearer ${api.authToken}` };
  if (api.apiKey) return { "X-API-KEY": api.apiKey };
  const stored = localStorage.getItem("comfy_api_key");
  if (stored) return { "X-API-KEY": stored };
  return {};
}

export function hasCloudAuth() {
  return Boolean(api.authToken || api.apiKey || localStorage.getItem("comfy_api_key"));
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
    headers: authHeaders(),
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
    headers: authHeaders(),
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
  const estimatedCredits = estimateCredits(event);
  const cents = num(params.cost ?? params.amount_cents ?? params.charge_cents ?? params.amount);
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
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "API");
  const model = String(params.model ?? params.model_name ?? params.engine ?? "Unknown model");
  const createdAt = event?.createdAt || event?.created_at || new Date().toISOString();
  return {
    id: event?.event_id || event?.eventId || event?.id || crypto.randomUUID(),
    type: String(event?.event_type || event?.eventType || "unknown"),
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
  state.selectedWindow = windowKey;
  state.ledgerPage = 1;
  setStoredValue(WINDOW_KEY, windowKey);
  setStoredValue(PAGE_KEY, state.ledgerPage);
  notify();
}

export function updateSection(section) {
  state.selectedSection = section;
  setStoredValue(SECTION_KEY, section);
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
  if (!hasCloudAuth()) {
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
      state.usageEvents = state.events.filter((event) => event.type === "api_usage_completed");
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
