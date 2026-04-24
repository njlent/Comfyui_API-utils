import { app } from "../../scripts/app.js";
import { fmtCredits, fmtUsd } from "./credits-monitor-store.js";
import { COMFY_PRICING_SOURCE } from "./credits-monitor-pricing-data.js";
import {
  currentSettings,
  showRunCostEstimate,
  subscribeSettings
} from "./credits-monitor-settings.js";

const EXTENSION_CSS_URL = new URL("./credits-monitor.css", import.meta.url).toString();
const NUMBER_RE = /-?\d[\d.,]*/g;
const CREDIT_WORD_RE = /\bcredits?\b/i;
const UPDATE_MS = 1200;
const HIDE_DELAY_MS = 90;

const state = {
  root: null,
  queueGroup: null,
  queueButton: null,
  hovering: false,
  hideHandle: 0,
  updateHandle: 0,
  observer: null,
  lastBatchCount: 1,
  setupDone: false
};

function ensureStyles() {
  if (document.querySelector(`link[href="${EXTENSION_CSS_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = EXTENSION_CSS_URL;
  document.head.appendChild(link);
}

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

function numbersBeforeCredits(text) {
  const source = String(text ?? "");
  const match = source.match(CREDIT_WORD_RE);
  if (!match || match.index === undefined) return null;
  const prefix = source.slice(0, match.index);
  const tokens = prefix.match(NUMBER_RE) || source.match(NUMBER_RE) || [];
  return tokens
    .map((token) => parseLocalizedNumber(token))
    .filter((value) => value !== null && value >= 0);
}

function creditsRangeFromText(text) {
  const values = numbersBeforeCredits(text);
  if (!values?.length) return null;
  if (values.length === 1) return { min: values[0], max: values[0], ranged: false };

  const source = String(text ?? "");
  const rangeHint = /[-\u2013\u2014~]|(?:\bto\b)|(?:\bfrom\b)|(?:\brange\b)|\//i.test(source);
  const pair = rangeHint ? values.slice(-2) : [values.at(-1), values.at(-1)];
  const min = Math.min(pair[0], pair[1]);
  const max = Math.max(pair[0], pair[1]);
  return { min, max, ranged: min !== max };
}

function getNodeData(node) {
  return node?.constructor?.nodeData ||
    node?.comfyClass && window.LiteGraph?.registered_node_types?.[node.comfyClass]?.nodeData ||
    null;
}

function priceBadgeTextFromNode(node) {
  for (const badgeFn of node?.badges || []) {
    if (typeof badgeFn !== "function") continue;
    try {
      const badge = badgeFn.call(node);
      if (badge?.text && CREDIT_WORD_RE.test(badge.text)) return badge.text;
    } catch {
      continue;
    }
  }

  const priceBadge = getNodeData(node)?.price_badge;
  if (typeof priceBadge === "string" && CREDIT_WORD_RE.test(priceBadge)) return priceBadge;
  if (priceBadge?.text && CREDIT_WORD_RE.test(priceBadge.text)) return priceBadge.text;
  return "";
}

function isApiNode(node) {
  const nodeData = getNodeData(node);
  return Boolean(nodeData?.api_node || nodeData?.price_badge);
}

async function executableNodeIds() {
  if (typeof app.graphToPrompt !== "function") return null;
  try {
    const result = await app.graphToPrompt(app.graph);
    const output = result?.output || result?.prompt?.output;
    return output ? new Set(Object.keys(output).map(String)) : null;
  } catch {
    return null;
  }
}

async function estimateRunCredits() {
  const nodes = app.graph?._nodes || [];
  const outputIds = await executableNodeIds();
  let pricedNodes = 0;
  let apiNodes = 0;
  let minCredits = 0;
  let maxCredits = 0;
  let hasRange = false;

  for (const node of nodes) {
    if (!isApiNode(node)) continue;
    if (outputIds && !outputIds.has(String(node.id))) continue;
    apiNodes += 1;
    const nodeCredits = creditsRangeFromText(priceBadgeTextFromNode(node));
    if (!nodeCredits) continue;
    pricedNodes += 1;
    minCredits += nodeCredits.min;
    maxCredits += nodeCredits.max;
    hasRange ||= nodeCredits.ranged;
  }

  return { minCredits, maxCredits, hasRange, apiNodes, pricedNodes, outputFiltered: Boolean(outputIds) };
}

function findQueueGroup() {
  const button = document.querySelector('[data-testid="queue-button"]');
  const group = button?.closest(".queue-button-group") || button?.parentElement || null;
  return { button, group };
}

function batchCountFromDom() {
  const input = state.queueGroup?.querySelector(".batch-count input") ||
    document.querySelector(".queue-button-group .batch-count input");
  const parsed = Number.parseInt(input?.value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    state.lastBatchCount = parsed;
    return parsed;
  }
  return state.lastBatchCount || 1;
}

function ensureRoot() {
  if (state.root) return state.root;
  const root = document.createElement("div");
  root.className = "cae-run-estimate";
  root.addEventListener("mouseenter", () => {
    state.hovering = true;
    window.clearTimeout(state.hideHandle);
  });
  root.addEventListener("mouseleave", () => scheduleHide());
  document.body.appendChild(root);
  state.root = root;
  return root;
}

function positionRoot() {
  if (!state.root || !state.queueButton) return;
  const rect = state.queueButton.getBoundingClientRect();
  const width = Math.min(280, Math.max(220, rect.width + 118));
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2 - width / 2),
    window.innerWidth - width - 8
  );
  const aboveTop = rect.top - state.root.offsetHeight - 10;
  const top = aboveTop > 8 ? aboveTop : rect.bottom + 10;
  state.root.style.width = `${width}px`;
  state.root.style.left = `${Math.round(left)}px`;
  state.root.style.top = `${Math.round(top)}px`;
}

function renderLoading() {
  const root = ensureRoot();
  root.innerHTML = `
    <div class="cae-run-estimate-label">Estimated run cost</div>
    <div class="cae-run-estimate-value">Calculating...</div>
    <div class="cae-run-estimate-meta">Reading priced API nodes</div>
  `;
  positionRoot();
}

function renderEstimate(summary) {
  const root = ensureRoot();
  const count = batchCountFromDom();
  const minCredits = summary.minCredits * count;
  const maxCredits = summary.maxCredits * count;
  const minUsd = minCredits / COMFY_PRICING_SOURCE.creditsPerUsd;
  const maxUsd = maxCredits / COMFY_PRICING_SOURCE.creditsPerUsd;
  const hasRange = summary.hasRange || minCredits !== maxCredits;
  const creditsText = hasRange ? `${fmtCredits(minCredits)}-${fmtCredits(maxCredits)} credits` : `${fmtCredits(maxCredits)} credits`;
  const usdText = hasRange ? `${fmtUsd(minUsd)}-${fmtUsd(maxUsd)}` : fmtUsd(maxUsd);
  const countText = count > 1 ? `x ${count} queued runs` : "single run";
  const sourceText = summary.pricedNodes
    ? `${summary.pricedNodes} priced API node${summary.pricedNodes === 1 ? "" : "s"} - ${countText}`
    : summary.apiNodes
      ? `${summary.apiNodes} API node${summary.apiNodes === 1 ? "" : "s"}, no readable price`
      : "no priced API nodes in active run";

  root.classList.toggle("is-empty", maxCredits <= 0);
  root.innerHTML = `
    <div class="cae-run-estimate-label">Estimated run cost</div>
    <div class="cae-run-estimate-value">${creditsText}</div>
    <div class="cae-run-estimate-usd">${usdText}</div>
    <div class="cae-run-estimate-meta">${sourceText}</div>
  `;
  positionRoot();
}

async function updateEstimate() {
  if (!state.hovering || !showRunCostEstimate()) return;
  renderLoading();
  const summary = await estimateRunCredits();
  if (!state.hovering || !showRunCostEstimate()) return;
  renderEstimate(summary);
}

function showEstimate() {
  if (!showRunCostEstimate()) return;
  state.hovering = true;
  window.clearTimeout(state.hideHandle);
  ensureRoot().classList.add("is-visible");
  updateEstimate();
}

function hideEstimate() {
  state.hovering = false;
  state.root?.classList.remove("is-visible");
}

function scheduleHide() {
  state.hovering = false;
  window.clearTimeout(state.hideHandle);
  state.hideHandle = window.setTimeout(() => {
    const hoveringQueue = state.queueGroup?.matches(":hover");
    const hoveringRoot = state.root?.matches(":hover");
    if (!hoveringQueue && !hoveringRoot) hideEstimate();
  }, HIDE_DELAY_MS);
}

function bindQueueButton() {
  const { button, group } = findQueueGroup();
  if (!button || !group) return;
  if (group === state.queueGroup) {
    state.queueButton = button;
    return;
  }

  if (state.queueGroup) {
    state.queueGroup.removeEventListener("mouseenter", showEstimate);
    state.queueGroup.removeEventListener("mouseleave", scheduleHide);
    state.queueGroup.removeEventListener("focusin", showEstimate);
    state.queueGroup.removeEventListener("focusout", scheduleHide);
  }

  state.queueButton = button;
  state.queueGroup = group;
  group.addEventListener("mouseenter", showEstimate);
  group.addEventListener("mouseleave", scheduleHide);
  group.addEventListener("focusin", showEstimate);
  group.addEventListener("focusout", scheduleHide);
}

function hideIfDisabled(settings = currentSettings()) {
  if (settings.showRunCostEstimate) return;
  hideEstimate();
}

function startObservers() {
  if (state.observer) return;
  state.observer = new MutationObserver(() => bindQueueButton());
  state.observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("input", (event) => {
    if (event.target instanceof Element && event.target.closest(".batch-count")) {
      updateEstimate();
    }
  });
  window.addEventListener("resize", positionRoot);
  state.updateHandle = window.setInterval(() => {
    bindQueueButton();
    updateEstimate();
  }, UPDATE_MS);
}

function setupRunCostEstimate() {
  if (state.setupDone) return;
  state.setupDone = true;
  ensureStyles();
  bindQueueButton();
  startObservers();
  subscribeSettings(hideIfDisabled);
}

app.registerExtension({
  name: "Comfy.ApiUtils.RunCostEstimate",
  async setup() {
    setupRunCostEstimate();
  }
});
