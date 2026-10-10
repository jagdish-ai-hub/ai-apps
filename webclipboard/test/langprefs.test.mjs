import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { detectLanguage } from '../src/lib/langmatch.js';
import { negotiate } from '../worker/lang.js';

const languages = JSON.parse(readFileSync(new URL('../src/i18n/languages.json', import.meta.url), 'utf8'));
const CODES = languages.map((l) => l.code);

test('detectLanguage: first supported-or-English preference wins', () => {
  const d = (...tags) => detectLanguage(tags, CODES);
  assert.equal(d('es-MX', 'en'), 'es');
  assert.equal(d('en-US', 'es'), 'en', 'English first means stay English');
  assert.equal(d('en'), 'en');
  assert.equal(d('pt-BR'), 'pt');
  assert.equal(d('pt-PT'), 'pt');
  assert.equal(d('zh-TW'), 'zh-tw');
  assert.equal(d('zh-Hant-HK'), 'zh-tw');
  assert.equal(d('zh-HK'), 'zh-tw');
  assert.equal(d('zh-CN'), 'zh-cn');
  assert.equal(d('zh'), 'zh-cn');
  assert.equal(d('nb-NO'), 'no');
  assert.equal(d('nn'), 'no');
  assert.equal(d('tl'), 'fil');
  assert.equal(d('fil-PH'), 'fil');
  assert.equal(d('ja_JP'), 'ja');
  assert.equal(d('ar', 'fr'), 'fr', 'unsupported languages are skipped');
  assert.equal(d('xx', 'yy'), 'en', 'nothing supported falls back to English');
  assert.equal(d(), 'en');
  assert.equal(d('', 'de'), 'de');
});

test('browser-side detection agrees with the server-side Accept-Language negotiation for single tags', () => {
  for (const tag of ['es', 'es-AR', 'pt-BR', 'fr-CA', 'de-AT', 'zh-TW', 'zh-CN', 'zh-Hant', 'nb', 'nn', 'tl', 'ja', 'ko', 'hi', 'bn', 'th', 'vi', 'id', 'ms', 'ru', 'uk', 'tr', 'el', 'ar', 'he', 'sw']) {
    assert.equal(detectLanguage([tag], CODES), negotiate(tag), tag);
  }
});

test('the two Filipino codes: html lang stays fil, hreflang uses the ISO 639-1 code Google documents', () => {
  const fil = languages.find((l) => l.code === 'fil');
  assert.equal(fil.htmlLang, 'fil');
  assert.equal(fil.hreflang, 'tl');
});

// ---- the shipped code, executed -------------------------------------------------------------
const dist = new URL('../dist/', import.meta.url);
const built = existsSync(new URL('index.html', dist));
const skip = !built && 'run `npm run build` first';
const inlineRedirect = () => /<script>(\(function\(\)\{try\{if\(location\.pathname[\s\S]*?)<\/script>/.exec(readFileSync(new URL('index.html', dist), 'utf8'))?.[1];

function run({ languages: langs = ['en-US'], pref = null, path = '/', search = '', hash = '', failStorage = false }) {
  const calls = { replaced: null, session: {} };
  const ctx = {
    location: { pathname: path, search, hash, replace: (u) => { calls.replaced = u; } },
    navigator: { languages: langs, language: langs[0] },
    localStorage: failStorage ? { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} } : { getItem: (k) => (k === 'wc-lang' ? pref : null), setItem() {}, removeItem() {} },
    sessionStorage: { setItem: (k, v) => { calls.session[k] = v; } },
  };
  vm.runInNewContext(inlineRedirect(), ctx);
  return calls;
}

test('built homepage: inline redirect exists on "/" only', { skip }, () => {
  assert.ok(inlineRedirect(), 'redirect script found in dist/index.html');
  for (const f of ['es/index.html', 'ja/index.html', 'guides/index.html', 'token-calculator/index.html', 'privacy/index.html']) {
    assert.ok(!readFileSync(new URL(f, dist), 'utf8').includes("location.replace('/'+t+'/'"), `${f} must not redirect`);
  }
});

test('built redirect: browser language sends first-time visitors to their language, keeping query and #code', { skip }, () => {
  assert.equal(run({ languages: ['es-ES', 'en'] }).replaced, '/es/');
  assert.equal(run({ languages: ['ja'], hash: '#123456' }).replaced, '/ja/#123456');
  assert.equal(run({ languages: ['de-DE'], search: '?utm_source=x', hash: '#9' }).replaced, '/de/?utm_source=x#9');
  assert.equal(run({ languages: ['zh-TW'] }).replaced, '/zh-tw/');
  assert.equal(run({ languages: ['pt-BR'] }).session['wc-auto'], 'pt:browser', 'remembers that this was automatic, for the banner');
});

test('built redirect: English visitors, crawlers and unsupported languages stay put', { skip }, () => {
  assert.equal(run({ languages: ['en-US'] }).replaced, null);
  assert.equal(run({ languages: ['en-GB', 'fr'] }).replaced, null);
  assert.equal(run({ languages: ['ar'] }).replaced, null);
  assert.equal(run({ languages: [] }).replaced, null);
});

test('built redirect: a saved choice beats the browser language, in both directions', { skip }, () => {
  assert.equal(run({ languages: ['en-US'], pref: 'it' }).replaced, '/it/');
  assert.equal(run({ languages: ['es'], pref: 'en' }).replaced, null, 'chose English explicitly');
  assert.equal(run({ languages: ['es'], pref: 'bogus' }).replaced, '/es/', 'an invalid saved value is ignored');
  assert.equal(run({ languages: ['fr'], pref: 'de' }).session['wc-auto'], 'de:saved');
});

test('built redirect: never runs off the homepage, never throws when storage is blocked', { skip }, () => {
  assert.equal(run({ languages: ['es'], path: '/guides/' }).replaced, null);
  assert.equal(run({ languages: ['es'], path: '/es/' }).replaced, null);
  assert.equal(run({ languages: ['es'], failStorage: true }).replaced, null, 'blocked storage: do not redirect, a choice could not be remembered');
});

test('built site: lang-ui.json holds every language with all strings; menus carry language codes', { skip }, () => {
  const ui = JSON.parse(readFileSync(new URL('lang-ui.json', dist), 'utf8'));
  assert.deepEqual(Object.keys(ui).sort(), [...CODES].sort());
  for (const [code, e] of Object.entries(ui)) {
    for (const k of ['name', 'path', 'auto', 'back', 'suggest', 'close']) assert.ok(e[k] && [...e[k]].length >= 1, `${code}.${k}`);
    assert.equal(e.path, code === 'en' ? '/' : `/${code}/`);
  }
  const html = readFileSync(new URL('es/index.html', dist), 'utf8');
  assert.equal((html.match(/<option value="[^"]*" data-code="/g) || []).length, CODES.length);
  assert.equal((html.match(/<a href="[^"]*" hreflang="[^"]*" lang="[^"]*" data-code="/g) || []).length, CODES.length);
});

test('built site: hreflang and titles are consistent for every language', { skip }, () => {
  const home = readFileSync(new URL('index.html', dist), 'utf8');
  for (const l of languages) {
    assert.ok(home.includes(`<link rel="alternate" hreflang="${l.hreflang}" href="https://webclipboard.online/${l.code === 'en' ? '' : l.code + '/'}">`), `hreflang ${l.hreflang}`);
  }
  assert.ok(!home.includes('hreflang="fil"') || !/<link rel="alternate" hreflang="fil"/.test(home), 'no three-letter fil alternate');
  assert.ok(home.includes('hreflang="x-default"'));
});
