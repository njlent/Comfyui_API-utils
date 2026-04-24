import { app } from "../../scripts/app.js";

const SETTINGS_CATEGORY = "Comfyui_API-utils";

export const SETTING_IDS = {
  showCreditsWidget: "Comfy.ApiUtils.ShowCreditsWidget",
  showApiNodeUsdBadge: "Comfy.ApiUtils.ShowApiNodeUsdBadge",
  showCreditsWidgetRefreshButton: "Comfy.ApiUtils.ShowCreditsWidgetRefreshButton",
  showCreditsWidgetDollarValue: "Comfy.ApiUtils.ShowCreditsWidgetDollarValue",
  showCreditsWidgetBurnRate: "Comfy.ApiUtils.ShowCreditsWidgetBurnRate",
  showRunCostEstimate: "Comfy.ApiUtils.ShowRunCostEstimate",
  creditsWidgetPrimarySubline: "Comfy.ApiUtils.CreditsWidgetPrimarySubline",
  creditsWidgetHoverSubline: "Comfy.ApiUtils.CreditsWidgetHoverSubline",
  creditsWidgetBurnRateRange: "Comfy.ApiUtils.CreditsWidgetBurnRateRange",
  creditsWidgetBurnRateRangeUnit: "Comfy.ApiUtils.CreditsWidgetBurnRateRangeUnit",
  creditsWidgetBurnRateUnit: "Comfy.ApiUtils.CreditsWidgetBurnRateUnit",
  creditsWidgetReserveCredits: "Comfy.ApiUtils.CreditsWidgetReserveCredits"
};

const defaults = {
  showCreditsWidget: true,
  showApiNodeUsdBadge: true,
  showCreditsWidgetRefreshButton: false,
  showCreditsWidgetDollarValue: true,
  showCreditsWidgetBurnRate: false,
  showRunCostEstimate: false,
  creditsWidgetPrimarySubline: "dollar",
  creditsWidgetHoverSubline: "burn-rate",
  creditsWidgetBurnRateRange: 7,
  creditsWidgetBurnRateRangeUnit: "days",
  creditsWidgetBurnRateUnit: "day",
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
    valueKey === "showRunCostEstimate"
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
  if (valueKey === "creditsWidgetPrimarySubline" || valueKey === "creditsWidgetHoverSubline") {
    return ["dollar", "burn-rate", "top-up"].includes(value) ? value : defaults[valueKey];
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
  registerSetting({
    id: SETTING_IDS.creditsWidgetReserveCredits,
    name: "Credits widget reserve credits",
    valueKey: "creditsWidgetReserveCredits",
    category: [SETTINGS_CATEGORY, "Credits Widget", "10-reserve-credits"],
    type: "number"
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateUnit,
    name: "Credits widget burn-rate display unit",
    valueKey: "creditsWidgetBurnRateUnit",
    category: [SETTINGS_CATEGORY, "Credits Widget", "20-burn-rate-display-unit"],
    type: "combo",
    options: ["hour", "day", "week"]
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateRangeUnit,
    name: "Credits widget burn-rate range unit",
    valueKey: "creditsWidgetBurnRateRangeUnit",
    category: [SETTINGS_CATEGORY, "Credits Widget", "30-burn-rate-range-unit"],
    type: "combo",
    options: ["hours", "days", "weeks"]
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetBurnRateRange,
    name: "Credits widget burn-rate range",
    valueKey: "creditsWidgetBurnRateRange",
    category: [SETTINGS_CATEGORY, "Credits Widget", "40-burn-rate-range"],
    type: "number"
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetHoverSubline,
    name: "Credits widget hover subline",
    valueKey: "creditsWidgetHoverSubline",
    category: [SETTINGS_CATEGORY, "Credits Widget", "50-hover-subline"],
    type: "combo",
    options: ["dollar", "burn-rate", "top-up"]
  });
  registerSetting({
    id: SETTING_IDS.creditsWidgetPrimarySubline,
    name: "Credits widget subline",
    valueKey: "creditsWidgetPrimarySubline",
    category: [SETTINGS_CATEGORY, "Credits Widget", "60-subline"],
    type: "combo",
    options: ["dollar", "burn-rate", "top-up"]
  });
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetRefreshButton,
    "Show refresh button in credits widget",
    "showCreditsWidgetRefreshButton",
    [SETTINGS_CATEGORY, "Credits Widget", "70-show-refresh-button"]
  );
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidget,
    "Enable credits widget",
    "showCreditsWidget",
    [SETTINGS_CATEGORY, "Credits Widget", "80-enable-widget"]
  );
  registerBooleanSetting(
    SETTING_IDS.showApiNodeUsdBadge,
    "Toggle estimated $ price for API nodes",
    "showApiNodeUsdBadge",
    [SETTINGS_CATEGORY, "API Nodes", "show-estimated-usd-price"]
  );
  registerBooleanSetting(
    SETTING_IDS.showRunCostEstimate,
    "Show run button cost estimate",
    "showRunCostEstimate",
    [SETTINGS_CATEGORY, "Run Button", "show-cost-estimate"]
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

export function showRunCostEstimate() {
  return values.showRunCostEstimate;
}

registerSettings();
