// Shared aggregation helpers used across all report pages.

function countBy(rows, key) {
  const out = {};
  rows.forEach(r => { out[r[key]] = (out[r[key]] || 0) + 1; });
  return out;
}

function sortEntries(obj, desc = true) {
  return Object.entries(obj).sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);
}

function meanBy(rows, groupKey, valueKey) {
  const sums = {}, counts = {};
  rows.forEach(r => {
    const g = r[groupKey];
    sums[g] = (sums[g] || 0) + r[valueKey];
    counts[g] = (counts[g] || 0) + 1;
  });
  const out = {};
  Object.keys(sums).forEach(g => out[g] = sums[g] / counts[g]);
  return out;
}

function mean(rows, key) {
  return rows.reduce((s, r) => s + r[key], 0) / rows.length;
}

function crosstab(rows, rowKey, colKey) {
  const rowVals = [...new Set(rows.map(r => r[rowKey]))];
  const colVals = [...new Set(rows.map(r => r[colKey]))];
  const table = {};
  rowVals.forEach(rv => {
    table[rv] = {};
    colVals.forEach(cv => { table[rv][cv] = 0; });
  });
  rows.forEach(r => { table[r[rowKey]][r[colKey]]++; });
  return { rowVals, colVals, table };
}

function bin(rows, key, edges, labels) {
  const counts = labels.reduce((o, l) => (o[l] = 0, o), {});
  rows.forEach(r => {
    const v = r[key];
    for (let i = 0; i < edges.length - 1; i++) {
      if (v > edges[i] && v <= edges[i + 1]) { counts[labels[i]]++; break; }
    }
  });
  return counts;
}

function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function pct(n, total) {
  return (100 * n / total).toFixed(0) + '%';
}
