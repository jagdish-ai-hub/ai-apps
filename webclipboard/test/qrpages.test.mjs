import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const skip = !existsSync(new URL('index.html', dist)) && 'run `npm run build` first';
const read = (p) => readFileSync(new URL(p, dist), 'utf8');
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const json = (l) => JSON.parse(readFileSync(new URL(`../src/qr/${l}.json`, import.meta.url), 'utf8'));

const SLUGS = { text: 'qr-code-generator', url: 'url-to-qr-code', wifi: 'wifi-qr-code-generator' };
const langs = readdirSync(new URL('../src/qr/', import.meta.url)).map((f) => f.replace('.json', ''));
const native = langs.filter((l) => l !== 'en');
const CJK = new Set(['ja', 'ko']);
const en = json('en');
const words = (t) => t.split(/\s+/).filter(Boolean).length;
const plain = (html) => html.replace(/<[^>]+>/g, ' ');
const pageText = (p) => plain([p.lead, ...p.steps, ...p.sections.flatMap((s) => [s.h2, ...s.paras]), ...p.faq.flatMap((f) => [f.q, f.a])].join(' '));

test('QR content exists for English and the native languages', () => {
  assert.ok(langs.includes('en'));
  for (const l of ['ja', 'ko', 'de', 'es', 'pt']) assert.ok(native.includes(l), `${l}.json`);
});

for (const l of langs) {
  const c = json(l);
  test(`${l}: QR content has the same ui keys as English and complete pages`, () => {
    assert.deepEqual(Object.keys(c.ui).sort(), Object.keys(en.ui).sort(), 'ui keys');
    assert.deepEqual(Object.keys(c.ui.names).sort(), ['text', 'url', 'wifi']);
    for (const [k, v] of Object.entries(c.ui)) if (k !== 'names') assert.ok(typeof v === 'string' && v.trim(), `${l} ui.${k}`);
    assert.equal(c.ui.urlSample, 'https://webclipboard.online');
    for (const kind of Object.keys(SLUGS)) {
      const p = c.pages[kind];
      for (const k of ['title', 'description', 'h1', 'lead', 'eyebrow']) assert.ok(p[k] && p[k].trim(), `${kind}.${k}`);
      assert.equal(p.steps.length, 4); assert.equal(p.sections.length, 4); assert.equal(p.faq.length, 6);
      assert.ok(p.title.length <= 70, `${l}/${kind} title ${p.title.length}`);
      assert.ok(p.description.length >= (CJK.has(l) ? 50 : 80) && p.description.length <= (CJK.has(l) ? 140 : 170), `${l}/${kind} description ${p.description.length}`);
      const t = pageText(p);
      if (CJK.has(l)) assert.ok(t.replace(/\s/g, '').length >= 1500, `${l}/${kind} only ${t.replace(/\s/g, '').length} characters`);
      else assert.ok(words(t) >= 520, `${l}/${kind} only ${words(t)} words`);
      assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(p)));
    }
    assert.ok(c.pages.wifi.sections.flatMap((s) => s.paras).join(' ').includes('WIFI:T:WPA;S:MyNetwork;P:mypassword;;'), 'example payload present');
  });
  if (l !== 'en') {
    test(`${l}: links stay inside /${l}/ and related guides exist`, () => {
      const allowedPrefix = `/${l}/`;
      const guides = readdirSync(new URL(`../src/guides/${l}/`, import.meta.url)).map((f) => f.replace('.md', ''));
      for (const kind of Object.keys(SLUGS)) {
        const p = c.pages[kind];
        const html = [...p.steps, ...p.sections.flatMap((s) => s.paras), ...p.faq.map((f) => f.a)].join(' ');
        for (const [, h] of html.matchAll(/href="([^"]+)"/g)) assert.ok(h.startsWith(allowedPrefix), `${l}/${kind}: link ${h}`);
        for (const [, h] of html.matchAll(/href="\/[a-z]{2}\/guides\/([a-z0-9-]+)\/"/g)) assert.ok(guides.includes(h), `${l}: guide ${h} missing`);
        for (const g of p.relatedGuides ?? []) assert.ok(guides.includes(g), `${l}: relatedGuides ${g}`);
      }
    });
  }
}

