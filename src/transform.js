// JSON <-> CSV
function jsonToCsv(data, options = {}) {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';
  const delimiter = options.delimiter || ',';
  const headers = [...new Set(arr.flatMap((obj) => Object.keys(obj)))];
  const rows = arr.map((obj) =>
    headers.map((h) => {
      const val = obj[h] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return str.includes(delimiter) || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(delimiter)
  );
  return [headers.join(delimiter), ...rows].join('\n');
}

function csvToJson(csv, options = {}) {
  const delimiter = options.delimiter || ',';
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0], delimiter);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (inQuotes) {
      if (line[i] === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (line[i] === '"') { inQuotes = false; }
      else { current += line[i]; }
    } else {
      if (line[i] === '"') { inQuotes = true; }
      else if (line[i] === delimiter) { result.push(current); current = ''; }
      else { current += line[i]; }
    }
  }
  result.push(current);
  return result;
}

// JSON <-> XML (simple)
function jsonToXml(data, rootName = 'root') {
  function toXml(obj, name) {
    if (obj === null || obj === undefined) return `<${name}/>`;
    if (typeof obj !== 'object') return `<${name}>${escapeXml(String(obj))}</${name}>`;
    if (Array.isArray(obj)) return obj.map((item) => toXml(item, 'item')).join('');
    return `<${name}>${Object.entries(obj).map(([k, v]) => toXml(v, k)).join('')}</${name}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(data, rootName)}`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// JSON flatten/unflatten
function flatten(obj, prefix = '', result = {}) {
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, newKey, result);
    } else {
      result[newKey] = val;
    }
  }
  return result;
}

function unflatten(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = val;
  }
  return result;
}

// Filter/transform
function filterJson(data, query) {
  const arr = Array.isArray(data) ? data : [data];
  return arr.filter((item) => {
    return Object.entries(query).every(([key, val]) => {
      const itemVal = item[key];
      if (typeof val === 'string' && val.startsWith('>')) return Number(itemVal) > Number(val.slice(1));
      if (typeof val === 'string' && val.startsWith('<')) return Number(itemVal) < Number(val.slice(1));
      if (typeof val === 'string' && val.startsWith('!')) return String(itemVal) !== val.slice(1);
      return String(itemVal) === String(val);
    });
  });
}

function pickFields(data, fields) {
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((item) => {
    const result = {};
    fields.forEach((f) => { if (item[f] !== undefined) result[f] = item[f]; });
    return result;
  });
}

function sortJson(data, field, order = 'asc') {
  const arr = Array.isArray(data) ? [...data] : [data];
  return arr.sort((a, b) => {
    const va = a[field], vb = b[field];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return order === 'desc' ? -cmp : cmp;
  });
}

// Stats
function stats(data, field) {
  const arr = Array.isArray(data) ? data : [data];
  const values = arr.map((i) => Number(i[field])).filter((v) => !isNaN(v));
  if (values.length === 0) return { count: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    sum: round(sum),
    mean: round(sum / values.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: round(sorted[Math.floor(sorted.length / 2)]),
  };
}

function round(v) { return Math.round(v * 100) / 100; }

// Validate JSON
function validate(str) {
  try {
    const data = JSON.parse(str);
    return { valid: true, type: Array.isArray(data) ? 'array' : typeof data, size: JSON.stringify(data).length };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

module.exports = {
  jsonToCsv, csvToJson, jsonToXml, flatten, unflatten,
  filterJson, pickFields, sortJson, stats, validate,
};
