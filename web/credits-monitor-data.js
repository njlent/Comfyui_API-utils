import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { estimateCredits } from "./credits-monitor-pricing.js";

export const EXTENSION_NAME = "Comfy.ApiEnhance.CreditsMonitor";
export const PANEL_TAB_ID = "credits-analytics";
export const CMD_OPEN = "creditsAnalytics.open";
export const CMD_REFRESH = "creditsAnalytics.refresh";

const WINDOW_KEY = "comfy.api_enhance.window";
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

export const state = window.__caeCreditsMonitorState || createState();
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
  const explicitCredits =
    estimatedCredits ??
    params.credits_used ??
    params.credits ??
    null;
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

export function describeEvent(event) {
  if (event.type === "credit_added") return "Credits added";
  if (event.type === "account_created") return "Account created";
  if (event.type === "api_usage_completed") return `${event.provider} / ${event.model}`;
  return `${event.type.replaceAll("_", " ")} / ${event.model}`;
}

export function usageEventsInWindow(windowKey = state.selectedWindow) {
  const now = Date.now();
  const windows = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000
  };
  if (!windows[windowKey]) return [...state.usageEvents];
  const cutoff = now - windows[windowKey];
  return state.usageEvents.filter((event) => event.date.getTime() >= cutoff);
}

export function summarize(events) {
  const totalCredits = events.reduce((sum, event) => sum + event.credits, 0);
  const totalUsd = events.reduce((sum, event) => sum + event.usd, 0);
  const counts = new Map();
  events.forEach((event) => {
    const current = counts.get(event.model) || { credits: 0, count: 0 };
    current.credits += event.credits;
    current.count += 1;
    counts.set(event.model, current);
  });
  const topModel = [...counts.entries()].sort((a, b) => b[1].credits - a[1].credits)[0];
  return {
    totalCredits,
    totalUsd,
    runCount: events.length,
    avgCredits: events.length ? totalCredits / events.length : 0,
    avgUsd: events.length ? totalUsd / events.length : 0,
    topModel: topModel ? { name: topModel[0], ...topModel[1] } : null
  };
}

export function summariesByWindow() {
  return Object.entries(WINDOW_LABELS).map(([key, label]) => ({
    key,
    label,
    ...summarize(usageEventsInWindow(key))
  }));
}

export function aggregateModels(events) {
  const models = new Map();
  events.forEach((event) => {
    const key = `${event.provider}|||${event.model}`;
    const current = models.get(key) || {
      provider: event.provider,
      model: event.model,
      credits: 0,
      usd: 0,
      count: 0
    };
    current.credits += event.credits;
    current.usd += event.usd;
    current.count += 1;
    models.set(key, current);
  });
  return [...models.values()].sort((a, b) => b.credits - a.credits).slice(0, 10);
}

export function buildBins(events, windowKey = state.selectedWindow) {
  if (!events.length) return [];
  const now = Date.now();
  let sizeMs = 24 * 60 * 60 * 1000;
  let count = 12;
  if (windowKey === "1h") {
    sizeMs = 5 * 60 * 1000;
  } else if (windowKey === "24h") {
    sizeMs = 60 * 60 * 1000;
    count = 24;
  } else if (windowKey === "7d") {
    count = 7;
  } else if (windowKey === "30d") {
    count = 30;
  } else {
    const oldest = Math.min(...events.map((event) => event.date.getTime()));
    sizeMs = Math.max(Math.ceil((now - oldest) / 12), 24 * 60 * 60 * 1000);
  }
  const start = now - sizeMs * count;
  const bins = Array.from({ length: count }, (_, index) => ({
    start: start + index * sizeMs,
    credits: 0,
    usd: 0
  }));
  events.forEach((event) => {
    const offset = Math.floor((event.date.getTime() - start) / sizeMs);
    if (offset >= 0 && offset < bins.length) {
      bins[offset].credits += event.credits;
      bins[offset].usd += event.usd;
    }
  });
  const formatter =
    windowKey === "1h"
      ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
      : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return bins.map((bin) => ({ ...bin, label: formatter.format(bin.start) }));
}

export function recentLedger(limit = 8) {
  return state.events.slice(0, limit);
}

export function updateWindow(windowKey) {
  state.selectedWindow = windowKey;
  localStorage.setItem(WINDOW_KEY, windowKey);
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
