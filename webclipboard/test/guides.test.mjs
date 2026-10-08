import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { load } from 'js-yaml';

const dir = new URL('../src/guides/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const slugs = new Set(files.map((f) => f.replace(/\.md$/, '')));

function parse(file) {
  const raw = readFileSync(new URL(file, dir), 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  assert.ok(m, `${file}: missing frontmatter`);
  return { meta: load(m[1]), body: m[2] };
}

test('there are at least 8 guides', () => assert.ok(files.length >= 8, `found ${files.length}`));

for (const file of files) {
  test(`${file}: frontmatter and content quality`, () => {
    const { meta, body } = parse(file);
    for (const k of ['title', 'description', 'h1', 'lead', 'category', 'updated', 'related', 'faq']) assert.ok(meta[k], `missing ${k}`);
    assert.ok(meta.title.length <= 70, `title too long (${meta.title.length})`);
    assert.ok(meta.description.length >= 80 && meta.description.length <= 170, `description length ${meta.description.length}`);
    assert.match(String(meta.updated), /^\d{4}-\d{2}-\d{2}/);
    const words = body.replace(/[#*|`>-]/g, ' ').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 650, `only ${words} words in body (thin-content guard)`);
    assert.ok(meta.faq.length >= 3, 'needs at least 3 FAQs');
    assert.ok((body.match(/^## /gm) || []).length >= 4, 'needs at least 4 sections');
    for (const r of meta.related) assert.ok(slugs.has(r), `related guide "${r}" does not exist`);
    assert.ok(!meta.related.includes(file.replace(/\.md$/, '')), 'guide lists itself as related');
    for (const [, s] of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) assert.ok(slugs.has(s), `broken in-text link to ${s}`);
  });
}

test('guides are not copies of each other (distinct titles and descriptions)', () => {
  const metas = files.map((f) => parse(f).meta);
  assert.equal(new Set(metas.map((m) => m.title)).size, metas.length);
  assert.equal(new Set(metas.map((m) => m.description)).size, metas.length);
  assert.equal(new Set(metas.map((m) => m.h1)).size, metas.length);
});

// Crawl the built site: every internal link and every sitemap URL must resolve to a file in dist/.
const dist = new URL('../dist/', import.meta.url);
test('built site: no broken internal links, sitemap URLs all exist', { skip: !existsSync(new URL('index.html', dist)) && 'run `npm run build` first' }, () => {
  const resolves = (p) => {
    const clean = p.split('#')[0].split('?')[0];
    if (!clean || clean === '/') return existsSync(new URL('index.html', dist));
    const rel = clean.replace(/^\//, '');
    return existsSync(new URL(rel, dist)) || existsSync(new URL(rel.replace(/\/?$/, '/index.html'), dist));
  };
  // /c/ and /api/ are served by the Worker, not static files.
  const workerRoutes = (p) => p.startsWith('/c/') || p.startsWith('/api/');
  const stack = [dist];
  const htmlFiles = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const u = new URL(e.name + (e.isDirectory() ? '/' : ''), d);
      if (e.isDirectory()) walk(u);
      else if (e.name.endsWith('.html')) htmlFiles.push(u);
    }
  };
  walk(dist);
  const broken = [];
  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8');
    for (const [, href] of html.matchAll(/<(?:a|link)[^>]+href="(\/[^"]*)"/g)) {
      if (href.startsWith('//') || workerRoutes(href)) continue;
      if (!resolves(href)) broken.push(`${f.pathname.split('/dist/')[1]} -> ${href}`);
    }
  }
  assert.deepEqual([...new Set(broken)], [], 'broken internal links');
  const sitemap = readFileSync(new URL('sitemap.xml', dist), 'utf8');
  const missing = [...sitemap.matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !resolves(p));
  assert.deepEqual(missing, [], 'sitemap URLs without a built page');
});
