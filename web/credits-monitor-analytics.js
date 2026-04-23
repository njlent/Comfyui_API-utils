import { fmtDate, state } from "./credits-monitor-store.js";

const LEDGER_PAGE_SIZE = 8;
const WINDOW_LABELS = {
  "1h": "Last hour",
  "24h": "Last day",
  "7d": "Last week",
  "30d": "Last month",
  all: "All time"
};

function windowCutoff(windowKey = state.selectedWindow) {
  const windows = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    custom: state.customWindowDays * 24 * 60 * 60 * 1000
  };
  return windows[windowKey] ? Date.now() - windows[windowKey] : null;
}

export function describeEvent(event) {
  if (event.type === "credit_added") return "Credits added";
  if (event.type === "account_created") return "Account created";
  if (event.type === "api_usage_completed") return `${event.provider} / ${event.model}`;
  return `${event.type.replaceAll("_", " ")} / ${event.model}`;
}

function scopedUsageEvents(windowKey = state.selectedWindow) {
  const cutoff = windowCutoff(windowKey);
  if (!cutoff) return [...state.usageEvents];
  return state.usageEvents.filter((event) => event.date.getTime() >= cutoff);
}

export function usageEventsInWindow(windowKey = state.selectedWindow) {
  return scopedUsageEvents(windowKey);
}

