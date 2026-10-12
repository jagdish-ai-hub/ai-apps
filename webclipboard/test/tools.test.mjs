import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { load } from 'js-yaml';

const dist = new URL('../dist/', import.meta.url);
const built = existsSync(new URL('index.html', dist));
const skip = !built && 'run `npm run build` first';
const read = (p) => readFileSync(new URL(p, dist), 'utf8');
const text = (html) => html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

// The registry is TypeScript; read slugs and guides from its source.
const registry = readFileSync(new URL('../src/lib/tools.ts', import.meta.url), 'utf8');
const tools = [...registry.matchAll(/\{ slug: '([^']+)', name: '([^']+)'[^}]*?group: '(\w+)'(?:, guide: '([^']+)')?/g)].map((m) => ({ slug: m[1], name: m[2], group: m[3], guide: m[4] }));

function guideMeta(slug) {
  const raw = readFileSync(new URL(`../src/guides/${slug}.md`, import.meta.url), 'utf8');
  return load(/^---\n([\s\S]*?)\n---/.exec(raw)[1]);
}

test('registry parsed', () => assert.ok(tools.length >= 8, `found ${tools.length}`));

for (const t of tools.filter((x) => x.guide)) {
  test(`/${t.slug}/: own page, SEO tags, JSON-LD (WebApplication, Breadcrumb, HowTo, FAQ) and its own guide`, { skip }, () => {
    const html = read(`${t.slug}/index.html`);
    const title = /<title>([^<]*)<\/title>/.exec(html)[1];
    const desc = /<meta name="description" content="([^"]*)"/.exec(html)[1];
    assert.ok(title.length <= 70, `title ${title.length}`);
    assert.ok(desc.length >= 80 && desc.length <= 170, `description ${desc.length}`);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="https://webclipboard.online/${t.slug}/">`));
    assert.ok(!/<link rel="alternate" hreflang/.test(html), 'English-only page declares no hreflang');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) assert.ok(html.includes(`property="${p}"`), p);
    assert.ok(html.includes('name="twitter:card"'));
    const types = ld(html).map((x) => x['@type']);
    for (const k of ['WebApplication', 'BreadcrumbList', 'HowTo', 'FAQPage']) assert.ok(types.includes(k), `${k} missing, have ${types}`);
    const howto = ld(html).find((x) => x['@type'] === 'HowTo');
    assert.ok(howto.step.length >= 3 && howto.step.every((s) => s.text && !/<|>/.test(s.text)));
    const faq = ld(html).find((x) => x['@type'] === 'FAQPage');
    assert.ok(faq.mainEntity.length >= 5, 'at least 5 FAQs');
    const words = text(html).split(' ').length;
    assert.ok(words >= 650, `only ${words} words (thin-content guard)`);
    assert.ok(!/NaN|undefined|\[object Object\]/.test(text(html)));
    // tool <-> guide, both directions
    assert.ok(html.includes(`href="/guides/${t.guide}/"`), 'tool page links to its guide');
    const meta = guideMeta(t.guide);
    assert.equal(meta.tool, t.slug, 'guide frontmatter points back to the tool');
    assert.ok(read(`guides/${t.guide}/index.html`).includes(`href="/${t.slug}/"`), 'guide links to the tool');
    // listed in the hub and the sitemap, and in the main navigation
    assert.ok(read('tools/index.html').includes(`href="/${t.slug}/"`), 'listed on /tools/');
    assert.ok(read('sitemap.xml').includes(`<loc>https://webclipboard.online/${t.slug}/</loc>`), 'in sitemap');
    assert.ok(html.includes('href="/tools/"'), 'nav has Tools');
  });
}

test('every tool in the registry has a built page', { skip }, () => {
  for (const t of tools) assert.ok(existsSync(new URL(`${t.slug}/index.html`, dist)), `${t.slug} not built`);
});

test('Converter pages ship the controls the script needs', { skip }, () => {
  for (const [slug, mode, label] of [['text-to-pdf', 'text-pdf', 'Save as PDF'], ['text-to-word', 'text-docx', 'Download Word file'], ['markdown-to-pdf', 'md-pdf', 'Save as PDF'], ['markdown-to-word', 'md-docx', 'Download Word file']]) {
    const html = read(`${slug}/index.html`);
    assert.ok(html.includes(`data-mode="${mode}"`), `${slug} mode`);
    for (const id of ['cv-text', 'cv-go', 'cv-font', 'cv-size', 'cv-page', 'cv-margin', 'cv-name', 'cv-sample-text']) assert.ok(html.includes(`id="${id}"`), `${slug} #${id}`);
    assert.ok(html.includes(label), `${slug} button label`);
    assert.equal(html.includes('id="cv-preview"'), mode.startsWith('md'), `${slug} preview only for Markdown`);
    assert.ok(html.includes('data-clr-mask="true"'), 'text box masked from session replay');
  }
});

test('clipboard download menu offers .txt, .md, Word and PDF', { skip }, () => {
  const html = read('index.html');
  for (const f of ['txt', 'md', 'docx', 'pdf']) assert.ok(html.includes(`data-fmt="${f}"`), f);
});

