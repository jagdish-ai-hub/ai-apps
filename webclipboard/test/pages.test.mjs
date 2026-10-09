import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const built = existsSync(new URL('index.html', dist));
const skip = !built && 'run `npm run build` first';
const read = (p) => readFileSync(new URL(p, dist), 'utf8');
const text = (html) => html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();

const PAGES = [
  { path: 'token-cost-by-language/index.html', url: 'https://webclipboard.online/token-cost-by-language/', minWords: 900 },
  { path: 'o200k-base-token-counter/index.html', url: 'https://webclipboard.online/o200k-base-token-counter/', minWords: 650, selected: 'o200k_base' },
  { path: 'cl100k-base-tokenizer/index.html', url: 'https://webclipboard.online/cl100k-base-tokenizer/', minWords: 650, selected: 'cl100k_base' },
];

for (const p of PAGES) {
  test(`${p.path}: SEO basics, structured data and enough real content`, { skip }, () => {
    const html = read(p.path);
    const title = /<title>([^<]*)<\/title>/.exec(html)[1];
    const desc = /<meta name="description" content="([^"]*)"/.exec(html)[1];
    assert.ok(title.length <= 70, `title ${title.length} chars: ${title}`);
    assert.ok(desc.length >= 80 && desc.length <= 170, `description ${desc.length} chars`);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'exactly one h1');
    assert.ok(html.includes(`<link rel="canonical" href="${p.url}">`), 'canonical');
    assert.ok(!/<link rel="alternate" hreflang/.test(html), 'English-only page must not declare alternate-language versions');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
    assert.ok(/"@type":"FAQPage"/.test(html) && /"@type":"BreadcrumbList"/.test(html));
    const words = text(html).split(' ').length;
    assert.ok(words >= p.minWords, `only ${words} words (min ${p.minWords})`);
    assert.ok(!/NaN|undefined|\[object Object\]/.test(text(html)), 'no template leftovers in visible text');
    if (p.selected) assert.match(html, new RegExp(`<option value="${p.selected}"[^>]*selected`), 'tokenizer preselected');
    if (p.selected) assert.match(html, /data-lock-tokenizer="1"/);
  });
}

test('data page: Dataset schema points at real downloads, all 30 languages present', { skip }, () => {
  const html = read('token-cost-by-language/index.html');
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const ds = ld.find((x) => x['@type'] === 'Dataset');
  assert.ok(ds, 'Dataset JSON-LD');
  for (const d of ds.distribution) assert.ok(existsSync(new URL(new URL(d.contentUrl).pathname.slice(1), dist)), `${d.contentUrl} exists in dist`);
  assert.equal((html.match(/<th scope="row"/g) || []).length, 30, '30 language rows in the table');
  for (const name of ['Greek', 'Bengali', 'Chinese (Simplified)', 'Hindi', 'Thai', 'Spanish']) assert.ok(html.includes(name), name);
});

test('downloads: CSV and JSON agree with each other', { skip }, () => {
  const csv = read('data/token-cost-by-language.csv').trim().split('\n');
  const json = JSON.parse(read('data/token-cost-by-language.json'));
  assert.equal(csv.length - 1, 30);
  assert.equal(json.languages.length, 30);
  const header = csv[0].split(',');
  const iTok = header.indexOf('tokens_o200k_base');
  const hi = csv.find((l) => l.startsWith('hi,')).split(',');
  assert.equal(Number(hi[iTok]), json.languages.find((l) => l.code === 'hi').tokens_o200k_base);
  assert.match(json.tokenizer_library, /^gpt-tokenizer \d+\.\d+\.\d+$/);
});

test('prose claims on the data page are consistent with the table it sits above', { skip }, () => {
  const html = read('token-cost-by-language/index.html');
  const csv = read('data/token-cost-by-language.csv').trim().split('\n').slice(1).map((l) => l.split(','));
  const h = read('data/token-cost-by-language.csv').split('\n')[0].split(',');
  const rO = h.indexOf('ratio_vs_english_o200k_base');
  const others = csv.filter((r) => r[0] !== 'en');
  const max = Math.max(...others.map((r) => Number(r[rO]))).toFixed(2);
  assert.ok(text(html).includes(`${max}×`), `highest ratio ${max}× is quoted on the page`);
});

test('new pages are in the sitemap and linked from the calculator page', { skip }, () => {
  const sitemap = read('sitemap.xml');
  const calc = read('token-calculator/index.html');
  for (const p of PAGES) {
    assert.ok(sitemap.includes(`<loc>${p.url}</loc>`), `${p.url} in sitemap`);
    assert.ok(calc.includes(`href="/${p.path.replace('index.html', '')}"`), `${p.path} linked from /token-calculator/`);
  }
});
