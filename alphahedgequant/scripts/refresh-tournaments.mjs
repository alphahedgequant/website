/**
 * AHQ Tournament Board fallback updater — Node.js 18+, no npm dependencies.
 *
 * Usage: node refresh-tournaments.mjs
 * Output: tournaments-data.json in the directory containing tournaments.html.
 *
 * When installed in the AHQ Next.js repository, put this script under scripts/
 * and tournaments.html under public/. The output will be public/tournaments-data.json.
 * Scheduled operation can be configured externally (CI/cron). This script does
 * not create a recurring job by itself.
 */
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const possiblePublic = resolve(sourceDir, '..', 'public');
async function exists(path) { try { await stat(path); return true; } catch { return false; } }
const outDir = await exists(join(sourceDir, 'tournaments.html')) ? sourceDir :
  await exists(join(possiblePublic, 'tournaments.html')) ? possiblePublic : sourceDir;
const output = join(outDir, 'tournaments-data.json');

async function json(url, accept = 'application/json') {
  const response = await fetch(url, {
    headers: { Accept: accept, 'User-Agent': 'AlphaHedgeQuantTournamentBoard/1.0 (source fallback)' },
    signal: AbortSignal.timeout(16000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' from ' + new URL(url).hostname);
  return response.json();
}
async function text(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/x-ndjson,application/json;q=0.9', 'User-Agent': 'AlphaHedgeQuantTournamentBoard/1.0 (source fallback)' },
    signal: AbortSignal.timeout(16000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' from ' + new URL(url).hostname);
  return response.text();
}
function ndjson(raw) {
  if (raw.trim().startsWith('[')) {
    try { const array = JSON.parse(raw); return Array.isArray(array) ? array : []; } catch { return []; }
  }
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const row = JSON.parse(line); if (row && typeof row === 'object') out.push(row); } catch { /* skip malformed row */ }
  }
  return out;
}
function hackathons(raw) {
  if (Array.isArray(raw)) return raw;
  for (const k of ['hackathons', 'data', 'results']) if (Array.isArray(raw?.[k])) return raw[k];
  throw new Error('Unrecognised Devpost response; preserving prior snapshot');
}
let previous = {};
try { previous = JSON.parse(await readFile(output, 'utf8')); } catch { /* first run */ }
const next = { version: 1, updatedAt: new Date().toISOString(),
  lichess: previous?.lichess || null, devpost: previous?.devpost || null };
const diagnostics = [];
const [topResult, officialResult, devpostResult] = await Promise.allSettled([
  json('https://lichess.org/api/broadcast/top'),
  text('https://lichess.org/api/broadcast?nb=100'),
  json('https://devpost.com/api/hackathons?status%5B%5D=upcoming&status%5B%5D=open'),
]);
const top = topResult.status === 'fulfilled' ? topResult.value : null;
const official = officialResult.status === 'fulfilled' ? ndjson(officialResult.value).slice(0, 100) : [];
const topValid = !!top && (Array.isArray(top.active) || Array.isArray(top.past?.currentPageResults));
if (topValid || official.length) {
  next.lichess = { updatedAt: new Date().toISOString(),
    top: topValid ? { active: (top.active || []).slice(0, 50), past: { currentPageResults: (top.past?.currentPageResults || []).slice(0, 50) } } : null,
    official };
  diagnostics.push('Lichess: refreshed (' + ((top?.active?.length || 0) + official.length) + ' broadcast entries)');
} else diagnostics.push('Lichess: unreachable; keeping existing data or curated-only fallback');
if (devpostResult.status === 'fulfilled') {
  try {
    const items = hackathons(devpostResult.value);
    next.devpost = { updatedAt: new Date().toISOString(), hackathons: items.slice(0, 400) };
    diagnostics.push('Devpost: refreshed (' + items.length + ' listings)');
  } catch (error) { diagnostics.push('Devpost: ' + error.message); }
} else diagnostics.push('Devpost: unreachable; keeping existing data or curated-only fallback');
// Avoid replacing a healthy previous snapshot with a collection of nulls.
if (!next.lichess && !next.devpost) {
  console.warn(diagnostics.join('\n'));
  console.warn('No feeds available; no fallback file written. Curated HTML data remains usable.');
  process.exitCode = 1;
} else {
  const tmp = output + '.tmp';
  await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  await rename(tmp, output);
  console.log('Updated ' + output);
  console.log(diagnostics.join('\n'));
}
