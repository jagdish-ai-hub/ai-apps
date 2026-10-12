import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as o200k from 'gpt-tokenizer/encoding/o200k_base';
import { analyze, wordList, countSentences, countParagraphs, topWords, formatDuration } from '../src/lib/textstats.js';
import * as C from '../src/lib/casing.js';
import { chunkText, toJsonl, toJson, toUnits } from '../src/lib/chunker.js';
import { validateJsonl } from '../src/lib/jsonl.js';
import { markdownToPlain } from '../src/lib/md.js';

const PLAIN = { disallowedSpecial: new Set() };
const encode = (s) => o200k.encode(s, PLAIN);

// ------------------------------------------------------------------ text statistics
test('analyze: English counts', () => {
  const a = analyze('Hello world! This is a test.\n\nSecond paragraph here.');
  assert.equal(a.words, 9);
  assert.equal(a.sentences, 3);
  assert.equal(a.paragraphs, 2);
  assert.equal(a.chars, 'Hello world! This is a test.\n\nSecond paragraph here.'.length);
  assert.equal(a.charsNoSpaces, 'Hello world! This is a test.\n\nSecond paragraph here.'.replace(/\s/g, '').length);
});
test('analyze: characters are code points (emoji count once)', () => {
  assert.equal(analyze('a😀b').chars, 3);
  assert.equal(analyze('').chars, 0);
  assert.equal(analyze('').words, 0);
});
test('analyze: Japanese is counted without spaces and reading time uses characters', () => {
  const a = analyze('これは日本語の文章です。とても短いです。');
  assert.ok(a.words >= 5, `words ${a.words}`);
  assert.equal(a.sentences, 2);
  assert.ok(a.cjkChars >= 15);
  assert.ok(a.readingMinutes > 0 && a.readingMinutes < 0.2);
});
test('wordList/topWords: apostrophes stay inside a word; top words ignore words under 3 letters', () => {
  assert.ok(wordList("don't stop").includes("don't"));
  const t = topWords('The cat and the cat and the dog. The Cat!', 2);
  assert.deepEqual(t, [{ word: 'the', count: 4 }, { word: 'cat', count: 3 }]);
});
test('sentences and paragraphs', () => {
  assert.equal(countSentences('One. Two! Three?'), 3);
  assert.equal(countSentences('No end'), 1);
  assert.equal(countSentences('   '), 0);
  assert.equal(countParagraphs('a\n\n\nb\n\nc'), 3);
});
test('formatDuration', () => {
  assert.equal(formatDuration(0), '0 s');
  assert.equal(formatDuration(0.5), '30 s');
  assert.equal(formatDuration(1.5), '1 min 30 s');
  assert.equal(formatDuration(2), '2 min');
});

// ------------------------------------------------------------------ case conversion
test('casing: basic modes', () => {
  assert.equal(C.upper('hello World'), 'HELLO WORLD');
  assert.equal(C.lower('HELLO World'), 'hello world');
  assert.equal(C.capitalizeWords("hello big-world don't \"quoted\" word"), "Hello Big-World Don't \"Quoted\" Word");
  assert.equal(C.invertCase('Hello'), 'hELLO');
  assert.equal(C.alternatingCase('hello world'), 'hElLo WoRlD');
});
test('casing: title case keeps small words lower except first and last', () => {
  assert.equal(C.titleCase('the lord of the rings and a tale'), 'The Lord of the Rings and a Tale');
  assert.equal(C.titleCase('what to look for in'), 'What to Look for In');
});
test('casing: sentence case', () => {
  assert.equal(C.sentenceCase('HELLO there. how ARE you? i am fine!\nnew line'), 'Hello there. How are you? I am fine!\nNew line');
});
test('casing: identifier styles and splitting', () => {
  assert.deepEqual(C.splitWords('helloWorld-foo_bar baz'), ['hello', 'World', 'foo', 'bar', 'baz']);
  assert.deepEqual(C.splitWords('HTTPServerError'), ['HTTP', 'Server', 'Error']);
  assert.equal(C.camelCase('hello big world'), 'helloBigWorld');
  assert.equal(C.pascalCase('hello_big-world'), 'HelloBigWorld');
  assert.equal(C.snakeCase('Hello Big World'), 'hello_big_world');
  assert.equal(C.kebabCase('helloBigWorld'), 'hello-big-world');
  assert.equal(C.constantCase('helloBigWorld'), 'HELLO_BIG_WORLD');
  assert.equal(C.snakeCase('First Line\nSecond Line'), 'first_line\nsecond_line', 'multi-line lists convert line by line');
});
test('casing: non-Latin letters survive', () => {
  assert.equal(C.upper('straße ñandú'), 'STRASSE ÑANDÚ');
  assert.equal(C.lower('ΑΒΓ'), 'αβγ');
  assert.equal(C.snakeCase('日本語 テスト'), '日本語_テスト');
});

