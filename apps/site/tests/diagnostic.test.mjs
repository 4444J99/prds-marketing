import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, analyzeCSV, isoDay } from '../public/diagnostic.mjs';

test('BOM, CRLF, quoted commas, escaped quotes, and quoted newlines', () => {
  assert.deepEqual(parseCSV('\uFEFFname,note\r\n"A, B","one\r\ntwo"\r\nC,"he said ""yes"""\r\n'), {
    headers: ['name', 'note'], rows: [['A, B', 'one\r\ntwo'], ['C', 'he said "yes"']]
  });
});
test('only physically blank lines are skipped', () => {
  assert.deepEqual(parseCSV('\nname,note\n\n,\n'), { headers: ['name', 'note'], rows: [['', '']] });
  assert.deepEqual(parseCSV('one\n""\n'), { headers: ['one'], rows: [['']] });
});
test('duplicates are trimmed full rows, not names or case-folded entities', () => {
  const r = analyzeCSV('name,phone\nAlpha,123\n Alpha ,123 \nAlpha,456\nalpha,123', { asOf: '2026-09-24' });
  assert.equal(r.duplicateRows, 1); assert.equal(r.distinctNormalizedRows, 3); assert.equal(r.paddedCells, 2);
});
test('missing values and formula-like markers are aggregate only', () => {
  const r = analyzeCSV('name,phone\n=bad, \nAlice,+123\nBob,', { asOf: '2026-09-24' });
  assert.equal(r.formulaLikeCells, 2); assert.equal(r.missing[1].count, 2);
  assert.equal(JSON.stringify(r).includes('Alice'), false); assert.equal(JSON.stringify(r).includes('+123'), false);
});
const invalid = [
  ['', /empty/], ['\uFEFF', /empty/], ['name\n', /at least/], [',phone\nA,1', /non-empty/], ['a,A\n1,2', /unique/],
  ['name\na"b', /quote/], ['name\n"a"x', /unexpected/], ['name\n"a', /not closed/], ['a,b\n1', /expected 2/],
  ['a,b\n1,2,3', /expected 2/], ['name\na\0b', /control/], ['a\n' + 'x'.repeat(10001), /10,000 characters/],
  ['a\n' + 'x'.repeat(2 * 1024 * 1024), /2 MiB/],
  [Array.from({ length: 101 }, (_, i) => `h${i}`).join(',') + '\n1', /100 columns/],
  ['a\n' + 'x\n'.repeat(10001), /10,000 data rows/]
];
for (const [input, pattern] of invalid) test(`rejects malformed/oversized input: ${pattern}`, () => assert.throws(() => parseCSV(input), pattern));
test('non-string input rejected', () => assert.throws(() => parseCSV(null), TypeError));
test('exact 10,000 row boundary accepted', () => assert.equal(parseCSV('a\n' + 'x\n'.repeat(10000)).rows.length, 10000));
test('calendar validation rejects rollovers, locale dates and timezone suffixes', () => {
  for (const date of ['2026-02-29', '2024-02-30', '09/24/2026', '2026-9-24', '2026-09-24T00:00:00Z', '', null]) assert.equal(isoDay(date), null);
  assert.notEqual(isoDay('2024-02-29'), null);
});
test('age bins are inclusive and retain invalid/future/missing denominators', () => {
  const r = analyzeCSV('name,event\nA,2026-09-24\nB,2026-08-25\nC,2026-08-24\nD,2026-06-26\nE,2026-06-25\nF,2026-09-25\nG,\nH,2026-02-30', { asOf: '2026-09-24', dateColumn: 'event' });
  assert.deepEqual(r.dates, { column: 'event', asOf: '2026-09-24', missing: 1, invalid: 1, future: 1, days0to30: 2, days31to90: 2, over90: 1 });
});
test('dates are opt-in; invalid column or reference rejected', () => {
  assert.equal(analyzeCSV('a\n2026-09-24').dates, null);
  assert.throws(() => analyzeCSV('a\nx', { dateColumn: 'missing' }), /exists/);
  assert.throws(() => analyzeCSV('a\nx', { asOf: 'bad' }), /reference date/);
});
test('JSON row keys avoid delimiter collisions', () => {
  const r = analyzeCSV('a,b\n"a,b",c\na,"b,c"'); assert.equal(r.duplicateRows, 0);
});
test('HTML-looking values remain plain data', () => {
  const row = parseCSV('name\n<script>alert(1)</script>').rows[0][0]; assert.equal(row, '<script>alert(1)</script>');
});
test('deterministic quoted serializer/parser round trip across 120 cases', () => {
  let seed = 73; const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0);
  const alphabet = ['a', 'b', ',', '"', '\n', '\r', ' ', 'é', '☃'];
  const serialize = rows => rows.map(row => row.map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\r\n');
  for (let trial = 0; trial < 120; trial++) {
    const rows = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => Array.from({ length: random() % 16 }, () => alphabet[random() % alphabet.length]).join('')));
    assert.deepEqual(parseCSV(serialize([['a', 'b', 'c'], ...rows])).rows, rows);
  }
});