export function filterUsageEvents({
  windowKey = state.selectedWindow,
  provider = state.selectedProvider,
  model = state.selectedModel
} = {}) {
  return scopedUsageEvents(windowKey).filter((event) => {
    if (provider && provider !== "all" && event.provider !== provider) return false;
    if (model && model !== "all" && event.model !== model) return false;
    return true;
  });
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

function sortedOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getProviderOptions(events = usageEventsInWindow()) {
  return sortedOptions(events.map((event) => event.provider));
}

export function getModelOptions(events = usageEventsInWindow(), provider = state.selectedProvider) {
  const providerEvents =
    provider === "all" ? events : events.filter((event) => event.provider === provider);
  return sortedOptions(providerEvents.map((event) => event.model));
}

function aggregateBy(events, getKey, limit = Infinity) {
  const groups = new Map();
  events.forEach((event) => {
    const key = getKey(event);
    const current = groups.get(key) || {
      key,
      credits: 0,
      usd: 0,
      count: 0,
      provider: event.provider,
      model: event.model
    };
    current.credits += event.credits;
    current.usd += event.usd;
    current.count += 1;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => b.credits - a.credits).slice(0, limit);
}

export function aggregateModels(events, limit = 10) {
  return aggregateBy(events, (event) => `${event.provider}|||${event.model}`, limit).map((item) => ({
    provider: item.provider,
    model: item.model,
    credits: item.credits,
    usd: item.usd,
    count: item.count
  }));
}

export function aggregateProviders(events, limit = 10) {
  return aggregateBy(events, (event) => event.provider, limit).map((item) => ({
    provider: item.provider,
    credits: item.credits,
    usd: item.usd,
    count: item.count
  }));
}

function binConfig(events, windowKey = state.selectedWindow) {
  const now = Date.now();
  if (windowKey === "1h") {
    return {
      start: now - 12 * 5 * 60 * 1000,
      count: 12,
      sizeMs: 5 * 60 * 1000,
      formatter: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
    };
  }
  if (windowKey === "24h") {
    return {
      start: now - 24 * 60 * 60 * 1000,
      count: 24,
      sizeMs: 60 * 60 * 1000,
      formatter: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
    };
  }
  if (windowKey === "7d") {
    return {
      start: now - 7 * 24 * 60 * 60 * 1000,
      count: 7,
      sizeMs: 24 * 60 * 60 * 1000,
      formatter: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
    };
  }
  if (windowKey === "30d") {
    return {
      start: now - 30 * 24 * 60 * 60 * 1000,
      count: 30,
      sizeMs: 24 * 60 * 60 * 1000,
      formatter: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
    };
  }
  if (windowKey === "custom") {
    const days = state.customWindowDays;
    return {
      start: now - days * 24 * 60 * 60 * 1000,
      count: days,
      sizeMs: 24 * 60 * 60 * 1000,
      formatter: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
    };
  }
  const oldest = Math.min(...events.map((event) => event.date.getTime()), now);
  const count = 12;
  const sizeMs = Math.max(Math.ceil((now - oldest) / count), 24 * 60 * 60 * 1000);
  return {
    start: now - sizeMs * count,
    count,
    sizeMs,
    formatter: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  };
}

export function buildBins(events, windowKey = state.selectedWindow) {
  if (!events.length) return [];
  const config = binConfig(events, windowKey);
  const bins = Array.from({ length: config.count }, (_, index) => ({
    start: config.start + index * config.sizeMs,
    end: config.start + (index + 1) * config.sizeMs,
    credits: 0,
    usd: 0,
    count: 0,
    items: []
  }));
  events.forEach((event) => {
    const offset = Math.floor((event.date.getTime() - config.start) / config.sizeMs);
    if (offset >= 0 && offset < bins.length) {
      const target = bins[offset];
      target.credits += event.credits;
      target.usd += event.usd;
      target.count += 1;
      target.items.push(event);
    }
  });
  return bins.map((bin) => ({
    ...bin,
    label: config.formatter.format(bin.start)
  }));
}

export function buildStackedTimeline(events, {
  windowKey = state.selectedWindow,
  groupBy = "provider",
  topN = 5
} = {}) {
  const bins = buildBins(events, windowKey);
  if (!bins.length) return { bins: [], series: [] };
  const totals = new Map();
  events.forEach((event) => {
    const key = groupBy === "model" ? event.model : event.provider;
    totals.set(key, (totals.get(key) || 0) + event.credits);
  });

  const sortedKeys = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const primaryKeys = sortedKeys.slice(0, topN).map(([key]) => key);
  const hasOther = sortedKeys.length > topN;
  const seriesKeys = hasOther ? [...primaryKeys, "__other__"] : primaryKeys;
  const totalsByKey = new Map();

  bins.forEach((bin) => {
    const segmentMap = new Map(seriesKeys.map((key) => [key, 0]));
    bin.items.forEach((event) => {
      const originalKey = groupBy === "model" ? event.model : event.provider;
      const key = primaryKeys.includes(originalKey) ? originalKey : "__other__";
      segmentMap.set(key, (segmentMap.get(key) || 0) + event.credits);
    });
    const segments = seriesKeys
      .map((key) => ({
        key,
        label: key === "__other__" ? "Other" : key,
        value: segmentMap.get(key) || 0
      }))
      .filter((segment) => segment.value > 0);
    bin.segments = segments;
    bin.total = segments.reduce((sum, segment) => sum + segment.value, 0);
    segments.forEach((segment) => {
      totalsByKey.set(segment.key, (totalsByKey.get(segment.key) || 0) + segment.value);
    });
  });

  return {
    bins,
    series: seriesKeys
      .map((key) => ({
        key,
        label: key === "__other__" ? "Other" : key,
        total: totalsByKey.get(key) || 0
      }))
      .filter((item) => item.total > 0)
  };
}

export function buildLineTimeline(events, { windowKey = state.selectedWindow } = {}) {
  return buildBins(events, windowKey).map((bin) => ({
    label: bin.label,
    value: bin.credits,
    usd: bin.usd,
    count: bin.count,
    start: bin.start
  }));
}

function eventBalanceImpact(event) {
  if (event.type === "credit_added") return event.credits;
  if (event.type === "account_created") return 0;
  return -event.credits;
}

export function buildBalanceTimeline({
  events = state.events,
  currentBalance = state.balance?.credits ?? 0,
  windowKey = state.selectedWindow
} = {}) {
  const chronologicalEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  let balance = currentBalance;
  [...chronologicalEvents].reverse().forEach((event) => {
    balance -= eventBalanceImpact(event);
  });

  const points = chronologicalEvents.map((event) => {
    balance += eventBalanceImpact(event);
    return {
      label: fmtDate(event.createdAt),
      value: Math.max(balance, 0),
      start: event.date.getTime(),
      event
    };
  });

  if (state.lastUpdated) {
    points.push({
      label: "Now",
      value: currentBalance,
      start: state.lastUpdated.getTime(),
      event: null
    });
  }

  const cutoff = windowCutoff(windowKey);
  return cutoff ? points.filter((point) => point.start >= cutoff) : points;
}

export function paginateEvents(events, page = state.ledgerPage, pageSize = LEDGER_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    pageSize,
    total: events.length,
    items: events.slice(start, start + pageSize)
  };
}