// ------------------------------------------------------------------ chunker
const DOC = Array.from({ length: 30 }, (_, i) => `Paragraph ${i + 1} talks about topic ${i + 1}. It has a second sentence with some more words to fill space.`).join('\n\n');

test('chunkText: every chunk fits the size, nothing is lost, order is kept', () => {
  const size = 60;
  const chunks = chunkText(DOC, { size, overlap: 0, encode });
  assert.ok(chunks.length > 3);
  for (const c of chunks) assert.ok(c.tokens <= size, `chunk ${c.index} has ${c.tokens} tokens`);
  assert.equal(chunks.map((c) => c.text).join('\n\n').replace(/\s+/g, ' '), DOC.replace(/\s+/g, ' '));
  assert.deepEqual(chunks.map((c) => c.index), chunks.map((_, i) => i));
});
test('chunkText: overlap repeats whole units from the end of the previous chunk and stays within the size', () => {
  const size = 80;
  const chunks = chunkText(DOC, { size, overlap: 30, encode });
  let repeated = 0;
  for (let i = 1; i < chunks.length; i++) {
    assert.ok(chunks[i].tokens <= size);
    assert.ok(chunks[i].overlapTokens <= 30);
    const firstPara = chunks[i].text.split('\n\n')[0];
    if (chunks[i - 1].text.includes(firstPara)) repeated++;
  }
  assert.ok(repeated >= chunks.length / 2, `overlap used in ${repeated} of ${chunks.length - 1} boundaries`);
  // no chunk is only overlap: the last chunk contains at least one unit that is not in the previous chunk
  const last = chunks[chunks.length - 1].text;
  assert.ok(last.includes('Paragraph 30'));
});
test('chunkText: a unit longer than a chunk is split to fit, with no loss of characters', () => {
  const long = 'word '.repeat(500).trim();
  const chunks = chunkText(long, { size: 50, overlap: 0, encode });
  assert.ok(chunks.length >= 10);
  for (const c of chunks) assert.ok(c.tokens <= 50);
  assert.equal(chunks.map((c) => c.text).join('').replace(/\s+/g, ''), long.replace(/\s+/g, ''));
});
test('chunkText: CJK text with no spaces and sentence splitting', () => {
  const jp = Array.from({ length: 40 }, (_, i) => `これは${i + 1}番目の文章です。`).join('');
  const chunks = chunkText(jp, { size: 40, overlap: 0, splitOn: 'sentence', encode });
  for (const c of chunks) assert.ok(c.tokens <= 40);
  assert.equal(chunks.map((c) => c.text).join(''), jp);
});
test('chunkText: empty input and tiny text', () => {
  assert.deepEqual(chunkText('', { size: 100, encode }), []);
  const one = chunkText('Just one short line.', { size: 100, overlap: 10, encode });
  assert.equal(one.length, 1);
  assert.equal(one[0].text, 'Just one short line.');
});
test('toUnits and exports', () => {
  assert.equal(toUnits('a\n\nb\n\nc', 'paragraph').length, 3);
  assert.equal(toUnits('a\nb\nc', 'line').length, 3);
  assert.ok(toUnits('One. Two. Three.', 'sentence').length >= 3);
  const chunks = chunkText(DOC, { size: 100, encode });
  const lines = toJsonl(chunks).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, chunks.length);
  assert.deepEqual(Object.keys(lines[0]), ['id', 'text', 'tokens']);
  assert.equal(JSON.parse(toJson(chunks, { tokenizer: 'o200k_base' })).chunks.length, chunks.length);
});

