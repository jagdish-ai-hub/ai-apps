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
    // The iPhone-to-Windows page exists in other languages and declares them; every other tool page is English-only.
    if (t.slug !== 'iphone-to-windows-clipboard') assert.ok(!/<link rel="alternate" hreflang/.test(html), 'English-only page declares no hreflang');
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

// ------------------------------------------------------------------ natively written guides and landing pages

const LANGS = {
  ja: { cjk: true, minUnits: 1500 }, ko: { cjk: true, minUnits: 1500 },
  de: { cjk: false, minUnits: 650 }, es: { cjk: false, minUnits: 650 }, pt: { cjk: false, minUnits: 650 },
};
const guideDir = (l) => new URL(`../src/guides/${l}/`, import.meta.url);
const guideFiles = (l) => readdirSync(guideDir(l)).filter((f) => f.endsWith('.md'));
const wordsOf = (t) => t.replace(/[#*|`>\[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
// Slugs that every language must have (the English originals' topics) plus the new pages Japanese has.
const CORE = ['copy-text-between-iphone-and-windows', 'send-text-from-phone-to-pc', 'share-wifi-password'];

for (const [lang, cfg] of Object.entries(LANGS)) {
  test(`${lang}: has the core guides`, () => {
    for (const slug of CORE) assert.ok(guideFiles(lang).includes(`${slug}.md`), `${lang}/${slug}.md missing`);
  });

  for (const f of guideFiles(lang)) {
    test(`${lang}/${f}: frontmatter, enough text, links stay inside /${lang}/`, () => {
      const raw = readFileSync(new URL(f, guideDir(lang)), 'utf8');
      const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
      assert.ok(m, 'frontmatter');
      const meta = load(m[1]);
      for (const k of ['title', 'description', 'h1', 'lead', 'category', 'updated', 'related', 'faq']) assert.ok(meta[k], `missing ${k}`);
      assert.ok(meta.title.length <= (cfg.cjk ? 60 : 70), `title ${meta.title.length}`);
      assert.ok(meta.description.length >= (cfg.cjk ? 50 : 80) && meta.description.length <= (cfg.cjk ? 140 : 170), `description ${meta.description.length}`);
      const units = cfg.cjk ? m[2].replace(/\s/g, '').length : wordsOf(m[2]);
      assert.ok(units >= cfg.minUnits, `only ${units} ${cfg.cjk ? 'characters' : 'words'}`);
      assert.ok((m[2].match(/^## /gm) || []).length >= 4, 'at least 4 sections');
      assert.ok(meta.faq.length >= 3 && meta.faq.every((x) => x.q && x.a), 'FAQ');
      assert.ok(!/\]\(\/guides\//.test(m[2]), 'must not link to English guide URLs');
      const files = guideFiles(lang);
      for (const [, s] of m[2].matchAll(new RegExp(`\\]\\(/${lang}/guides/([a-z0-9-]+)/\\)`, 'g'))) assert.ok(files.includes(`${s}.md`), `broken link to /${lang}/guides/${s}/`);
      for (const r of meta.related) assert.ok(files.includes(`${r}.md`) && r !== f.replace(/\.md$/, ''), `related ${r}`);
      assert.ok(!/NaN|undefined|\[object/.test(raw), 'no template leftovers');
    });
  }

  test(`${lang}: landing JSON is complete and long enough`, () => {
    const d = JSON.parse(readFileSync(new URL(`../src/landings/${lang}.json`, import.meta.url), 'utf8'));
    for (const k of ['title', 'description', 'h1', 'lead', 'eyebrow', 'steps', 'sections', 'faq', 'relatedGuides', 'shareText']) assert.ok(d[k] && (typeof d[k] === 'string' || d[k].length), `missing ${k}`);
    assert.ok(d.steps.length >= 4 && d.sections.length >= 4 && d.faq.length >= 5);
    const all = [d.lead, ...d.steps, ...d.sections.flatMap((s) => [s.h2, ...s.paras]), ...d.faq.flatMap((f) => [f.q, f.a])].join(' ').replace(/<[^>]+>/g, ' ');
    const units = cfg.cjk ? all.replace(/\s/g, '').length : wordsOf(all);
    assert.ok(units >= (cfg.cjk ? 1500 : 600), `landing text too short: ${units}`);
    assert.ok(d.title.length <= 70 && d.description.length <= 170, 'title/description length');
    for (const g of d.relatedGuides) assert.ok(guideFiles(lang).includes(`${g}.md`), `relatedGuides ${g}`);
    for (const html of [...d.steps, ...d.sections.flatMap((s) => s.paras)]) for (const [, h] of html.matchAll(/href="([^"]+)"/g)) assert.ok(h.startsWith(`/${lang}/`) || h.startsWith('/text-to-') || h === '/', `unexpected link ${h}`);
  });

  test(`${lang}: built pages, hreflang pairs (both directions), sitemap, nav`, { skip }, () => {
    const sitemap = read('sitemap.xml');
    for (const f of guideFiles(lang)) {
      const slug = f.replace(/\.md$/, '');
      const page = read(`${lang}/guides/${slug}/index.html`);
      assert.ok(new RegExp(`<html lang="${lang === 'pt' ? 'pt-BR' : lang}"`).test(page), 'html lang');
      assert.ok(page.includes(`<link rel="canonical" href="https://webclipboard.online/${lang}/guides/${slug}/">`));
      const hasEn = existsSync(new URL(`../src/guides/${slug}.md`, import.meta.url));
      if (hasEn) {
        const en = read(`guides/${slug}/index.html`);
        for (const html of [page, en]) {
          assert.ok(html.includes(`hreflang="${lang}" href="https://webclipboard.online/${lang}/guides/${slug}/"`), `${lang} alternate`);
          assert.ok(html.includes(`hreflang="en" href="https://webclipboard.online/guides/${slug}/"`), 'en alternate');
          assert.ok(html.includes(`hreflang="x-default" href="https://webclipboard.online/guides/${slug}/"`), 'x-default');
        }
      }
      assert.ok(sitemap.includes(`<loc>https://webclipboard.online/${lang}/guides/${slug}/</loc>`), 'sitemap');
      const types = ld(page).map((x) => x['@type']);
      for (const k of ['Article', 'BreadcrumbList', 'FAQPage']) assert.ok(types.includes(k), k);
    }
    const hub = read(`${lang}/guides/index.html`);
    for (const f of guideFiles(lang)) assert.ok(hub.includes(`href="/${lang}/guides/${f.replace(/\.md$/, '')}/"`));
    assert.ok(sitemap.includes(`<loc>https://webclipboard.online/${lang}/guides/</loc>`));
    assert.ok(read(`${lang}/index.html`).includes(`href="/${lang}/guides/"`), 'home links to the guides');

    // landing page
    const land = read(`${lang}/iphone-to-windows-clipboard/index.html`);
    assert.ok(land.includes(`<link rel="canonical" href="https://webclipboard.online/${lang}/iphone-to-windows-clipboard/">`));
    const en = read('iphone-to-windows-clipboard/index.html');
    for (const html of [land, en]) {
      assert.ok(html.includes(`hreflang="${lang}" href="https://webclipboard.online/${lang}/iphone-to-windows-clipboard/"`), 'landing alternate');
      assert.ok(html.includes('hreflang="x-default" href="https://webclipboard.online/iphone-to-windows-clipboard/"'));
    }
    const lt = ld(land).map((x) => x['@type']);
    for (const k of ['WebApplication', 'BreadcrumbList', 'HowTo', 'FAQPage']) assert.ok(lt.includes(k), `landing ${k}`);
    assert.ok(land.includes('id="send-form"'), 'landing embeds the clipboard');
    assert.ok(sitemap.includes(`<loc>https://webclipboard.online/${lang}/iphone-to-windows-clipboard/</loc>`));
  });
}

test('Japanese has the four iPhone-to-Windows guides on top of the core three', () => {
  for (const g of ['send-a-link-from-iphone-to-pc', 'iphone-to-windows-without-icloud', 'what-phone-link-can-do-with-iphone', 'will-windows-get-iphone-clipboard-sync']) assert.ok(guideFiles('ja').includes(`${g}.md`), g);
});

test('Languages without guides do not link to guides', { skip }, () => {
  assert.ok(!read('fr/index.html').includes('href="/fr/guides/"') && !/href="\/guides\/"/.test(read('fr/index.html')));
});

test('Japanese home page has the longer FAQ in both the page and the FAQPage data', { skip }, () => {
  const html = read('ja/index.html');
  const faq = ld(html).find((x) => x['@type'] === 'FAQPage');
  assert.ok(faq.mainEntity.length >= 12, `${faq.mainEntity.length} questions`);
  assert.equal((html.match(/<details>/g) || []).length, faq.mainEntity.length);
});


// ------------------------------------------------------------------ per-language token pages (/tokens-in/<language>/)

const tokenLangSrc = readFileSync(new URL('../src/lib/tokenlangs.ts', import.meta.url), 'utf8');
const tokenLangs = [...tokenLangSrc.matchAll(/\{ slug: '([a-z-]+)', code: '([a-z-]+)', family/g)].map((m) => ({ slug: m[1], code: m[2] }));

test('token language pages are registered', () => assert.ok(tokenLangs.length >= 12, `found ${tokenLangs.length}`));

for (const l of tokenLangs) {
  test(`/tokens-in/${l.slug}/: SEO basics, data matches the CSV, enough real content`, { skip }, () => {
    const html = read(`tokens-in/${l.slug}/index.html`);
    const title = /<title>([^<]*)<\/title>/.exec(html)[1];
    const desc = /<meta name="description" content="([^"]*)"/.exec(html)[1];
    assert.ok(title.length <= 70, `title ${title.length}`);
    assert.ok(desc.length >= 80 && desc.length <= 170, `description ${desc.length}`);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="https://webclipboard.online/tokens-in/${l.slug}/">`));
    assert.ok(!/<link rel="alternate" hreflang/.test(html));
    const types = ld(html).map((x) => x['@type']);
    for (const k of ['Article', 'BreadcrumbList', 'FAQPage']) assert.ok(types.includes(k), k);
    assert.ok(text(html).split(' ').length >= 600, 'enough words');
    assert.ok(!/NaN|undefined|\[object Object\]/.test(text(html)));
    // The numbers on the page are the numbers in the downloadable data.
    const csv = read('data/token-cost-by-language.csv').trim().split('\n');
    const head = csv[0].split(',');
    const row = csv.find((x) => x.startsWith(`${l.code},`)).split(',');
    const get = (k) => row[head.indexOf(k)];
    const t = text(html);
    assert.ok(t.includes(`${Number(get('ratio_vs_english_o200k_base')).toFixed(2)}×`), 'o200k ratio matches CSV');
    assert.ok(t.includes(`${Number(get('ratio_vs_english_cl100k_base')).toFixed(2)}×`), 'cl100k ratio matches CSV');
    assert.ok(t.includes(`${get('tokens_o200k_base')} tokens`) && t.includes(`${get('tokens_cl100k_base')} tokens`), 'token counts match CSV');
    assert.ok(read('sitemap.xml').includes(`<loc>https://webclipboard.online/tokens-in/${l.slug}/</loc>`), 'in sitemap');
    assert.ok(read('token-cost-by-language/index.html').includes(`href="/tokens-in/${l.slug}/"`), 'linked from the data page');
    assert.ok(html.includes('class="tk a"'), 'token chips rendered');
  });
}
