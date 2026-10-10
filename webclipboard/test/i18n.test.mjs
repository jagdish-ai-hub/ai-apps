import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const languages = read('../src/i18n/languages.json');
const en = read('../src/i18n/en.json');
// Strings that exist only in English on purpose (the "back to English" banner is always English).
const UNUSED_OK = new Set(['langAuto', 'langBack']);

// Approximate width of a search-result title: CJK and fullwidth characters count double, Thai/Devanagari/Bengali letters 1.5,
// combining marks 0. Google truncates around 600px, roughly 60 units.
const titleWidth = (t) => [...t].reduce((w, ch) => {
  const o = ch.codePointAt(0);
  if (/\p{M}/u.test(ch)) return w;
  if ((o >= 0x3040 && o <= 0x30ff) || (o >= 0x4e00 && o <= 0x9fff) || (o >= 0xac00 && o <= 0xd7af) || (o >= 0xff00 && o <= 0xffef)) return w + 2;
  if ((o >= 0x0e00 && o <= 0x0e7f) || (o >= 0x0900 && o <= 0x09ff) || (o >= 0x0980 && o <= 0x09ff)) return w + 1.5;
  return w + 1;
}, 0);

test('every language in languages.json has a translation file (the short-link redirect relies on it)', () => {
  for (const l of languages) assert.ok(existsSync(new URL(`../src/i18n/${l.code}.json`, import.meta.url)), `missing ${l.code}.json`);
});

for (const l of languages.filter((x) => x.code !== 'en')) {
  test(`${l.code}: same keys, array lengths and placeholders as English`, () => {
    const t = read(`../src/i18n/${l.code}.json`);
    for (const key of Object.keys(en)) {
      if (UNUSED_OK.has(key)) continue;
      assert.ok(key in t, `${l.code}: missing key "${key}"`);
      if (Array.isArray(en[key])) {
        assert.equal(t[key].length, en[key].length, `${l.code}: "${key}" length`);
        en[key].forEach((item, i) => {
          if (typeof item === 'object') assert.deepEqual(Object.keys(t[key][i]).sort(), Object.keys(item).sort(), `${l.code}: "${key}[${i}]" shape`);
        });
      } else {
        assert.equal(typeof t[key], 'string', `${l.code}: "${key}" must be a string`);
        assert.ok(t[key].trim().length > 0, `${l.code}: "${key}" empty`);
      }
    }
    assert.ok(t.errTooLong.includes('{max}'), `${l.code}: errTooLong lost {max}`);
    assert.ok(JSON.stringify(t.faq).includes('{max}'), `${l.code}: FAQ lost {max}`);
    assert.notEqual(t.metaTitle, en.metaTitle, `${l.code}: metaTitle not translated`);
    assert.ok(titleWidth(t.metaTitle) <= 60, `${l.code}: metaTitle too wide for a search result (${titleWidth(t.metaTitle)} units): ${t.metaTitle}`);
    for (const k of ['langSuggest']) assert.ok(t[k] && [...t[k]].length >= 4 && t[k] !== en[k], `${l.code}: ${k} must be translated`);
    assert.ok(t.metaDescription.length <= 320, `${l.code}: metaDescription too long (${t.metaDescription.length})`);
  });
}
