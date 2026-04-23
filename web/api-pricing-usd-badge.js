import { app } from "../../scripts/app.js";
import {
  showApiNodeUsdBadge,
  subscribeSettings
} from "./credits-monitor-settings.js";

const CREDITS_PER_USD = 211;
const USD_BADGE_BG = "#1A4A3A";
const USD_BADGE_FG = "#FFFFFF";
const USD_BADGE_MARKER = "__caeUsdBadge";
const CREDIT_WORD_RE = /\s*credits?/i;
const NUMBER_RE = /-?\d[\d.,]*/g;

function parseLocalizedNumber(token) {
  const clean = String(token ?? "").replace(/[^\d.,-]/g, "");
  if (!clean) return null;
  if (clean.includes(",") && clean.includes(".")) {
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");
    const normalized =
      lastComma > lastDot
        ? clean.replaceAll(".", "").replace(",", ".")
        : clean.replaceAll(",", "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const normalized =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0].replaceAll(".", "")}.${parts[1]}`
        : clean.replaceAll(",", "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatUsd(value) {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 0.01 ? 2 : 4;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits
  }).format(value);
}

function creditsTextToUsd(text) {
  const source = String(text ?? "");
  const creditMatch = source.match(CREDIT_WORD_RE);
  if (!creditMatch || creditMatch.index === undefined) return null;

  const prefix = source.slice(0, creditMatch.index);
  const suffix = source.slice(creditMatch.index + creditMatch[0].length);
  let replaced = false;

  const convertedPrefix = prefix.replace(NUMBER_RE, (token) => {
    const credits = parseLocalizedNumber(token);
    if (credits === null) return token;
    replaced = true;
    return formatUsd(credits / CREDITS_PER_USD);
  });

  if (!replaced) return null;
  return `${convertedPrefix}${suffix}`
    .replace(/\s+([/])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cloneBadge(badge) {
  const proto = badge ? Object.getPrototypeOf(badge) : Object.prototype;
  const clone = Object.create(proto);
  return Object.assign(clone, badge);
}

function createHiddenBadge(sourceBadge) {
  const badge = cloneBadge(sourceBadge);
  badge.text = "";
  badge.icon = null;
  badge.bgColor = "transparent";
  badge.fgColor = "transparent";
  return badge;
}

function resolveCreditBadge(node, selfBadgeFn) {
  for (const badgeFn of node.badges || []) {
    if (typeof badgeFn !== "function" || badgeFn === selfBadgeFn || badgeFn[USD_BADGE_MARKER]) continue;
    let badge = null;
    try {
      badge = badgeFn.call(node);
    } catch {
      continue;
    }
    if (badge?.text && /credits?/i.test(badge.text)) return badge;
  }
  return null;
}

function createUsdBadge(node, selfBadgeFn) {
  try {
    const creditBadge = resolveCreditBadge(node, selfBadgeFn);
    if (!creditBadge?.text) return null;
    if (!showApiNodeUsdBadge()) return createHiddenBadge(creditBadge);

    const usdText = creditsTextToUsd(creditBadge.text);
    if (!usdText) return createHiddenBadge(creditBadge);

    const badge = cloneBadge(creditBadge);
    badge.text = usdText;
    badge.bgColor = USD_BADGE_BG;
    badge.fgColor = USD_BADGE_FG;
    badge.icon = null;
    badge.yOffset = creditBadge.yOffset || 0;
    return badge;
  } catch {
    return null;
  }
}

function redrawCanvas() {
  app.canvas?.setDirty?.(true, true);
}

function getNodeData(node) {
  return node?.constructor?.nodeData || node?.comfyClass && window.LiteGraph?.registered_node_types?.[node.comfyClass]?.nodeData || null;
}

function removeUsdBadge(node) {
  if (!Array.isArray(node?.badges)) return;
  node.badges = node.badges.filter((badgeFn) => !badgeFn?.[USD_BADGE_MARKER]);
}

function attachUsdBadge(node, nodeData) {
  if (!showApiNodeUsdBadge() || !nodeData?.api_node || !nodeData?.price_badge || !Array.isArray(node.badges)) return;
  if (node.badges.some((badgeFn) => badgeFn?.[USD_BADGE_MARKER])) return;

  const usdBadgeFn = () => createUsdBadge(node, usdBadgeFn);
  usdBadgeFn[USD_BADGE_MARKER] = true;
  node.badges.push(usdBadgeFn);
}

function syncUsdBadge(node, nodeData = getNodeData(node)) {
  removeUsdBadge(node);
  attachUsdBadge(node, nodeData);
}

function syncAllUsdBadges() {
  for (const node of app.graph?._nodes || []) {
    syncUsdBadge(node);
  }
}

subscribeSettings(() => {
  syncAllUsdBadges();
  redrawCanvas();
});

app.registerExtension({
  name: "Comfy.ApiUtils.ApiNodeUsdBadge",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (!nodeData?.api_node || !nodeData?.price_badge) return;

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function(...args) {
      const result = onNodeCreated?.apply(this, args);
      window.requestAnimationFrame(() => syncUsdBadge(this, nodeData));
      return result;
    };
  },
  async loadedGraphNode(node, nodeData) {
    syncUsdBadge(node, nodeData);
  }
});
