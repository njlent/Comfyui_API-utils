import { app } from "../../scripts/app.js";

export const SETTING_IDS = {
  showCreditsWidget: "Comfy.ApiUtils.ShowCreditsWidget",
  showApiNodeUsdBadge: "Comfy.ApiUtils.ShowApiNodeUsdBadge",
  showCreditsWidgetRefreshButton: "Comfy.ApiUtils.ShowCreditsWidgetRefreshButton"
};

const defaults = {
  showCreditsWidget: true,
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
    SETTING_IDS.showCreditsWidget,
    "Enable credits widget",
    "showCreditsWidget",
    ["ComfyUI_API-utils", "Credits Widget", "enabled"]
  );
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

export function showCreditsWidget() {
  return Boolean(app.ui.settings.getSettingValue(SETTING_IDS.showCreditsWidget));
}

export function showApiNodeUsdBadge() {
  return Boolean(app.ui.settings.getSettingValue(SETTING_IDS.showApiNodeUsdBadge));
}

export function showCreditsWidgetRefreshButton() {
  return Boolean(app.ui.settings.getSettingValue(SETTING_IDS.showCreditsWidgetRefreshButton));
}

registerSettings();
