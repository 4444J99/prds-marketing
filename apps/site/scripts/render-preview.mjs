// Deterministic preview of the SAME renderer used by Astro. Not an Astro build receipt.
import { mkdir, writeFile, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pages, renderDocument } from '../site.mjs';
const out = resolve(process.argv[2] || '.preview');
await mkdir(out, { recursive: true });
await cp('public', out, { recursive: true });
for (const page of pages) { const dir = join(out, page.path); await mkdir(dir, { recursive: true }); await writeFile(join(dir, 'index.html'), renderDocument(page)); }
console.log(`Rendered ${pages.length} canonical page bodies to ${out}. This is not an Astro build.`);
