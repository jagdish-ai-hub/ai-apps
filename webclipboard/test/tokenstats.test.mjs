import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as o200k from 'gpt-tokenizer/encoding/o200k_base';
import * as cl100k from 'gpt-tokenizer/encoding/cl100k_base';
import { computeRows, summarize, toCsv, toJson, corpusFor, CSV_COLUMNS } from '../src/lib/tokenstats.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const languages = read('../src/i18n/languages.json');
const messagesByCode = Object.fromEntries(languages.map((l) => [l.code, read(`../src/i18n/${l.code}.json`)]));
const rows = computeRows({ languages, messagesByCode, encoders: { o200k, cl100k } });
const plain = { disallowedSpecial: new Set() };

test('languages.json carries an English name and a script for every language', () => {
  for (const l of languages) {
    assert.ok(l.englishName && l.script, `${l.code} needs englishName and script`);
    assert.match(l.englishName, /^[A-Za-z() ]+$/);
  }
});

test('one row per language, English is the 1.00 baseline', () => {
  assert.equal(rows.length, languages.length);
  const en = rows.find((r) => r.code === 'en');
  assert.equal(en.ratioO, 1);
  assert.equal(en.ratioC, 1);
});

test('counts match an independent recount of the corpus', () => {
  for (const r of rows) {
    const text = corpusFor(messagesByCode[r.code]);
    assert.equal(r.chars, [...text].length, `${r.code} chars`);
    assert.equal(r.o200k, o200k.encode(text, plain).length, `${r.code} o200k`);
    assert.equal(r.cl100k, cl100k.encode(text, plain).length, `${r.code} cl100k`);
    assert.ok(r.o200k > 20 && r.cl100k > 20, `${r.code} corpus is too short to be meaningful`);
  }
});

test('derived fields are consistent', () => {
  const en = rows.find((r) => r.code === 'en');
  for (const r of rows) {
    assert.ok(Math.abs(r.ratioO - r.o200k / en.o200k) < 1e-12);
    assert.ok(Math.abs(r.charsPerTokenC - r.chars / r.cl100k) < 1e-12);
    assert.ok(Math.abs(r.saving - (1 - r.o200k / r.cl100k)) < 1e-12);
  }
});

test('summary figures agree with the rows', () => {
  const s = summarize(rows);
  const others = rows.filter((r) => r.code !== 'en');
  assert.equal(s.maxO.ratioO, Math.max(...others.map((r) => r.ratioO)));
  assert.equal(s.minC.ratioC, Math.min(...others.map((r) => r.ratioC)));
  assert.equal(s.others, others.length);
  assert.ok(s.maxC.ratioC >= s.maxO.ratioO - 1e-9 || s.maxC.ratioC > 1, 'cl100k worst case is not better than 1x');
  assert.ok(s.overallSaving > -0.01 && s.overallSaving < 1, 'overall saving is a sane fraction');
  assert.ok(s.medianRatioO > 0);
});

test('CSV is rectangular, quoted correctly and complete', () => {
  const csv = toCsv(rows).trim().split('\n');
  assert.equal(csv.length, rows.length + 1);
  assert.equal(csv[0].split(',').length, CSV_COLUMNS.length);
  const hindi = csv.find((l) => l.startsWith('hi,'));
  assert.ok(hindi.includes('Hindi') && hindi.includes('Devanagari'));
  const zhTw = csv.find((l) => l.startsWith('zh-tw,'));
  assert.ok(zhTw.includes('"Chinese (Traditional)"') === false, 'parentheses do not require quoting');
});

test('JSON export carries numbers as numbers and the metadata', () => {
  const j = JSON.parse(toJson(rows, { source: 'test' }));
  assert.equal(j.source, 'test');
  assert.equal(j.languages.length, rows.length);
  assert.equal(typeof j.languages[0].tokens_o200k_base, 'number');
  assert.equal(typeof j.languages[0].language, 'string');
});

test('the newer encoding does not cost more tokens than the older one for non-Latin scripts', () => {
  for (const r of rows.filter((x) => !['Latin'].includes(x.script))) assert.ok(r.o200k <= r.cl100k, `${r.code}: ${r.o200k} > ${r.cl100k}`);
});