for (const l of native) {
  for (const [kind, slug] of Object.entries(SLUGS)) {
    test(`/${l}/${slug}/: built page, hreflang pairs with English and every other language, sitemap, JSON-LD`, { skip }, () => {
      const html = read(`${l}/${slug}/index.html`);
      assert.match(html, new RegExp(`<html lang="${l === 'pt' ? 'pt-BR' : l}"`));
      assert.ok(html.includes(`<link rel="canonical" href="https://webclipboard.online/${l}/${slug}/">`));
      assert.ok(html.includes('id="qr-config"') && html.includes('id="qr-preview"'), 'embeds the generator');
      assert.ok(html.includes(`data-kind="${kind}"`));
      const enHtml = read(`${slug}/index.html`);
      for (const h of [html, enHtml]) {
        for (const x of langs) assert.ok(h.includes(`<link rel="alternate" hreflang="${x === 'zh' ? 'zh' : x}" href="https://webclipboard.online/${x === 'en' ? '' : `${x}/`}${slug}/">`), `${x} alternate`);
        assert.ok(h.includes(`hreflang="x-default" href="https://webclipboard.online/${slug}/"`));
      }
      assert.ok(read('sitemap.xml').includes(`<loc>https://webclipboard.online/${l}/${slug}/</loc>`));
      const types = ld(html).map((x) => x['@type']);
      for (const k of ['WebApplication', 'BreadcrumbList', 'HowTo', 'FAQPage']) assert.ok(types.includes(k), k);
      assert.equal(ld(html).find((x) => x['@type'] === 'WebApplication').inLanguage, l === 'pt' ? 'pt-BR' : l);
    });
  }
}

test('QR pages are listed on /tools/ and the English pages embed the generator', { skip }, () => {
  const hub = read('tools/index.html');
  for (const [kind, slug] of Object.entries(SLUGS)) {
    assert.ok(hub.includes(`href="/${slug}/"`), slug);
    const html = read(`${slug}/index.html`);
    assert.ok(html.includes(`data-kind="${kind}"`) && html.includes('id="qr-png"') && html.includes('id="qr-svg"'));
    assert.ok(html.includes('data-clr-mask="true"') || kind === 'url', 'inputs masked from session replay');
  }
  assert.ok(read('qr-code-generator/index.html').includes('id="qr-text"'));
  assert.ok(read('url-to-qr-code/index.html').includes('id="qr-url"'));
  const wifi = read('wifi-qr-code-generator/index.html');
  for (const id of ['qr-ssid', 'qr-pass', 'qr-sec', 'qr-hidden']) assert.ok(wifi.includes(`id="${id}"`), id);
  assert.ok(/id="qr-pass"[^>]*data-clr-mask="true"/.test(wifi) || /data-clr-mask="true"[^>]*id="qr-pass"/.test(wifi), 'Wi-Fi password masked from session replay');
});

// ------------------------------------------------------------------ code share page
test('/code-share/: editor, language list, highlighting assets and the highlighted receive view are wired', { skip }, () => {
  const html = read('code-share/index.html');
  for (const id of ['code-editor', 'code-lang', 'ce-code', 'text', 'send-btn', 'opened-lang', 'dl-code']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes('data-code="1"'));
  for (const l of ['JavaScript', 'Python', 'SQL', 'Rust', 'Auto-detect', 'Plain text']) assert.ok(html.includes(l), l);
  const types = ld(html).map((x) => x['@type']);
  for (const k of ['WebApplication', 'BreadcrumbList', 'HowTo', 'FAQPage']) assert.ok(types.includes(k), k);
  assert.ok(/data-clr-mask="true"[^>]*id="text"|id="text"[^>]*data-clr-mask="true"/.test(html), 'code box masked from session replay');
  // the ordinary clipboard page never ships the editor, but can still show a received code clip highlighted
  const home = read('index.html');
  assert.ok(!home.includes('id="code-editor"') && !home.includes('id="code-lang"'));
  assert.ok(home.includes('id="opened-lang"') && home.includes('id="dl-code"'));
  assert.ok(read('tools/index.html').includes('href="/code-share/"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://webclipboard.online/code-share/</loc>'));
  assert.ok(read('guides/how-to-share-code-online-with-syntax-highlighting/index.html').includes('href="/code-share/"'));
});
