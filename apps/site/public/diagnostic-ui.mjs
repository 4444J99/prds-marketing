import { analyzeCSV, parseCSV, LIMITS } from './diagnostic.mjs';
const el = id => document.getElementById(id);
let csv = '', sequence = 0;
const file = el('csv-file'), date = el('date-column'), status = el('diagnostic-status'), result = el('diagnostic-result');
const say = text => { status.textContent = text; };
const clear = () => { sequence++; csv = ''; file.value = ''; date.replaceChildren(new Option('Do not analyze dates', '')); result.replaceChildren(); el('analyze').disabled = true; say('Cleared. No list was uploaded or saved by this tool.'); };
el('clear').addEventListener('click', clear);
file.addEventListener('change', async () => {
  const request = ++sequence; csv = ''; result.replaceChildren(); el('analyze').disabled = true;
  date.replaceChildren(new Option('Do not analyze dates', ''));
  const selected = file.files?.[0]; if (!selected) { say('Choose a CSV file.'); return; }
  if (selected.size > LIMITS.bytes) { say('The file exceeds the 2 MiB limit.'); file.value = ''; return; }
  try {
    const candidate = await selected.text(); if (request !== sequence) return;
    const { headers } = parseCSV(candidate); csv = candidate;
    for (const header of headers) date.add(new Option(header, header));
    el('analyze').disabled = false; say('File read locally. Choose an optional date column, then run the check.');
  } catch (error) { if (request === sequence) { csv = ''; file.value = ''; say(error.message); } }
});
el('analyze').addEventListener('click', () => {
  result.replaceChildren();
  try {
    const report = analyzeCSV(csv, { dateColumn: date.value || null });
    const heading = document.createElement('h2'); heading.textContent = 'Your structural review'; result.append(heading);
    const line = text => { const p = document.createElement('p'); p.textContent = text; result.append(p); };
    line(`${report.rows} data rows · ${report.columns} columns · ${report.duplicateRows} repeated full rows after trimming.`);
    line(`${report.paddedCells} cells contain surrounding spaces. ${report.formulaLikeCells} cells begin with a spreadsheet-formula marker; this is a precaution, not a malicious-content verdict.`);
    const table = document.createElement('table'); const caption = document.createElement('caption'); caption.textContent = 'Missing values by column'; table.append(caption);
    const head = table.createTHead().insertRow();
    for (const text of ['Column', 'Missing / total rows']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; head.append(th); }
    const body = table.createTBody();
    for (const item of report.missing) { const row = body.insertRow(); const th = document.createElement('th'); th.scope = 'row'; th.textContent = item.column; row.append(th); row.insertCell().textContent = `${item.count} / ${report.rows}`; }
    result.append(table);
    if (report.dates) { const d = report.dates; line(`Selected field: ${d.column}. UTC reference date: ${d.asOf}. 0–30 days: ${d.days0to30}; 31–90: ${d.days31to90}; over 90: ${d.over90}; future: ${d.future}; missing: ${d.missing}; invalid or not YYYY-MM-DD: ${d.invalid}.`); }
    for (const text of report.limitations) line(text);
    say('Check complete. Results remain in this page; no file or result was sent.');
  } catch (error) { say(error.message); }
});
window.addEventListener('pagehide', clear);
