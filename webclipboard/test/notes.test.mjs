import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { sitemapXml } from './sitemap-read.mjs';

const dist = new URL('../dist/', import.meta.url);
const skip = !existsSync(new URL('index.html', dist)) && 'run `npm run build` first';
const read = (p) => readFileSync(new URL(p, dist), 'utf8');
const json = (l) => JSON.parse(readFileSync(new URL(`../src/notes/${l}.json`, import.meta.url), 'utf8'));
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const words = (t) => t.split(/\s+/).filter(Boolean).length;
const plain = (html) => html.replace(/<[^>]+>/g, ' ');
const KINDS = ['notepad', 'share'];
const CJK = new Set(['ja', 'ko', 'zh-cn', 'zh-tw']);
const HREFLANG = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/i18n/languages.json', import.meta.url), 'utf8')).map((x) => [x.code, x.hreflang]));
const langs = readdirSync(new URL('../src/notes/', import.meta.url)).map((f) => f.replace('.json', ''));
const en = json('en');
const pageText = (p) => plain([p.lead, ...p.steps, ...p.sections.flatMap((s) => [s.h2, ...s.paras]), ...p.faq.flatMap((f) => [f.q, f.a])].join(' '));
const path = (kind, l) => (l === 'en' ? `/${json('en').pages[kind].slug}/` : `/${l}/${json(l).pages[kind].slug}/`);

test('notes content exists for English, Portuguese and Chinese', () => { for (const l of ['en', 'pt', 'zh-cn']) assert.ok(langs.includes(l), l); });

for (const l of langs) {
  test(`${l}: notes content has the same ui keys as English and complete pages`, () => {
    const c = json(l);
    assert.deepEqual(Object.keys(c.ui).sort(), Object.keys(en.ui).sort(), 'ui keys');
    assert.deepEqual(Object.keys(c.ui.names).sort(), KINDS.slice().sort());
    for (const [k, v] of Object.entries(c.ui)) if (k !== 'names') assert.ok(typeof v === 'string' && v.trim(), `ui.${k}`);
    for (const k of ['count']) assert.ok(c.ui[k].includes('{chars}') && c.ui[k].includes('{words}'), `ui.${k} placeholders`);
    for (const kind of KINDS) {
      const p = c.pages[kind];
      for (const k of ['slug', 'title', 'description', 'h1', 'lead', 'eyebrow']) assert.ok(p[k] && p[k].trim(), `${kind}.${k}`);
      assert.match(p.slug, /^[a-z0-9-]+$/);
      assert.equal(p.steps.length, 4); assert.equal(p.sections.length, 4); assert.equal(p.faq.length, 6);
      assert.ok(p.title.length <= 70, `${l}/${kind} title ${p.title.length}`);
      if (CJK.has(l)) {
        assert.ok(p.description.length >= 50 && p.description.length <= 140, `${l}/${kind} description ${p.description.length}`);
        const n = pageText(p).replace(/\s/g, '').length;
        assert.ok(n >= 1500, `${l}/${kind} only ${n} characters`);
      } else {
        assert.ok(p.description.length >= 80 && p.description.length <= 170, `${l}/${kind} description ${p.description.length}`);
        assert.ok(words(pageText(p)) >= 520, `${l}/${kind} only ${words(pageText(p))} words`);
      }
      assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(p)));
    }
    assert.notEqual(c.pages.notepad.slug, c.pages.share.slug);
  });
}

for (const l of langs.filter((x) => x !== 'en')) {
  test(`${l}: notes links stay inside /${l}/ and related guides exist`, () => {
    const c = json(l);
    const guides = readdirSync(new URL(`../src/guides/${l}/`, import.meta.url)).map((f) => f.replace('.md', ''));
    for (const kind of KINDS) {
      const p = c.pages[kind];
      const html = [...p.steps, ...p.sections.flatMap((s) => s.paras), ...p.faq.map((f) => f.a)].join(' ');
      for (const [, h] of html.matchAll(/href="([^"]+)"/g)) assert.ok(h.startsWith(`/${l}/`), `${kind}: link ${h}`);
      for (const [, g] of html.matchAll(new RegExp(`href="/${l}/guides/([a-z0-9-]+)/"`, 'g'))) assert.ok(guides.includes(g), `guide ${g}`);
      assert.ok((p.relatedGuides ?? []).length >= 1, `${kind} has related guides`);
      for (const g of p.relatedGuides ?? []) assert.ok(guides.includes(g), `relatedGuides ${g}`);
    }
  });
}

