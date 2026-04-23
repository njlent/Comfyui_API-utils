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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPaletteMap(items) {
  return new Map(items.map((item, index) => [item.key, PALETTE[index % PALETTE.length]]));
}

function emptyState(message) {
  return `<div class="cae-empty">${esc(message)}</div>`;
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
          const heightValue = (segment.value / maxTotal) * chartHeight;
          const segmentHeight = Math.max(segment.value ? heightValue : 0, segment.value ? 3 : 0);
          cursor -= segmentHeight;
          return `
            <rect
              x="${x}"
              y="${cursor}"
              width="${barWidth}"
              height="${segmentHeight}"
              fill="${paletteMap.get(segment.key)}"
            >
              <title>${esc(tooltipFormatter(bin, segment))}</title>
            </rect>
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
        <g>
          <circle cx="${point.x}" cy="${point.y}" r="4.5" class="cae-line-point"></circle>
          <title>${esc(`${label} · ${point.label}: ${valueFormatter(point.value)}`)}</title>
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
  emptyMessage = "No breakdown data."
}) {
  const filtered = items.filter((item) => item.value > 0);
  if (!filtered.length) return emptyState(emptyMessage);
  const paletteMap = getPaletteMap(filtered);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const slices = filtered
    .map((item) => {
      const ratio = item.value / total;
      const dash = ratio * circumference;
      const node = `
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
        >
          <title>${esc(`${item.label}: ${valueFormatter(item.value)}`)}</title>
        </circle>
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
        <text x="90" y="82" text-anchor="middle" class="cae-donut-center-label">${esc(centerLabel)}</text>
        <text x="90" y="106" text-anchor="middle" class="cae-donut-center-value">${esc(centerValue)}</text>
      </svg>
      ${legendMarkup(filtered, paletteMap, valueFormatter)}
    </div>
  `;
}
