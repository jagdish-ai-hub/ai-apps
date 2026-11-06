import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { sitemapPageUrls } from '../src/lib/indexnow.js';
import { sitemapUrls } from './sitemap-read.mjs';

const dist = new URL('../dist/', import.meta.url);
const skip = !existsSync(new URL('sitemap.xml', dist)) && 'run `npm run build` first';
const read = (p) => readFileSync(new URL(p, dist), 'utf8');
const LANGS = readdirSync(new URL('../src/i18n/', import.meta.url)).map((f) => f.replace('.json', ''));

test('sitemapPageUrls reads plain sitemaps and follows sitemap indexes', () => {
  const plain = '<urlset><url><loc>https://a.b/x/</loc></url></urlset>';
  assert.deepEqual(sitemapPageUrls(plain, () => assert.fail('no children')), ['https://a.b/x/']);
  const index = '<sitemapindex><sitemap><loc>https://a.b/s1.xml</loc></sitemap><sitemap><loc>https://a.b/s2.xml</loc></sitemap></sitemapindex>';
  const kids = { 'https://a.b/s1.xml': plain, 'https://a.b/s2.xml': '<urlset><url><loc>https://a.b/y/</loc></url></urlset>' };
  assert.deepEqual(sitemapPageUrls(index, (u) => kids[u]), ['https://a.b/x/', 'https://a.b/y/']);
});

test('sitemap.xml is an index of language sitemaps that all exist and are non-empty', { skip }, () => {
  const index = read('sitemap.xml');
  assert.match(index, /^<\?xml[^>]+\?><sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const children = [...index.matchAll(/<loc>https:\/\/webclipboard\.online\/(sitemap-([a-z-]+)\.xml)<\/loc>/g)];
  assert.ok(children.length >= 6, 'several language sitemaps');
  assert.equal(children[0][2], 'en', 'English sitemap first');
  for (const [, file, code] of children) {
    assert.ok(LANGS.includes(code), `${code} is a site language`);
    const xml = read(file);
    assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/);
    const locs = [...xml.matchAll(/<url><loc>https:\/\/webclipboard\.online(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    assert.ok(locs.length > 0, `${file} lists pages`);
    for (const p of locs) {
      const first = p.split('/')[1];
      if (code === 'en') assert.ok(!LANGS.includes(first) || first === 'en', `${p} belongs in its own language sitemap`);
      else assert.ok(p.startsWith(`/${code}/`), `${p} is a ${code} page`);
    }
  }
  // No stray language sitemaps outside the index.
  const built = readdirSync(dist).filter((f) => /^sitemap-.+\.xml$/.test(f)).sort();
  assert.deepEqual(built, children.map((c) => c[1]).sort());
});

test('the sitemaps list every built page exactly once, and nothing else', { skip }, () => {
  const urls = sitemapUrls().map((u) => new URL(u).pathname);
  assert.equal(new Set(urls).size, urls.length, 'no duplicates');
  const pages = [];
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const full = new URL(`${name}/`, dir);
      if (statSync(new URL(name, dir)).isDirectory()) {
        if (existsSync(new URL('index.html', full)) && !['404', '_astro'].includes(name)) pages.push(`${rel}${name}/`);
        walk(full, `${rel}${name}/`);
      }
    }
  };
  walk(dist, '/');
  pages.push('/');
  assert.deepEqual([...urls].sort(), [...pages].sort());
});

test('no orphan pages: every sitemap URL is linked with <a href> from another page', { skip }, () => {
  const linked = new Set();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const u = new URL(name, dir);
      if (statSync(u).isDirectory()) { if (name !== '_astro') walk(new URL(`${name}/`, dir)); continue; }
      if (!name.endsWith('.html')) continue;
      const self = '/' + u.pathname.slice(dist.pathname.length).replace(/index\.html$/, '');
      for (const m of readFileSync(u, 'utf8').matchAll(/<a\s[^>]*href="(\/[^"#?]*)/g)) if (m[1] !== self) linked.add(m[1]);
    }
  };
  walk(dist);
  const orphans = sitemapUrls().map((u) => new URL(u).pathname).filter((p) => p !== '/' && !linked.has(p));
  assert.deepEqual(orphans, [], 'pages only reachable through the sitemap');
});
