import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const built = existsSync(new URL('index.html', dist));
const skip = !built && 'run `npm run build` first';

function htmlFiles(dir = dist, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) htmlFiles(u, acc);
    else if (e.name.endsWith('.html')) acc.push(u);
  }
  return acc;
}
const meta = (html, attr, name) => new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1];
const pngSize = (path) => { const d = readFileSync(path); return { w: d.readUInt32BE(16), h: d.readUInt32BE(20), bytes: d.length, sig: d.subarray(1, 4).toString() }; };

test('every indexable page has complete link-preview tags (WhatsApp, Telegram, Facebook, X, LinkedIn)', { skip }, () => {
  const problems = [];
  for (const f of htmlFiles()) {
    const html = readFileSync(f, 'utf8');
    const rel = f.pathname.split('/dist/')[1];
    if (/name="robots" content="noindex/.test(html)) continue; // 404 page
    const need = { 'og:title': 'property', 'og:description': 'property', 'og:url': 'property', 'og:image': 'property', 'og:image:alt': 'property', 'og:type': 'property', 'og:site_name': 'property', 'twitter:card': 'name', 'twitter:image': 'name' };
    for (const [tag, attr] of Object.entries(need)) if (!meta(html, attr, tag)) problems.push(`${rel}: missing ${tag}`);
    const img = meta(html, 'property', 'og:image');
    if (img && !/^https:\/\/webclipboard\.online\/[^ ]+\.png$/.test(img)) problems.push(`${rel}: og:image must be an absolute https png url (${img})`);
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    if (canonical && meta(html, 'property', 'og:url') !== canonical) problems.push(`${rel}: og:url differs from canonical`);
    if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') problems.push(`${rel}: twitter:card`);
    const t = meta(html, 'property', 'og:title');
    if (t && t.length > 100) problems.push(`${rel}: og:title is long (${t.length}); previews truncate it`);
  }
  assert.deepEqual(problems, []);
});

test('the preview image exists in dist, is 1200x630 PNG and light enough for WhatsApp (under 300 KB)', { skip }, () => {
  const imgs = new Set();
  for (const f of htmlFiles()) {
    const m = /<meta property="og:image" content="https:\/\/webclipboard\.online(\/[^"]+)"/.exec(readFileSync(f, 'utf8'));
    if (m) imgs.add(m[1]);
  }
  assert.ok(imgs.size >= 1);
  for (const path of imgs) {
    const file = new URL(path.slice(1), dist);
    assert.ok(existsSync(file), `${path} is referenced but not built`);
    const { w, h, bytes, sig } = pngSize(file);
    assert.equal(sig, 'PNG');
    assert.equal(`${w}x${h}`, '1200x630');
    assert.ok(bytes < 300 * 1024, `${path} is ${(bytes / 1024).toFixed(0)} KB`);
  }
});

test('home-screen icons referenced by the manifest exist', { skip }, () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', dist), 'utf8'));
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src.slice(1), dist)), icon.src);
  for (const f of ['favicon.svg', 'apple-touch-icon.png']) assert.ok(statSync(new URL(f, dist)).size > 100, f);
});

test('Bing Webmaster verification tag is on the homepage and every other page', { skip }, () => {
  const cfg = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
  assert.match(cfg.bingSiteVerification, /^[0-9A-F]{32}$/);
  const tag = `<meta name="msvalidate.01" content="${cfg.bingSiteVerification}">`;
  for (const f of htmlFiles()) assert.ok(readFileSync(f, 'utf8').includes(tag), `${f.pathname.split('/dist/')[1]} is missing the Bing tag`);
});
