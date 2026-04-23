import { app } from "../../scripts/app.js";

export const SETTING_IDS = {
  showApiNodeUsdBadge: "Comfy.ApiUtils.ShowApiNodeUsdBadge",
  showCreditsWidgetRefreshButton: "Comfy.ApiUtils.ShowCreditsWidgetRefreshButton"
};

const defaults = {
  showApiNodeUsdBadge: true,
  showCreditsWidgetRefreshButton: false
};

const values = { ...defaults };
const listeners = new Set();
let registered = false;

function notifySettingsChanged() {
  for (const listener of listeners) listener({ ...values });
}

function registerBooleanSetting(id, name, valueKey, category) {
  const handle = app.ui.settings.addSetting({
    id,
    name,
    type: "boolean",
    defaultValue: defaults[valueKey],
    category,
    onChange: (value) => {
      values[valueKey] = Boolean(value);
      notifySettingsChanged();
    }
  });
  values[valueKey] = Boolean(handle.value);
}

export function registerSettings() {
  if (registered) return;
  registered = true;
  registerBooleanSetting(
    SETTING_IDS.showApiNodeUsdBadge,
    "Toggle estimated $ price for API nodes",
    "showApiNodeUsdBadge",
    ["ComfyUI_API-utils", "API Nodes", "show-estimated-usd-price"]
  );
  registerBooleanSetting(
    SETTING_IDS.showCreditsWidgetRefreshButton,
    "Show refresh button in credits widget",
    "showCreditsWidgetRefreshButton",
    ["ComfyUI_API-utils", "Credits Widget", "show-refresh-button"]
  );
}

export function subscribeSettings(listener) {
  listeners.add(listener);
  listener({ ...values });
  return () => listeners.delete(listener);
}

export function showApiNodeUsdBadge() {
  return values.showApiNodeUsdBadge;
}

export function showCreditsWidgetRefreshButton() {
  return values.showCreditsWidgetRefreshButton;
}

registerSettings();