// ------------------------------------------------------------------ JSONL validator
const ex = (u, a) => JSON.stringify({ messages: [{ role: 'system', content: 'Be brief.' }, { role: 'user', content: u }, { role: 'assistant', content: a }] });

test('validateJsonl: a good file passes and tokens are counted', () => {
  const file = Array.from({ length: 12 }, (_, i) => ex(`Question ${i}`, `Answer ${i}`)).join('\n') + '\n';
  const r = validateJsonl(file, { encode });
  assert.equal(r.ok, true);
  assert.equal(r.valid, 12);
  assert.equal(r.errors.length, 0);
  assert.equal(r.warnings.length, 0);
  assert.ok(r.tokens.total > 12 && r.tokens.max >= r.tokens.min);
});
test('validateJsonl: reports bad JSON, missing keys, bad roles and the legacy format with line numbers', () => {
  const file = [
    ex('ok', 'ok'),
    '{not json',
    '[]',
    JSON.stringify({ prompt: 'a', completion: 'b' }),
    JSON.stringify({ messages: [] }),
    JSON.stringify({ messages: [{ role: 'robot', content: 'x' }] }),
    JSON.stringify({ messages: [{ role: 'user' }] }),
    '',
    JSON.stringify({ foo: 1 }),
  ].join('\n');
  const r = validateJsonl(file, { encode });
  const at = (n) => r.errors.filter((e) => e.line === n).map((e) => e.message).join(' | ');
  assert.match(at(2), /Not valid JSON/);
  assert.match(at(3), /JSON object/);
  assert.match(at(4), /older prompt\/completion format/);
  assert.match(at(5), /non-empty array/);
  assert.match(at(6), /unknown role "robot"/);
  assert.match(at(7), /no "content"/);
  assert.match(at(8), /Empty line/);
  assert.match(at(9), /Missing the "messages" key/);
  assert.equal(r.valid, 1);
  assert.equal(r.ok, false);
});
test('validateJsonl: warnings (no assistant, last not assistant, duplicate, few examples, over limit)', () => {
  const dup = ex('same', 'same');
  const file = [dup, dup, JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }), JSON.stringify({ messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }] })].join('\n');
  const r = validateJsonl(file, { encode, maxTokens: 3 });
  const msgs = r.warnings.map((w) => w.message).join('\n');
  assert.match(msgs, /Identical to line 1/);
  assert.match(msgs, /No assistant message/);
  assert.match(msgs, /last message is not from the assistant/);
  assert.match(msgs, /Only 4 valid examples/);
  assert.match(msgs, /over your limit of 3/);
  assert.equal(r.ok, true, 'warnings do not make the file invalid');
});
test('validateJsonl: tool-call assistants may have null content; content parts are counted; BOM and CRLF are tolerated', () => {
  const calls = JSON.stringify({ messages: [{ role: 'user', content: 'weather?' }, { role: 'assistant', content: null, tool_calls: [{ id: '1', type: 'function', function: { name: 'w', arguments: '{}' } }] }] });
  const parts = JSON.stringify({ messages: [{ role: 'user', content: [{ type: 'text', text: 'describe' }] }, { role: 'assistant', content: 'ok' }] });
  const r = validateJsonl('﻿' + calls + '\r\n' + parts + '\r\n', { encode });
  assert.equal(r.errors.length, 0);
  assert.equal(r.valid, 2);
  assert.ok(r.warnings.some((w) => /byte-order mark/.test(w.message)));
});
test('validateJsonl: empty input', () => {
  const r = validateJsonl('', { encode });
  assert.equal(r.ok, false);
  assert.equal(r.valid, 0);
});

// ------------------------------------------------------------------ strip markdown (shared with the tool page)
test('markdownToPlain strips AI-answer formatting', () => {
  const t = markdownToPlain('## Plan\n\n**Step 1:** do *this* and `that`.\n\n- first\n- second\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nSee [docs](https://x.y).');
  assert.ok(t.startsWith('Plan'));
  assert.ok(t.includes('Step 1: do this and that.'));
  assert.ok(t.includes('• first') && t.includes('• second'));
  assert.ok(t.includes('a | b') && t.includes('1 | 2'));
  assert.ok(t.includes('See docs.'));
  assert.ok(!/[*#`|]\s*-|\*\*|##|\]\(/.test(t));
});
