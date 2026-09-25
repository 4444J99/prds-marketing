import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { pages, renderDocument, publication, canonicalOrigin, escapeHTML } from '../site.mjs';
const routes = new Set(pages.map(p => p.path));
test('route identities unique and page metadata not copied placeholders', () => {
  assert.equal(routes.size, pages.length); assert.equal(new Set(pages.map(p => p.title)).size, pages.length);
  assert.equal(new Set(pages.map(p => p.description)).size, pages.length);
});
for (const page of pages) test(`page structure, local links, claims and privacy: ${page.path}`, () => {
  const html = renderDocument(page);
  assert.equal((html.match(/<main\b/g) || []).length, 1); assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<html lang="en">/); assert.match(html, /name="viewport"/); assert.match(html, /noindex,nofollow/);
  assert.doesNotMatch(html, /4 State Collectors Live|ready to close|Start Free Trial|Compliance Built-In|From Filing to Funded|fonts.googleapis|cdn.tailwindcss/);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith('#')) { assert.ok(html.includes(`id="${url.slice(1)}"`)); continue; }
    assert.ok(!url.startsWith('http'), `No external dependencies or unverified destinations: ${url}`);
    assert.ok(routes.has(url) || existsSync(new URL('../public' + url, import.meta.url)), `Missing route ${url}`);
  }
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
});
test('no public domain or intake invented; payment disabled', () => {
  assert.equal(canonicalOrigin(), null); assert.deepEqual(publication.operationalCoverage, []);
  assert.equal(publication.intake.status, 'not-connected'); assert.equal(publication.checkout.status, 'not-connected');
});
test('proposed offer numbers consistent with status record', () => {
  const page = pages.find(p => p.path === '/pricing/'); assert.ok(page.body.includes(`$${publication.pilotUSD}`)); assert.ok(page.body.includes(`$${publication.continuationUSDPerMonth}`));
  assert.match(page.body, /not an active checkout/);
});
test('request fields have no names, uploads, submit buttons, hidden tracking or fake receipt', () => {
  const html = pages.find(p => p.path === '/request/').body;
  assert.doesNotMatch(html, /<input[^>]+\bname=|type="submit"|type="file"/);
  assert.match(html, /cannot send it/); assert.match(html, /id="send-request" type="button" hidden/);
});
test('local diagnostic and UI have no network, persistence or unsafe HTML sinks', () => {
  for (const file of ['diagnostic.mjs', 'diagnostic-ui.mjs']) {
    const source = readFileSync(new URL('../public/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|\.innerHTML|eval\s*\(/);
  }
});
test('public dependencies do not import private code', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(manifest.dependencies).length, 1); assert.equal(manifest.dependencies.astro, '7.3.3');
  assert.doesNotMatch(JSON.stringify(manifest), /@prds|github:/);
});
test('escaping covers HTML and data attributes', () => assert.equal(escapeHTML('<&"\'>'), '&lt;&amp;&quot;&#39;&gt;'));
test('review headers prohibit network and indexing', () => {
  assert.match(readFileSync(new URL('../public/_headers', import.meta.url), 'utf8'), /connect-src 'none'/);
  assert.match(readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8'), /Disallow: \//);
});

test('generated lock matches the public manifest and contains registry integrity', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(lock.lockfileVersion, 3); assert.equal(lock.name, manifest.name); assert.equal(lock.version, manifest.version);
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.equal(lock.packages['node_modules/astro'].version, manifest.dependencies.astro);
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    assert.ok(entry.resolved?.startsWith('https://registry.npmjs.org/'), `Unapproved registry for ${path}`);
    assert.match(entry.integrity, /^sha512-/);
  }
});
test('CI is read-only, lock-enforcing, and cannot hide piped test failures', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/launch-verification.yml', import.meta.url), 'utf8');
  assert.match(workflow, /shell: bash/); assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.doesNotMatch(workflow, /contents: write|preserve_verified_lock|else npm install/);
});
