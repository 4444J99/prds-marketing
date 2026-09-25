/** Browser-local structural CSV review. Never fetches, stores, or evaluates input. */
export const LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, rows: 10000, columns: 100, cell: 10000 });

export function parseCSV(input) {
  if (typeof input !== 'string') throw new TypeError('Choose a UTF-8 CSV text file.');
  if (new TextEncoder().encode(input).length > LIMITS.bytes) throw new Error('The file exceeds the 2 MiB limit.');
  const text = input.replace(/^\uFEFF/, '');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) throw new Error('The file contains unsupported control characters.');
  if (!text.trim()) throw new Error('The CSV is empty.');
  const table = []; let row = [], cell = '', quoted = false, closed = false, started = false;
  const finishCell = () => {
    if (cell.length > LIMITS.cell) throw new Error('A cell exceeds 10,000 characters.');
    row.push(cell); cell = ''; closed = false; started = false;
    if (row.length > LIMITS.columns) throw new Error('The file exceeds 100 columns.');
  };
  const finishRow = () => {
    finishCell();
    // Ignore physically blank lines, not rows made of delimiters or quoted empty cells.
    table.push(row); row = [];
    if (table.length > LIMITS.rows + 1) throw new Error('The file exceeds 10,000 data rows.');
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += c;
    } else if (c === ',') finishCell();
    else if (c === '\n' || c === '\r') {
      const blank = !started && !closed && cell === '' && row.length === 0;
      if (!blank) finishRow();
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else if (c === '"') {
      if (started || closed) throw new Error('Malformed CSV: quote inside an unquoted field.');
      quoted = true; started = true;
    } else {
      if (closed) throw new Error('Malformed CSV: unexpected text after a closing quote.');
      cell += c; started = true;
    }
    if (cell.length > LIMITS.cell) throw new Error('A cell exceeds 10,000 characters.');
  }
  if (quoted) throw new Error('Malformed CSV: an opening quote was not closed.');
  if (started || closed || cell.length || row.length) finishRow();
  if (!table.length) throw new Error('The CSV is empty.');
  const headers = table.shift().map(value => value.trim());
  if (headers.some(h => !h)) throw new Error('Every column needs a non-empty header.');
  if (new Set(headers.map(h => h.toLowerCase())).size !== headers.length) throw new Error('Column names must be unique (ignoring case and surrounding spaces).');
  if (!table.length) throw new Error('Include at least one data row beneath the headers.');
  for (let i = 0; i < table.length; i++) {
    if (table[i].length !== headers.length) throw new Error(`Data row ${i + 1} has ${table[i].length} cells; expected ${headers.length}.`);
  }
  return { headers, rows: table };
}

/** Strict ISO calendar date, never locale parsing or rollover (e.g. February 30). */
export function isoDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const y = Number(value.slice(0, 4));
  if (y < 1000 || y > 9999) return null;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms / 86400000 : null;
}

export function analyzeCSV(input, { dateColumn = null, asOf = new Date().toISOString().slice(0, 10) } = {}) {
  const { headers, rows } = parseCSV(input);
  const referenceDay = isoDay(asOf);
  if (referenceDay === null) throw new Error('The reference date must be a valid YYYY-MM-DD date.');
  const index = dateColumn === null || dateColumn === '' ? -1 : headers.indexOf(dateColumn);
  if (dateColumn !== null && dateColumn !== '' && index < 0) throw new Error('Choose a date column that exists in this CSV.');
  const seen = new Set(), missing = headers.map(() => 0);
  let duplicateRows = 0, paddedCells = 0, formulaLikeCells = 0;
  const dates = index < 0 ? null : { column: headers[index], asOf, missing: 0, invalid: 0, future: 0, days0to30: 0, days31to90: 0, over90: 0 };
  for (const row of rows) {
    const normalized = row.map((value, j) => {
      const trimmed = value.trim();
      if (!trimmed) missing[j]++;
      if (trimmed !== value) paddedCells++;
      if (/^[=+@-]/.test(trimmed)) formulaLikeCells++;
      return trimmed;
    });
    const key = JSON.stringify(normalized);
    if (seen.has(key)) duplicateRows++; else seen.add(key);
    if (dates) {
      const value = normalized[index], day = isoDay(value);
      if (!value) dates.missing++;
      else if (day === null) dates.invalid++;
      else if (day > referenceDay) dates.future++;
      else if (referenceDay - day <= 30) dates.days0to30++;
      else if (referenceDay - day <= 90) dates.days31to90++;
      else dates.over90++;
    }
  }
  // Only aggregate diagnostics leave this function. No contact rows or cell values.
  return { schema: 'prds.list-quality.v1', rows: rows.length, columns: headers.length,
    duplicateRows, distinctNormalizedRows: seen.size, paddedCells, formulaLikeCells,
    missing: headers.map((header, j) => ({ column: header, count: missing[j] })), dates,
    limitations: ['Duplicates mean equal full rows after trimming, not verified duplicate businesses.',
      'A populated contact field is not verified contactability or permission to contact.',
      'Date bins describe the chosen field, not source freshness or financing intent.'] };
}
