import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pages } from '../site.mjs';
const root = process.argv[2] || 'dist';
for (const page of pages) {
  const html = await readFile(join(root, page.path, 'index.html'), 'utf8');
  if ((html.match(/<main\b/g) || []).length !== 1 || (html.match(/<h1\b/g) || []).length !== 1) throw new Error(`Invalid structure at ${page.path}`);
  if (!html.includes('noindex,nofollow')) throw new Error(`Review indexing boundary missing at ${page.path}`);
  if (html.includes('@prds/') || html.includes('4 State Collectors Live') || html.includes('Start Free Trial')) throw new Error(`Private import or unsupported claim at ${page.path}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    const path = match[1].endsWith('/') ? join(root, match[1], 'index.html') : join(root, match[1]);
    if (!(await stat(path)).isFile()) throw new Error(`Missing emitted link target: ${match[1]}`);
  }
}
console.log(`Verified ${pages.length} emitted pages and their local links. Runtime intake, deployment and revenue remain separate.`);
