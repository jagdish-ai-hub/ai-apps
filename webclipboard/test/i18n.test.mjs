import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const languages = read('../src/i18n/languages.json');
const en = read('../src/i18n/en.json');
const UNUSED_OK = new Set(['langSuggest']); // present in en.json, not rendered anywhere

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
    assert.ok(t.metaTitle.length <= 90, `${l.code}: metaTitle too long (${t.metaTitle.length})`);
    assert.ok(t.metaDescription.length <= 320, `${l.code}: metaDescription too long (${t.metaDescription.length})`);
  });
}
