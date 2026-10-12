import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCode, decodeCode, LANGUAGES, languageById, MARKER_LENGTH } from '../src/lib/codeclip.js';

test('encode/decode round trip keeps the code exactly', () => {
  const code = 'def f(x):\n    return x  # <b>ok</b> & "quotes"\n\n';
  for (const l of LANGUAGES) {
    const enc = encodeCode(code, l.id);
    assert.ok(enc.endsWith(code) && enc.length === code.length + MARKER_LENGTH(l.id));
    assert.deepEqual(decodeCode(enc), { lang: l.id, text: code });
  }
});
test('the marker is invisible text characters only plus the language id', () => {
  const enc = encodeCode('x', 'python');
  assert.equal(enc.replace(/⁣/g, ''), 'wc-code:python\nx');
});
test('plain text and unknown languages are stored as they are', () => {
  assert.equal(encodeCode('hello', 'plain'), 'hello');
  assert.equal(encodeCode('hello', 'klingon'), 'hello');
  assert.equal(decodeCode('hello'), null);
  assert.equal(decodeCode('wc-code:python\nx'), null, 'the marker needs the invisible separators');
  assert.equal(decodeCode('⁣wc-code:klingon⁣\nx'), null, 'unknown language is shown as ordinary text');
  assert.equal(decodeCode(''), null);
  assert.equal(decodeCode(undefined), null);
});
test('language table is sane', () => {
  assert.equal(new Set(LANGUAGES.map((l) => l.id)).size, LANGUAGES.length);
  assert.ok(LANGUAGES.every((l) => /^[a-z0-9+#-]{1,20}$/.test(l.id) && l.ext && l.hljs));
  assert.equal(languageById('go').ext, 'go');
});
