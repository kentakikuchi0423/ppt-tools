// Generates a production manifest from the dev manifest by substituting
// the host URL, the add-in <Id> GUID, and the <Version>.
//
// Usage:
//   MANIFEST_HOST=https://example.com/path \
//   MANIFEST_GUID=00000000-0000-0000-0000-000000000000 \
//   MANIFEST_VERSION=1.0.0.0 \
//   node scripts/build-manifest.mjs
//
// Defaults are tuned so a bare `npm run manifest:prod` produces the
// GitHub Pages-targeted manifest with this repo's pre-allocated prod
// GUID. Overriding these env vars is the way to retarget the build for
// a different host (e.g. Cloudflare Pages, Azure Static Web Apps, an
// internal share) or to bump the version on a release.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEV_HOST = 'https://localhost:3000';
const DEV_GUID = 'c3f24a1e-e4a8-4a54-8d26-ff2db8ed9e0e';

const HOST = (process.env['MANIFEST_HOST'] ?? 'https://kentakikuchi0423.github.io/ppt-tools').replace(/\/$/, '');
// Pre-allocated production GUID. Stable across builds so PowerPoint
// recognises updates instead of treating each release as a new add-in.
const GUID = process.env['MANIFEST_GUID'] ?? '9f4e74b3-ec75-46c1-91aa-c466e1d6e608';
const VERSION = process.env['MANIFEST_VERSION'] ?? '1.0.0.0';

if (HOST === DEV_HOST) {
  console.error(
    `[build-manifest] MANIFEST_HOST is the dev URL (${DEV_HOST}). Refusing to write a "prod" manifest that points at localhost.`,
  );
  process.exit(1);
}
if (GUID === DEV_GUID) {
  console.error(
    `[build-manifest] MANIFEST_GUID matches the dev GUID. The prod build needs its own <Id> so PowerPoint can keep the dev and prod side-loads distinct.`,
  );
  process.exit(1);
}

const srcPath = resolve(__dirname, '..', 'manifest.xml');
const outPath = resolve(__dirname, '..', 'dist', 'manifest.xml');

let manifest = await readFile(srcPath, 'utf8');

// Substitute every embedded URL (icon paths, taskpane.html, commands.html,
// AppDomains, …) by replacing the dev host string in one shot.
manifest = manifest.split(DEV_HOST).join(HOST);

// Replace the <Id> element value (only the first occurrence; the GUID
// shouldn't appear elsewhere in the manifest, but guard anyway).
manifest = manifest.replace(/<Id>[^<]+<\/Id>/, `<Id>${GUID}</Id>`);

// Replace the top-level <Version> element. The <Version> tag also appears
// nested inside other schema elements in some manifests, so anchor on
// "  <Version>" (two-space indent) which is unique to the top level here.
manifest = manifest.replace(/^(\s{2})<Version>[^<]+<\/Version>/m, `$1<Version>${VERSION}</Version>`);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, manifest);

console.log(`[build-manifest] wrote ${outPath}`);
console.log(`  host:    ${HOST}`);
console.log(`  guid:    ${GUID}`);
console.log(`  version: ${VERSION}`);
