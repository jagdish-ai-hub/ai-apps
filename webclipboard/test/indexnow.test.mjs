import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { isValidKey, buildPayloads, parseSitemap, keyLocation, describeStatus, isSuccess } from '../src/lib/indexnow.js';

const cfg = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

test('key validation follows the protocol (8-128 letters, digits, dashes)', () => {
  assert.ok(isValidKey(KEY) && isValidKey('abc-1234') && isValidKey('A'.repeat(128)));
  for (const bad of ['short', 'A'.repeat(129), 'has space 1234', 'under_score1', '', null, undefined, 12345678]) assert.equal(isValidKey(bad), false, String(bad));
});

test('the configured key is valid and its key file is published at the site root with exactly the key', () => {
  assert.ok(isValidKey(cfg.indexNowKey), 'indexNowKey in site.config.json');
  const file = new URL(`../public/${cfg.indexNowKey}.txt`, import.meta.url);
  assert.ok(existsSync(file), 'public/<key>.txt exists');
  assert.equal(readFileSync(file, 'utf8'), cfg.indexNowKey, 'file content is the key, with no newline or spaces');
  assert.equal(readdirSync(new URL('../public/', import.meta.url)).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f)).length, 1, 'only one key file');
});

test('payloads: host-scoped, deduplicated, fragment-free, with keyLocation', () => {
  const { bodies, kept, dropped } = buildPayloads({
    host: 'example.com', key: KEY,
    urls: ['https://example.com/', 'https://example.com/', 'https://example.com/a/?x=1', 'http://example.com/insecure/', 'https://other.com/x', 'https://example.com/b/#frag', 'not a url'],
  });
  assert.deepEqual(kept, ['https://example.com/', 'https://example.com/a/?x=1']);
  assert.equal(dropped.length, 4);
  assert.equal(bodies.length, 1);
  assert.deepEqual(Object.keys(bodies[0]).sort(), ['host', 'key', 'keyLocation', 'urlList']);
  assert.equal(bodies[0].keyLocation, `https://example.com/${KEY}.txt`);
});

test('payloads are chunked at the per-request limit', () => {
  const urls = Array.from({ length: 25 }, (_, i) => `https://example.com/p${i}/`);
  const { bodies } = buildPayloads({ host: 'example.com', key: KEY, urls, max: 10 });
  assert.deepEqual(bodies.map((b) => b.urlList.length), [10, 10, 5]);
});

test('bad host or key is rejected before anything is sent', () => {
  assert.throws(() => buildPayloads({ host: 'https://example.com', key: KEY, urls: [] }), /bare hostname/);
  assert.throws(() => buildPayloads({ host: 'example.com', key: 'bad key', urls: [] }), /key/);
});

test('status codes are described and success is 200 or 202 only', () => {
  assert.ok(describeStatus(403).includes('key'));
  assert.ok(describeStatus(422).includes('host'));
  assert.ok(describeStatus(999).includes('Unexpected'));
  assert.ok(isSuccess(200) && isSuccess(202) && !isSuccess(403) && !isSuccess(429));
});

const dist = new URL('../dist/', import.meta.url);
test('built site: key file is served, sitemap URLs are all on the configured host, key file is not in the sitemap', { skip: !existsSync(new URL('sitemap.xml', dist)) && 'run `npm run build` first' }, () => {
  assert.equal(readFileSync(new URL(`${cfg.indexNowKey}.txt`, dist), 'utf8'), cfg.indexNowKey);
  const urls = parseSitemap(readFileSync(new URL('sitemap.xml', dist), 'utf8'));
  assert.ok(urls.length >= 50, `${urls.length} urls`);
  const { kept, dropped } = buildPayloads({ host: cfg.domain, key: cfg.indexNowKey, urls });
  assert.deepEqual(dropped, [], 'every sitemap URL belongs to the host');
  assert.equal(kept.length, urls.length, 'no duplicates in the sitemap');
  assert.ok(!urls.some((u) => u.includes(cfg.indexNowKey)));
  assert.equal(keyLocation(cfg.domain, cfg.indexNowKey), `https://${cfg.domain}/${cfg.indexNowKey}.txt`);
});