for (const l of langs) {
  for (const kind of KINDS) {
    test(`${path(kind, l)}: built page, SEO tags, JSON-LD, reciprocal hreflang, sitemap, tool controls`, { skip }, () => {
      const p = path(kind, l);
      const html = read(`${p.slice(1)}index.html`);
      const c = json(l).pages[kind];
      assert.ok(html.includes(`<title>${c.title.replace(/&/g, '&amp;')}</title>`) || html.includes(`<title>${c.title}</title>`), 'title');
      assert.ok(html.includes(`<link rel="canonical" href="https://webclipboard.online${p}">`), 'canonical');
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
      for (const k of ['og:title', 'og:description', 'og:image', 'og:url']) assert.ok(html.includes(`property="${k}"`), k);
      const types = ld(html).map((x) => x['@type']);
      for (const k of ['WebApplication', 'BreadcrumbList', 'HowTo', 'FAQPage']) assert.ok(types.includes(k), `${k} in ${types}`);
      // hreflang pairs with the other language, both ways, plus x-default
      for (const o of langs) {
        const href = `https://webclipboard.online${path(kind, o)}`;
        assert.ok(html.includes(`rel="alternate" hreflang="${HREFLANG[o]}" href="${href}"`), `hreflang ${o}`);
        assert.ok(read(`${path(kind, o).slice(1)}index.html`).includes(`href="https://webclipboard.online${p}"`), `${o} links back`);
      }
      assert.ok(html.includes(`hreflang="x-default" href="https://webclipboard.online${path(kind, 'en')}"`), 'x-default');
      assert.ok(sitemapXml().includes(`<loc>https://webclipboard.online${p}</loc>`), 'in sitemap');
      if (kind === 'notepad') {
        for (const id of ['np-title', 'np-text', 'np-bar', 'np-view', 'np-preview', 'np-count', 'np-saved', 'np-download', 'np-menu', 'np-share', 'np-new', 'np-config']) assert.ok(html.includes(`id="${id}"`), `#${id}`);
        for (const f of ['bold', 'italic', 'h1', 'h2', 'bullet', 'number', 'check']) assert.ok(html.includes(`data-fmt="${f}"`), `button ${f}`);
        assert.ok(html.includes('data-clr-mask="true"'), 'text masked from session replay');
        assert.ok(!html.includes('id="tool-config"'), 'notepad page does not embed the clipboard config');
        const href = path('share', l);
        assert.ok(html.includes(`"shareHref":"${href}"`), 'share link target');
      } else {
        assert.ok(html.includes('data-note="1"'), 'note mode on');
        for (const id of ['note-bar', 'note-view', 'note-preview', 'text', 'send-btn', 'tool-config', 'opened-note']) assert.ok(html.includes(`id="${id}"`), `#${id}`);
        assert.ok(html.includes('data-fmt="bold"'));
      }
      // linked from the other notes page and from the language home page
      assert.ok(read(`${path(kind === 'notepad' ? 'share' : 'notepad', l).slice(1)}index.html`).includes(`href="${p}"`), 'linked from the sibling page');
      assert.ok(read(l === 'en' ? 'index.html' : `${l}/index.html`).includes(`href="${p}"`), 'linked from the home page');
    });
  }
}

test('English notes pages link to their guides, and the guides link back', { skip }, () => {
  for (const [kind, guide] of [['notepad', 'how-to-take-notes-online-without-an-account'], ['share', 'how-to-share-notes-online']]) {
    const html = read(`${path(kind, 'en').slice(1)}index.html`);
    assert.ok(html.includes(`href="/guides/${guide}/"`), `${kind} -> guide`);
    assert.ok(read(`guides/${guide}/index.html`).includes(`href="${path(kind, 'en')}"`), `guide -> ${kind}`);
  }
  for (const g of ['how-to-save-notes-as-pdf', 'how-to-convert-notes-to-word']) assert.ok(read(`guides/${g}/index.html`).includes('href="/online-notepad/"'), `${g} links to the notepad`);
});

for (const l of langs.filter((x) => x !== 'en')) {
  test(`${l}: notes pages link to their own guides, and those guides link back to a notes page`, { skip }, () => {
    for (const kind of KINDS) {
      const html = read(`${path(kind, l).slice(1)}index.html`);
      for (const g of json(l).pages[kind].relatedGuides) {
        assert.ok(html.includes(`href="/${l}/guides/${g}/"`), `${kind} -> ${g}`);
        const guide = read(`${l}/guides/${g}/index.html`);
        assert.ok(KINDS.some((k) => guide.includes(`href="${path(k, l)}"`)), `${g} links to a notes page`);
      }
    }
  });
}


test('the notes pages are listed on /tools/ in their own group, and the home page shows them', { skip }, () => {
  const tools = read('tools/index.html');
  for (const s of ['online-notepad', 'share-notes-online']) { assert.ok(tools.includes(`href="/${s}/"`), s); assert.ok(read('index.html').includes(`href="/${s}/"`), `${s} on home`); }
  assert.ok(tools.indexOf('>Notes<') > 0 && tools.indexOf('>Notes<') < tools.indexOf('>Move text between devices<'), 'Notes group comes first');
});

test('converter pages link to the notepad, and plain clipboard pages stay free of notes code', { skip }, () => {
  for (const s of ['text-to-pdf', 'text-to-word', 'markdown-to-pdf', 'markdown-to-word', 'word-counter']) assert.ok(read(`${s}/index.html`).includes('href="/online-notepad/"'), `${s} -> notepad`);
  const home = read('index.html');
  assert.ok(!home.includes('data-note="1"') && !home.includes('id="note-bar"'), 'home page is not in note mode');
  assert.ok(home.includes('id="opened-note"'), 'every clipboard can show a received note');
});
