const PALETTE = [
  "var(--cae-chart-1)",
  "var(--cae-chart-2)",
  "var(--cae-chart-3)",
  "var(--cae-chart-4)",
  "var(--cae-chart-5)",
  "var(--cae-chart-6)"
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPaletteMap(items) {
  return new Map(items.map((item, index) => [item.key, PALETTE[index % PALETTE.length]]));
}

function emptyState(message) {
  return `<div class="cae-empty">${esc(message)}</div>`;
}

function tooltipAttrs(title, body = "") {
  return `data-cae-tooltip-title="${esc(title)}" data-cae-tooltip-body="${esc(body)}"`;
}

function legendMarkup(items, paletteMap, valueFormatter) {
  if (!items.length) return "";
  return `
    <div class="cae-chart-legend">
      ${items
        .map(
          (item) => `
            <div class="cae-chart-legend-item">
              <span class="cae-chart-legend-swatch" style="--cae-swatch:${paletteMap.get(item.key)}"></span>
              <span class="cae-chart-legend-label">${esc(item.label)}</span>
              <span class="cae-chart-legend-value">${esc(valueFormatter(item.total ?? item.value ?? 0))}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderStackedBarChart({
  bins,
  series,
  valueFormatter,
  tooltipFormatter,
  emptyMessage = "No chart data."
}) {
  if (!bins.length || !series.length) return emptyState(emptyMessage);
  const width = 720;
  const height = 280;
  const padding = { top: 18, right: 12, bottom: 42, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxTotal = Math.max(...bins.map((bin) => bin.total || 0), 1);
  const gap = 8;
  const step = chartWidth / bins.length;
  const barWidth = Math.max(8, step - gap);
  const paletteMap = getPaletteMap(series);
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  const grid = gridValues
    .map((tick) => {
      const y = padding.top + (1 - tick) * chartHeight;
      const value = maxTotal * tick;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="cae-chart-grid-line"></line>
        <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" class="cae-chart-axis-text">${esc(valueFormatter(value))}</text>
      `;
    })
    .join("");

  const bars = bins
    .map((bin, index) => {
      const x = padding.left + index * step + (step - barWidth) / 2;
      let cursor = padding.top + chartHeight;
      const rects = bin.segments
        .map((segment) => {
          if (!segment.value) return "";
          const heightValue = (segment.value / maxTotal) * chartHeight;
          const segmentHeight = Math.max(segment.value ? heightValue : 0, 3);
          cursor -= segmentHeight;
          const body = `${bin.label} | ${valueFormatter(segment.value)}`;
          return `
            <g
              class="cae-chart-node"
              tabindex="0"
              role="img"
              aria-label="${esc(tooltipFormatter(bin, segment))}"
              ${tooltipAttrs(segment.label, body)}
            >
              <rect
                x="${x}"
                y="${cursor}"
                width="${barWidth}"
                height="${segmentHeight}"
                fill="${paletteMap.get(segment.key)}"
                class="cae-chart-segment"
              ></rect>
              <rect
                x="${x - 3}"
                y="${cursor}"
                width="${barWidth + 6}"
                height="${Math.max(segmentHeight, 12)}"
                fill="transparent"
                class="cae-chart-hitbox"
              ></rect>
              <title>${esc(tooltipFormatter(bin, segment))}</title>
            </g>
          `;
        })
        .join("");
      return `
        <g>
          ${rects}
          <text x="${x + barWidth / 2}" y="${height - 16}" text-anchor="middle" class="cae-chart-axis-text">${esc(bin.label)}</text>
        </g>
      `;
    })
    .join("");

  return `
    <div class="cae-chart-block">
      <svg viewBox="0 0 ${width} ${height}" class="cae-chart-svg" role="img" aria-label="Stacked credits chart">
        ${grid}
        ${bars}
      </svg>
      ${legendMarkup(series, paletteMap, valueFormatter)}
    </div>
  `;
}

export function renderLineChart({
  points,
  valueFormatter,
  emptyMessage = "No line data.",
  label = "Usage"
}) {
  if (!points.length || points.every((point) => point.value <= 0)) return emptyState(emptyMessage);
  const width = 720;
  const height = 280;
  const padding = { top: 18, right: 12, bottom: 42, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const mapped = points.map((point, index) => {
    const x = padding.left + index * stepX;
    const y = padding.top + chartHeight - (point.value / maxValue) * chartHeight;
    return { ...point, x, y };
  });

  const areaPath = [
    `M ${mapped[0].x} ${padding.top + chartHeight}`,
    ...mapped.map((point) => `L ${point.x} ${point.y}`),
    `L ${mapped[mapped.length - 1].x} ${padding.top + chartHeight}`,
    "Z"
  ].join(" ");

  const linePath = mapped
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const gridValues = [0, 0.25, 0.5, 0.75, 1];
  const grid = gridValues
    .map((tick) => {
      const y = padding.top + (1 - tick) * chartHeight;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="cae-chart-grid-line"></line>
        <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" class="cae-chart-axis-text">${esc(valueFormatter(maxValue * tick))}</text>
      `;
    })
    .join("");

  const pointsMarkup = mapped
    .map(
      (point) => `
        <g
          class="cae-chart-node"
          tabindex="0"
          role="img"
          aria-label="${esc(`${label} | ${point.label}: ${valueFormatter(point.value)}`)}"
          ${tooltipAttrs(label, `${point.label} | ${valueFormatter(point.value)}`)}
        >
          <line x1="${point.x}" y1="${point.y}" x2="${point.x}" y2="${padding.top + chartHeight}" class="cae-line-guide"></line>
          <circle cx="${point.x}" cy="${point.y}" r="4.5" class="cae-line-point"></circle>
          <circle cx="${point.x}" cy="${point.y}" r="12" fill="transparent" class="cae-chart-hitbox"></circle>
          <title>${esc(`${label} | ${point.label}: ${valueFormatter(point.value)}`)}</title>
        </g>
      `
    )
    .join("");

  const labels = mapped
    .map(
      (point, index) => `
        <text
          x="${point.x}"
          y="${height - 16}"
          text-anchor="middle"
          class="cae-chart-axis-text ${index % Math.ceil(points.length / 8 || 1) !== 0 ? "is-dim" : ""}"
        >${esc(point.label)}</text>
      `
    )
    .join("");

  return `
    <div class="cae-chart-block">
      <svg viewBox="0 0 ${width} ${height}" class="cae-chart-svg" role="img" aria-label="${esc(label)} line chart">
        ${grid}
        <path d="${areaPath}" class="cae-line-area"></path>
        <path d="${linePath}" class="cae-line-stroke"></path>
        ${pointsMarkup}
        ${labels}
      </svg>
    </div>
  `;
}

export function renderDonutChart({
  items,
  valueFormatter,
  centerLabel,
  centerValue,
  centerSubvalue,
  compactCenter = false,
  emptyMessage = "No breakdown data."
}) {
  const filtered = items.filter((item) => item.value > 0);
  if (!filtered.length) return emptyState(emptyMessage);
  const paletteMap = getPaletteMap(filtered);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const hasLabel = Boolean(centerLabel);
  const hasSubvalue = Boolean(centerSubvalue);
  const centerLabelY = hasSubvalue ? 68 : 72;
  const centerValueY = hasLabel ? (hasSubvalue ? 91 : 98) : hasSubvalue ? 86 : 96;
  const centerSubvalueY = hasSubvalue ? (hasLabel ? 109 : 103) : 0;
  let offset = 0;
  const slices = filtered
    .map((item) => {
      const ratio = item.value / total;
      const dash = ratio * circumference;
      const body = `${valueFormatter(item.value)} | ${(ratio * 100).toFixed(1)}% share`;
      const node = `
        <g
          class="cae-chart-node"
          tabindex="0"
          role="img"
          aria-label="${esc(`${item.label}: ${valueFormatter(item.value)}`)}"
          ${tooltipAttrs(item.label, body)}
        >
          <circle
            cx="90"
            cy="90"
            r="${radius}"
            fill="none"
            stroke="${paletteMap.get(item.key)}"
            stroke-width="20"
            stroke-linecap="butt"
            stroke-dasharray="${dash} ${circumference - dash}"
            stroke-dashoffset="${-offset}"
            transform="rotate(-90 90 90)"
            class="cae-donut-slice"
          ></circle>
          <circle
            cx="90"
            cy="90"
            r="${radius}"
            fill="none"
            stroke="transparent"
            stroke-width="30"
            stroke-linecap="butt"
            stroke-dasharray="${dash} ${circumference - dash}"
            stroke-dashoffset="${-offset}"
            transform="rotate(-90 90 90)"
            class="cae-chart-hitbox"
          ></circle>
          <title>${esc(`${item.label}: ${valueFormatter(item.value)}`)}</title>
        </g>
      `;
      offset += dash;
      return node;
    })
    .join("");

  return `
    <div class="cae-donut-wrap">
      <svg viewBox="0 0 180 180" class="cae-donut-svg" role="img" aria-label="Credits share chart">
        <circle cx="90" cy="90" r="${radius}" fill="none" class="cae-donut-track" stroke-width="20"></circle>
        ${slices}
        ${
          hasLabel
            ? `<text x="90" y="${centerLabelY}" text-anchor="middle" class="cae-donut-center-label">${esc(centerLabel)}</text>`
            : ""
        }
        <text
          x="90"
          y="${centerValueY}"
          text-anchor="middle"
          class="cae-donut-center-value ${compactCenter ? "is-compact" : ""}"
        >${esc(centerValue)}</text>
        ${
          hasSubvalue
            ? `<text x="90" y="${centerSubvalueY}" text-anchor="middle" class="cae-donut-center-subvalue">${esc(centerSubvalue)}</text>`
            : ""
        }
      </svg>
      ${legendMarkup(filtered, paletteMap, valueFormatter)}
    </div>
  `;
}
