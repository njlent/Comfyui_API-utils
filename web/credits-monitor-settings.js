import { app } from "../../scripts/app.js";

export const SETTING_IDS = {
  showCreditsWidget: "Comfy.ApiUtils.ShowCreditsWidget",
  showApiNodeUsdBadge: "Comfy.ApiUtils.ShowApiNodeUsdBadge",
  showCreditsWidgetRefreshButton: "Comfy.ApiUtils.ShowCreditsWidgetRefreshButton",
  showCreditsWidgetDollarValue: "Comfy.ApiUtils.ShowCreditsWidgetDollarValue",
  showCreditsWidgetBurnRate: "Comfy.ApiUtils.ShowCreditsWidgetBurnRate",
  creditsWidgetBurnRateRange: "Comfy.ApiUtils.CreditsWidgetBurnRateRange",
  creditsWidgetBurnRateRangeUnit: "Comfy.ApiUtils.CreditsWidgetBurnRateRangeUnit",
  creditsWidgetBurnRateUnit: "Comfy.ApiUtils.CreditsWidgetBurnRateUnit",
  showCreditsWidgetTopUpEta: "Comfy.ApiUtils.ShowCreditsWidgetTopUpEta",
  creditsWidgetReserveCredits: "Comfy.ApiUtils.CreditsWidgetReserveCredits"
};

const defaults = {
  showCreditsWidget: true,
  showApiNodeUsdBadge: true,
  showCreditsWidgetRefreshButton: false,
  showCreditsWidgetDollarValue: true,
  showCreditsWidgetBurnRate: false,
  creditsWidgetBurnRateRange: 7,
  creditsWidgetBurnRateRangeUnit: "days",
  creditsWidgetBurnRateUnit: "day",
  showCreditsWidgetTopUpEta: false,
  creditsWidgetReserveCredits: 0
};

const values = { ...defaults };
const listeners = new Set();
let registered = false;

function notifySettingsChanged() {
  for (const listener of listeners) listener({ ...values });
}

function normalizeValue(valueKey, value) {
  if (
    valueKey === "showCreditsWidget" ||
    valueKey === "showApiNodeUsdBadge" ||
    valueKey === "showCreditsWidgetRefreshButton" ||
    valueKey === "showCreditsWidgetDollarValue" ||
    valueKey === "showCreditsWidgetBurnRate" ||
    valueKey === "showCreditsWidgetTopUpEta"
  ) {
    return Boolean(value);
  }
  if (valueKey === "creditsWidgetBurnRateRange") {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 3650) : defaults[valueKey];
  }
  if (valueKey === "creditsWidgetReserveCredits") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : defaults[valueKey];
  }
  if (valueKey === "creditsWidgetBurnRateRangeUnit") {
    return ["hours", "days", "weeks"].includes(value) ? value : defaults[valueKey];
  }
  if (valueKey === "creditsWidgetBurnRateUnit") {
    return ["hour", "day", "week"].includes(value) ? value : defaults[valueKey];
  }
  return value ?? defaults[valueKey];
}

function registerSetting({ id, name, valueKey, category, type, options }) {
  const handle = app.ui.settings.addSetting({
    id,
    name,
    type,
    defaultValue: defaults[valueKey],
    category,
    options,
    onChange: (value) => {
      values[valueKey] = normalizeValue(valueKey, value);
      notifySettingsChanged();
    }
  });
  values[valueKey] = normalizeValue(valueKey, handle.value);
}

function registerBooleanSetting(id, name, valueKey, category) {
  registerSetting({ id, name, valueKey, category, type: "boolean" });
}

export function registerSettings() {
  if (registered) return;
  registered = true;
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidget,
    "Enable credits widget",
    "showCreditsWidget",
    ["ComfyUI_API-utils", "Credits Widget", "00-enable-widget"]
  );
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetRefreshButton,
    "Show refresh button in credits widget",
    "showCreditsWidgetRefreshButton",
    ["ComfyUI_API-utils", "Credits Widget", "show-refresh-button"]
  );
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetDollarValue,
    "Show $ value in credits widget",
    "showCreditsWidgetDollarValue",
    ["ComfyUI_API-utils", "Credits Widget", "show-dollar-value"]
  );
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetBurnRate,
    "Show burn rate in credits widget",
    "showCreditsWidgetBurnRate",
    ["ComfyUI_API-utils", "Credits Widget", "show-burn-rate"]
  );
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateRange,
    name: "Credits widget burn-rate range",
    valueKey: "creditsWidgetBurnRateRange",
    category: ["ComfyUI_API-utils", "Credits Widget", "burn-rate-range"],
    type: "number"
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateRangeUnit,
    name: "Credits widget burn-rate range unit",
    valueKey: "creditsWidgetBurnRateRangeUnit",
    category: ["ComfyUI_API-utils", "Credits Widget", "burn-rate-range-unit"],
    type: "combo",
    options: ["hours", "days", "weeks"]
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateUnit,
    name: "Credits widget burn-rate display unit",
    valueKey: "creditsWidgetBurnRateUnit",
    category: ["ComfyUI_API-utils", "Credits Widget", "burn-rate-display-unit"],
    type: "combo",
    options: ["hour", "day", "week"]
  });
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetTopUpEta,
    "Show top-up estimate in credits widget",
    "showCreditsWidgetTopUpEta",
    ["ComfyUI_API-utils", "Credits Widget", "show-top-up-estimate"]
  );
  registerSetting({
    id: SETTING_IDS.creditsWidgetReserveCredits,
    name: "Credits widget reserve credits",
    valueKey: "creditsWidgetReserveCredits",
    category: ["ComfyUI_API-utils", "Credits Widget", "reserve-credits"],
    type: "number"
  });
  registerBooleanSetting(
    SETTING_IDS.showApiNodeUsdBadge,
    "Toggle estimated $ price for API nodes",
    "showApiNodeUsdBadge",
    ["ComfyUI_API-utils", "API Nodes", "show-estimated-usd-price"]
  );
}

export function subscribeSettings(listener) {
  listeners.add(listener);
  listener({ ...values });
  return () => listeners.delete(listener);
}

export function currentSettings() {
  return { ...values };
}

export function updateSettings(patch) {
  let changed = false;
  Object.entries(patch).forEach(([key, value]) => {
    if (!(key in defaults)) return;
    const normalized = normalizeValue(key, value);
    if (values[key] === normalized) return;
    values[key] = normalized;
    changed = true;
    app.ui.settings.setSettingValue?.(SETTING_IDS[key], normalized);
  });
  if (changed) notifySettingsChanged();
}

export function showCreditsWidget() {
  return values.showCreditsWidget;
}

export function showApiNodeUsdBadge() {
  return values.showApiNodeUsdBadge;
}

export function showCreditsWidgetRefreshButton() {
  return values.showCreditsWidgetRefreshButton;
}

registerSettings();
