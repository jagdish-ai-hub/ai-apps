#!/usr/bin/env node
// Tell IndexNow search engines (Bing, Yandex, Naver, Seznam and others) that pages are new or changed.
//
//   node scripts/indexnow.mjs                 submit every URL in dist/sitemap.xml
//   node scripts/indexnow.mjs URL [URL ...]   submit only these URLs
//   --dry-run   print what would be sent, send nothing
//   --soft      never exit non-zero (safe to chain after `wrangler deploy`)
//   --skip-key-check   do not verify the live key file first
//
// Submit when you add or change pages, not on every deploy: repeated bulk submissions of unchanged URLs can be flagged as spam.
import { readFileSync, existsSync } from 'node:fs';
import { buildPayloads, parseSitemap, keyLocation, describeStatus, isSuccess, ENDPOINT } from '../src/lib/indexnow.js';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const explicit = args.filter((a) => !a.startsWith('--'));
const soft = flags.has('--soft');
const fail = (msg) => { console.error(`indexnow: ${msg}`); process.exit(soft ? 0 : 1); };

const cfg = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
const host = cfg.domain;
const key = cfg.indexNowKey;

let urls = explicit;
if (urls.length === 0) {
  const sitemap = new URL('../dist/sitemap.xml', import.meta.url);
  if (!existsSync(sitemap)) fail('dist/sitemap.xml not found. Run `npm run build` first, or pass URLs explicitly.');
  urls = parseSitemap(readFileSync(sitemap, 'utf8'));
}

let plan;
try { plan = buildPayloads({ host, key, urls }); } catch (e) { fail(e.message); }
if (plan.dropped.length) console.warn(`indexnow: skipped ${plan.dropped.length} URL(s) not on https://${host}/:`, plan.dropped.slice(0, 3).join(', '));
if (plan.kept.length === 0) fail('no URLs to submit');

console.log(`indexnow: ${plan.kept.length} URL(s) for ${host}, key file ${keyLocation(host, key)}`);
if (flags.has('--dry-run')) {
  console.log(JSON.stringify({ endpoint: ENDPOINT, ...plan.bodies[0], urlList: `${plan.bodies[0].urlList.length} URLs, first: ${plan.bodies[0].urlList[0]}` }, null, 2));
  process.exit(0);
}

// Make sure the key file is really live before telling engines to check it; otherwise they answer 403 and may throttle us.
if (!flags.has('--skip-key-check')) {
  try {
    const res = await fetch(keyLocation(host, key), { redirect: 'follow' });
    const body = (await res.text()).trim();
    if (!res.ok || body !== key) fail(`key file at ${keyLocation(host, key)} is not live yet (HTTP ${res.status}). Deploy the site and attach the domain first.`);
  } catch (e) {
    fail(`could not reach ${keyLocation(host, key)} (${e.message}). Is the domain live?`);
  }
}

let bad = 0;
for (const body of plan.bodies) {
  try {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
    console.log(`indexnow: ${res.status} ${describeStatus(res.status)} (${body.urlList.length} URLs)`);
    if (!isSuccess(res.status)) bad++;
  } catch (e) {
    console.error(`indexnow: request failed: ${e.message}`);
    bad++;
  }
}
process.exit(bad && !soft ? 1 : 0);
