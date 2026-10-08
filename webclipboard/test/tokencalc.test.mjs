import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as o200k from 'gpt-tokenizer/encoding/o200k_base';
import * as cl100k from 'gpt-tokenizer/encoding/cl100k_base';
import { parseNumber, cost, estimate, formatMoney, quickEstimate, countWords, groupTokens, windowUse } from '../src/lib/tokencalc.js';

const plain = { disallowedSpecial: new Set() };

test('real OpenAI tokenizers give the documented token ids', () => {
  assert.deepEqual(cl100k.encode('hello world'), [15339, 1917]);
  assert.deepEqual(o200k.encode('hello world'), [24912, 2375]);
  assert.equal(o200k.encode('', plain).length, 0);
});

test('special-token text is counted as ordinary text, never throws', () => {
  assert.ok(o200k.encode('a <|endoftext|> b', plain).length > 3);
  assert.ok(cl100k.encode('a <|endoftext|> b', plain).length > 3);
});

test('the same sentence costs more tokens in cl100k than o200k for non-Latin scripts', () => {
  const hindi = 'एक डिवाइस पर टेक्स्ट कॉपी करें और दूसरे पर पेस्ट करें – न ऐप, न अकाउंट।';
  assert.ok(cl100k.encode(hindi, plain).length > o200k.encode(hindi, plain).length * 2);
});

test('parseNumber', () => {
  assert.equal(parseNumber('2.50'), 2.5);
  assert.equal(parseNumber(' 2,5 '), 2.5);
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber(undefined)));
});

test('cost is tokens / 1M * price', () => {
  assert.equal(cost(1_000_000, 2.5), 2.5);
  assert.equal(cost(500_000, '10'), 5);
  assert.equal(cost(1000, 3), 0.003);
  assert.ok(Number.isNaN(cost(1000, '')));
  assert.ok(Number.isNaN(cost(1000, -1)));
});

test('estimate: input + output, scaled by requests, tolerant of missing prices', () => {
  const e = estimate({ inputTokens: 2000, outputTokens: 500, inputPrice: 2, outputPrice: 8, requests: 1000 });
  assert.ok(Math.abs(e.input - 0.004) < 1e-12);
  assert.ok(Math.abs(e.output - 0.004) < 1e-12);
  assert.ok(Math.abs(e.perRequest - 0.008) < 1e-12);
  assert.ok(Math.abs(e.total - 8) < 1e-9);
  const onlyInput = estimate({ inputTokens: 1_000_000, outputTokens: 0, inputPrice: 1, outputPrice: '' });
  assert.equal(onlyInput.perRequest, 1);
  assert.ok(Number.isNaN(estimate({ inputTokens: 5, outputTokens: 5, inputPrice: '', outputPrice: '' }).total));
  assert.equal(estimate({ inputTokens: 1, outputTokens: -5, inputPrice: 1, outputPrice: 1, requests: 0 }).requests, 1);
});

test('formatMoney keeps small values readable', () => {
  assert.equal(formatMoney(12.3456), '$12.35');
  assert.equal(formatMoney(0.5), '$0.50');
  assert.equal(formatMoney(0.0375), '$0.0375');
  assert.equal(formatMoney(0.000375), '$0.000375');
  assert.equal(formatMoney(0, '€'), '€0.00');
  assert.equal(formatMoney(NaN), '–');
  assert.equal(formatMoney(1234.5), '$1,234.50');
});

test('word, quick estimate and window helpers', () => {
  assert.equal(countWords('  one two\nthree '), 3);
  assert.equal(countWords(''), 0);
  assert.equal(quickEstimate('abcdefgh'), 2);
  assert.equal(quickEstimate(''), 0);
  assert.equal(windowUse(64_000, 128_000), 50);
});

test('groupTokens merges byte-fragment tokens so no replacement characters are shown', () => {
  const text = 'Hello 世界 🌍 👨‍👩‍👧‍👦 naïve';
  const ids = o200k.encode(text, plain);
  const groups = groupTokens(ids, o200k.decode);
  assert.equal(groups.map((g) => g.text).join(''), text);
  assert.ok(groups.every((g) => !g.text.includes('�')));
  assert.equal(groups.reduce((n, g) => n + g.ids.length, 0), ids.length);
});
