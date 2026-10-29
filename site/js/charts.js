// Minimal dependency-free SVG chart renderers for the survey report.
// House palette - flat, muted, print-report style (no gradients, no glow).

const PALETTE = [
  '#2c4770', // navy
  '#8c3b3b', // maroon
  '#c99a2e', // mustard
  '#3f6b66', // teal
  '#a14e3c', // rust
  '#6b7d4f', // olive
  '#57708a', // slate
  '#6b4a6b', // plum
  '#7a7a72', // grey
  '#9c6b2e'  // amber
];

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

// Rough Verdana width estimate so long labels don't run off the chart edge.
function truncateLabel(label, maxWidth, fontSize = 12) {
  const charW = fontSize * 0.6;
  if (label.length * charW <= maxWidth) return label;
  const maxChars = Math.max(3, Math.floor(maxWidth / charW) - 1);
  return label.slice(0, maxChars) + '…';
}

function textEl(x, y, str, attrs) {
  const t = svgEl('text', Object.assign({ x, y }, attrs));
  t.textContent = str;
  return t;
}

function clearAndSize(container) {
  container.innerHTML = '';
  const w = container.clientWidth || 600;
  return w;
}

// ---- Horizontal bar chart: entries = [[label, value], ...] ----
function barChartH(container, entries, opts = {}) {
  const w = clearAndSize(container);
  const small = w < 420;
  const rowH = (opts.rowH || 30) - (small ? 4 : 0);
  const gap = 8;
  const labelW = Math.min(opts.labelW || 150, Math.max(64, Math.round(w * 0.34)));
  const valueW = small ? 46 : 64;
  const topPad = 10, botPad = 10;
  const h = entries.length * (rowH + gap) - gap + topPad + botPad;
  const barAreaW = w - labelW - valueW - 16;
  const max = Math.max(...entries.map(e => e[1]), 1);
  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: 'chart-svg' });

  // gridlines
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const x = labelW + f * barAreaW;
    svg.appendChild(svgEl('line', { x1: x, x2: x, y1: topPad, y2: h - botPad, class: 'gridline' }));
  });

  entries.forEach((e, i) => {
    const [label, value] = e;
    const y = topPad + i * (rowH + gap);
    const bw = (value / max) * barAreaW;
    const color = opts.color || PALETTE[i % PALETTE.length];

    const fitLabel = truncateLabel(String(label), labelW - 12, small ? 10.5 : 12);
    const lbl = textEl(labelW - 8, y + rowH / 2 + 4, fitLabel, { class: small ? 'chart-label chart-label-sm' : 'chart-label', 'text-anchor': 'end' });
    if (fitLabel !== label) lbl.appendChild((() => { const t = svgEl('title', {}); t.textContent = label; return t; })());
    svg.appendChild(lbl);

    svg.appendChild(svgEl('rect', {
      x: labelW, y, width: Math.max(bw, 1), height: rowH, fill: color, class: 'chart-bar'
    }));

    svg.appendChild(textEl(labelW + bw + 8, y + rowH / 2 + 4, opts.valueFmt ? opts.valueFmt(value) : value, { class: 'chart-value' }));
  });

  container.appendChild(svg);
}

// ---- Vertical column chart: entries = [[label, value], ...] ----
function barChartV(container, entries, opts = {}) {
  const w = clearAndSize(container);
  const small = w < 420;
  const h = opts.h || (small ? 220 : 260);
  const leftPad = small ? 34 : 44, rightPad = 10, topPad = 16, botPad = small ? 42 : 34;
  const plotW = w - leftPad - rightPad;
  const plotH = h - topPad - botPad;
  const max = Math.max(...entries.map(e => e[1]), 1);
  const niceMax = niceCeil(max);
  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: 'chart-svg' });

  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const v = niceMax * s / steps;
    const y = topPad + plotH - (v / niceMax) * plotH;
    svg.appendChild(svgEl('line', { x1: leftPad, x2: w - rightPad, y1: y, y2: y, class: 'gridline' }));
    svg.appendChild(textEl(leftPad - 8, y + 4, Math.round(v), { class: 'chart-axis', 'text-anchor': 'end' }));
  }
  svg.appendChild(svgEl('line', { x1: leftPad, x2: leftPad, y1: topPad, y2: topPad + plotH, class: 'axis-line' }));
  svg.appendChild(svgEl('line', { x1: leftPad, x2: w - rightPad, y1: topPad + plotH, y2: topPad + plotH, class: 'axis-line' }));

  const bandW = plotW / entries.length;
  const barW = Math.min(bandW * 0.55, 56);
  const tightLabels = small && bandW < 70;

  entries.forEach((e, i) => {
    const [label, value] = e;
    const bh = (value / niceMax) * plotH;
    const x = leftPad + bandW * i + (bandW - barW) / 2;
    const y = topPad + plotH - bh;
    const color = opts.color || PALETTE[i % PALETTE.length];
    svg.appendChild(svgEl('rect', { x, y, width: barW, height: bh, fill: color, class: 'chart-bar' }));
    svg.appendChild(textEl(x + barW / 2, y - 6, value, { class: small ? 'chart-value chart-value-sm' : 'chart-value', 'text-anchor': 'middle' }));
    const lx = leftPad + bandW * i + bandW / 2;
    const ly = topPad + plotH + (tightLabels ? 16 : 20);
    const labelAttrs = { class: small ? 'chart-axis chart-axis-sm' : 'chart-axis', 'text-anchor': tightLabels ? 'end' : 'middle' };
    if (tightLabels) labelAttrs.transform = `rotate(-40 ${lx} ${ly})`;
    svg.appendChild(textEl(lx, ly, label, labelAttrs));
  });

  container.appendChild(svg);
}

