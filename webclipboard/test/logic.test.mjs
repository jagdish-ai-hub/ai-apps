import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomCode, validateCreate, isValidEnvelope, CODE_RE } from '../worker/clips.js';
import { negotiate, matchTag, langPath } from '../worker/lang.js';

test('randomCode is always 6 digits and well spread', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const c = randomCode();
    assert.match(c, CODE_RE);
    seen.add(c);
  }
  assert.ok(seen.size > 1900, 'codes should rarely collide');
});

test('validateCreate accepts a normal clip and rejects bad input', () => {
  assert.equal(validateCreate({ content: 'hi', expiry: '1d' }).ok, true);
  assert.equal(validateCreate({ content: '  ', expiry: '1d' }).error, 'empty');
  assert.equal(validateCreate({ content: 'x', expiry: '3y' }).error, 'bad_expiry');
  assert.equal(validateCreate({ content: 'x'.repeat(100_001), expiry: '1d' }).error, 'too_long');
  assert.equal(validateCreate({ content: 'x', expiry: '1d', burn: 'yes' }).error, 'bad_request');
  assert.equal(validateCreate(null).error, 'bad_request');
});

test('encrypted clips must carry a valid envelope', () => {
  const env = JSON.stringify({ v: 1, s: 'AAAA', i: 'BBBB', c: 'Y2lwaGVy' });
  assert.equal(isValidEnvelope(env), true);
  assert.equal(validateCreate({ content: env, expiry: '1h', encrypted: true }).ok, true);
  assert.equal(validateCreate({ content: 'plain text', expiry: '1h', encrypted: true }).error, 'bad_envelope');
  assert.equal(isValidEnvelope(JSON.stringify({ v: 2, s: 'AAAA', i: 'BBBB', c: 'AA' })), false);
  assert.equal(isValidEnvelope(JSON.stringify({ v: 1, s: '<script>', i: 'BBBB', c: 'AA' })), false);
});

test('language negotiation', () => {
  assert.equal(negotiate('ja,en;q=0.8'), 'ja');
  assert.equal(negotiate('pt-BR,pt;q=0.9'), 'pt');
  assert.equal(negotiate('zh-TW,zh;q=0.9'), 'zh-tw');
  assert.equal(negotiate('zh-Hant-HK'), 'zh-tw');
  assert.equal(negotiate('zh-CN'), 'zh-cn');
  assert.equal(negotiate('nb-NO'), 'no');
  assert.equal(negotiate('tl-PH'), 'fil');
  assert.equal(negotiate('xx,fr;q=0.5'), 'fr');
  assert.equal(negotiate('de;q=0,en'), 'en');
  assert.equal(negotiate(''), 'en');
  assert.equal(negotiate(null), 'en');
  assert.equal(matchTag('*'), null);
  assert.equal(langPath('en'), '/');
  assert.equal(langPath('es'), '/es/');
});