test('/tools/ hub lists every tool and has Collection and Breadcrumb data', { skip }, () => {
  const html = read('tools/index.html');
  for (const t of tools) assert.ok(html.includes(`href="/${t.slug}/"`), t.slug);
  const types = ld(html).map((x) => x['@type']);
  assert.ok(types.includes('CollectionPage') && types.includes('BreadcrumbList'));
});

test('homepage links the converters and the tools hub', { skip }, () => {
  const html = read('index.html');
  for (const s of ['text-to-pdf', 'text-to-word', 'markdown-to-pdf', 'markdown-to-word', 'token-calculator']) assert.ok(html.includes(`href="/${s}/"`), s);
  assert.ok(html.includes('href="/tools/"'));
});

// ------------------------------------------------------------------ natively written Japanese guides

const jaDir = new URL('../src/guides/ja/', import.meta.url);
const jaFiles = readdirSync(jaDir).filter((f) => f.endsWith('.md'));

test('Japanese guides exist', () => assert.ok(jaFiles.length >= 3));

for (const f of jaFiles) {
  test(`ja/${f}: frontmatter, enough Japanese text, links stay inside /ja/`, () => {
    const raw = readFileSync(new URL(f, jaDir), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    const meta = load(m[1]);
    for (const k of ['title', 'description', 'h1', 'lead', 'category', 'updated', 'related', 'faq']) assert.ok(meta[k], `missing ${k}`);
    assert.ok(meta.title.length <= 60, `title ${meta.title.length}`);
    assert.ok(meta.description.length >= 50 && meta.description.length <= 140, `description ${meta.description.length}`);
    const chars = m[2].replace(/\s/g, '').length;
    assert.ok(chars >= 1500, `only ${chars} characters`);
    assert.ok(/[぀-ヿ]/.test(m[2]), 'contains kana');
    assert.ok((m[2].match(/^## /gm) || []).length >= 4);
    assert.ok(meta.faq.length >= 3);
    for (const [, s] of m[2].matchAll(/\]\(\/ja\/guides\/([a-z0-9-]+)\/\)/g)) assert.ok(jaFiles.includes(`${s}.md`), `broken link to /ja/guides/${s}/`);
    assert.ok(!/\]\(\/guides\//.test(m[2]), 'Japanese guide must not link to English guide URLs');
    for (const r of meta.related) assert.ok(jaFiles.includes(`${r}.md`), `related ${r}`);
  });
}

test('Japanese guides: pages, hreflang pairs with the English guide (both directions), sitemap, nav', { skip }, () => {
  const sitemap = read('sitemap.xml');
  for (const f of jaFiles) {
    const slug = f.replace(/\.md$/, '');
    const ja = read(`ja/guides/${slug}/index.html`);
    assert.match(ja, /<html lang="ja"/);
    assert.ok(ja.includes(`<link rel="canonical" href="https://webclipboard.online/ja/guides/${slug}/">`));
    const hasEn = existsSync(new URL(`../src/guides/${slug}.md`, import.meta.url));
    if (hasEn) {
      const en = read(`guides/${slug}/index.html`);
      for (const html of [ja, en]) {
        assert.ok(html.includes(`hreflang="ja" href="https://webclipboard.online/ja/guides/${slug}/"`), 'ja alternate');
        assert.ok(html.includes(`hreflang="en" href="https://webclipboard.online/guides/${slug}/"`), 'en alternate');
        assert.ok(html.includes(`hreflang="x-default" href="https://webclipboard.online/guides/${slug}/"`), 'x-default');
      }
    } else assert.ok(!/<link rel="alternate" hreflang/.test(ja), 'unpaired guide must not claim alternates');
    assert.ok(sitemap.includes(`<loc>https://webclipboard.online/ja/guides/${slug}/</loc>`));
    const types = ld(ja).map((x) => x['@type']);
    for (const k of ['Article', 'BreadcrumbList', 'FAQPage']) assert.ok(types.includes(k), k);
    assert.equal(ld(ja).find((x) => x['@type'] === 'Article').inLanguage, 'ja');
  }
  const hub = read('ja/guides/index.html');
  for (const f of jaFiles) assert.ok(hub.includes(`href="/ja/guides/${f.replace(/\.md$/, '')}/"`));
  assert.ok(sitemap.includes('<loc>https://webclipboard.online/ja/guides/</loc>'));
  const home = read('ja/index.html');
  assert.ok(home.includes('href="/ja/guides/"'), 'Japanese home links to the Japanese guides');
  assert.ok(!read('es/index.html').includes('/guides/'), 'languages without guides do not link to guides');
});

test('Japanese home page has the longer FAQ in both the page and the FAQPage data', { skip }, () => {
  const html = read('ja/index.html');
  const faq = ld(html).find((x) => x['@type'] === 'FAQPage');
  assert.ok(faq.mainEntity.length >= 12, `${faq.mainEntity.length} questions`);
  assert.equal((html.match(/<details>/g) || []).length, faq.mainEntity.length);
});