function niceCeil(v) {
  const mag = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const norm = v / mag;
  let n;
  if (norm <= 1) n = 1; else if (norm <= 2) n = 2; else if (norm <= 5) n = 5; else n = 10;
  return n * mag;
}

// ---- Donut chart: entries = [[label, value], ...] ----
function donutChart(container, entries, opts = {}) {
  const w = clearAndSize(container);
  const stacked = w < 380;
  const cx = stacked ? w / 2 : 110;
  const r = stacked ? Math.min(64, w * 0.24) : 78;
  const sw = stacked ? 26 : 34;
  const rowH = 22;
  const legendH = stacked ? entries.length * rowH + 16 : 0;
  const donutH = stacked ? r * 2 + 30 : (opts.h || 220);
  const h = donutH + legendH;
  const cy = stacked ? r + 16 : donutH / 2;
  const total = entries.reduce((s, e) => s + e[1], 0);
  const circ = 2 * Math.PI * r;
  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: 'chart-svg' });

  svg.appendChild(svgEl('circle', { cx, cy, r, fill: 'none', stroke: '#e4ded0', 'stroke-width': sw }));

  let offset = 0;
  entries.forEach((e, i) => {
    const [, value] = e;
    const frac = value / total;
    const dash = frac * circ;
    const color = (opts.colors && opts.colors[i]) || PALETTE[i % PALETTE.length];
    const circle = svgEl('circle', {
      cx, cy, r, fill: 'none', stroke: color, 'stroke-width': sw,
      'stroke-dasharray': `${dash} ${circ - dash}`,
      'stroke-dashoffset': -offset,
      transform: `rotate(-90 ${cx} ${cy})`
    });
    svg.appendChild(circle);
    offset += dash;
  });

  svg.appendChild(textEl(cx, cy - 3, total, { class: 'donut-total', 'text-anchor': 'middle' }));
  svg.appendChild(textEl(cx, cy + 16, opts.centerLabel || 'total', { class: 'donut-sub', 'text-anchor': 'middle' }));

  // legend: beside the donut on wide layouts, stacked below on narrow ones
  const legX = stacked ? 8 : 232;
  const legTop = stacked ? donutH + 8 : 14;
  entries.forEach((e, i) => {
    const [label, value] = e;
    const color = (opts.colors && opts.colors[i]) || PALETTE[i % PALETTE.length];
    const y = legTop + i * rowH;
    svg.appendChild(svgEl('rect', { x: legX, y: y - 10, width: 12, height: 12, fill: color }));
    svg.appendChild(textEl(legX + 18, y, `${label}`, { class: 'chart-legend' }));
    svg.appendChild(textEl(w - 14, y, `${value} (${pct(value, total)})`, { class: 'chart-legend-val', 'text-anchor': 'end' }));
  });

  container.appendChild(svg);
}

// ---- Stacked horizontal bar: rowVals x colVals from crosstab() ----
function stackedBarH(container, ct, opts = {}) {
  const w = clearAndSize(container);
  const small = w < 420;
  const rowH = (opts.rowH || 34) - (small ? 4 : 0);
  const gap = 10;
  const labelW = Math.min(opts.labelW || 130, Math.max(56, Math.round(w * 0.3)));
  const legendRows = small ? Math.ceil(ct.colVals.length / 2) : 1;
  const topPad = 14 + legendRows * 16, botPad = 6;
  const h = ct.rowVals.length * (rowH + gap) - gap + topPad + botPad;
  const barAreaW = w - labelW - 20;
  const colors = opts.colors || PALETTE;

  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: 'chart-svg' });

  // legend row(s) - wraps onto a second line on narrow screens
  let lx = labelW, ly = 10;
  const legendStartX = labelW;
  ct.colVals.forEach((cv, ci) => {
    const segW = 16 + cv.length * (small ? 5.6 : 6.6) + 18;
    if (small && lx + segW > w) { lx = legendStartX; ly += 16; }
    svg.appendChild(svgEl('rect', { x: lx, y: ly - 6, width: 11, height: 11, fill: colors[ci % colors.length] }));
    svg.appendChild(textEl(lx + 16, ly + 4, cv, { class: small ? 'chart-legend chart-legend-sm' : 'chart-legend' }));
    lx += segW;
  });

  ct.rowVals.forEach((rv, ri) => {
    const y = topPad + ri * (rowH + gap);
    const rowTotal = ct.colVals.reduce((s, cv) => s + ct.table[rv][cv], 0);
    const fitRowLabel = truncateLabel(String(rv), labelW - 12, small ? 10.5 : 12);
    const rowLbl = textEl(labelW - 8, y + rowH / 2 + 4, fitRowLabel, { class: small ? 'chart-label chart-label-sm' : 'chart-label', 'text-anchor': 'end' });
    if (fitRowLabel !== rv) rowLbl.appendChild((() => { const t = svgEl('title', {}); t.textContent = rv; return t; })());
    svg.appendChild(rowLbl);
    let x = labelW;
    ct.colVals.forEach((cv, ci) => {
      const val = ct.table[rv][cv];
      const segW = rowTotal ? (val / rowTotal) * barAreaW : 0;
      if (val > 0) {
        svg.appendChild(svgEl('rect', { x, y, width: segW, height: rowH, fill: colors[ci % colors.length] }));
        if (segW > 22) {
          svg.appendChild(textEl(x + segW / 2, y + rowH / 2 + 4, val, { class: 'chart-value-onbar', 'text-anchor': 'middle' }));
        }
      }
      x += segW;
    });
    svg.appendChild(textEl(w - 4, y + rowH / 2 + 4, rowTotal, { class: 'chart-value', 'text-anchor': 'end' }));
  });

  container.appendChild(svg);
}
