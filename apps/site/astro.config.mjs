import { defineConfig } from 'astro/config';
import { canonicalOrigin } from './site.mjs';
// Static-only pages need neither private engine packages nor a server adapter.
export default defineConfig({ output: 'static', trailingSlash: 'always', site: canonicalOrigin() || undefined });
