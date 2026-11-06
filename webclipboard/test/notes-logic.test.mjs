import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFormat, continueList, withTitle } from '../src/lib/mdtoolbar.js';
import { encodeNote, decodeNote, encodeCode, decodeCode, NOTE_MARKER_LENGTH } from '../src/lib/codeclip.js';

const f = (v, s, e, k) => applyFormat(v, s, e, k);

test('bold and italic wrap the selection, then unwrap it', () => {
  let r = f('hello world', 6, 11, 'bold');
  assert.deepEqual(r, { value: 'hello **world**', start: 8, end: 13 });
  assert.equal(f(r.value, r.start, r.end, 'bold').value, 'hello world');
  assert.equal(f('hello **world**', 6, 15, 'bold').value, 'hello world', 'selection includes the markers');
  r = f('abc', 1, 2, 'italic');
  assert.equal(r.value, 'a_b_c');
});

test('bold with no selection inserts a marker pair and puts the cursor between', () => {
  const r = f('ab', 1, 1, 'bold');
  assert.deepEqual(r, { value: 'a****b', start: 3, end: 3 });
});

test('headings toggle on the line and replace other prefixes', () => {
  assert.equal(f('Title', 2, 2, 'h2').value, '## Title');
  assert.equal(f('## Title', 3, 3, 'h2').value, 'Title');
  assert.equal(f('- item', 2, 2, 'h1').value, '# item');
  assert.equal(f('## Title', 3, 3, 'h1').value, '# Title');
});

test('bullets, numbers and checklists apply to every selected line and toggle off', () => {
  const v = 'one\ntwo\n\nthree';
  let r = f(v, 0, v.length, 'bullet');
  assert.equal(r.value, '- one\n- two\n\n- three');
  assert.equal(f(r.value, r.start, r.end, 'bullet').value, v);
  r = f(v, 0, v.length, 'number');
  assert.equal(r.value, '1. one\n2. two\n\n3. three');
  assert.equal(f(r.value, r.start, r.end, 'number').value, v);
  assert.equal(f('a\nb', 0, 3, 'check').value, '- [ ] a\n- [ ] b');
  assert.equal(f('- a', 1, 1, 'check').value, '- [ ] a', 'bullet becomes a checklist item');
  assert.equal(f('- [ ] a', 1, 1, 'bullet').value, '- a', 'checklist becomes a bullet');
});

test('only the lines the selection touches change', () => {
  const v = 'a\nb\nc';
  assert.equal(f(v, 2, 3, 'bullet').value, 'a\n- b\nc');
  // A selection that ends right after a line break does not touch the next line.
  assert.equal(f(v, 2, 4, 'bullet').value, 'a\n- b\nc');
});

test('an empty line gets a prefix when it is the only line', () => {
  assert.equal(f('', 0, 0, 'bullet').value, '- ');
  assert.equal(f('x\n', 2, 2, 'bullet').value, 'x\n- ');
});

test('Enter continues lists, counts up numbers, and ends a list on an empty item', () => {
  assert.deepEqual(continueList('- one', 5), { value: '- one\n- ', start: 8, end: 8 });
  assert.deepEqual(continueList('1. one', 6), { value: '1. one\n2. ', start: 10, end: 10 });
  assert.equal(continueList('- [x] done', 10).value, '- [x] done\n- [ ] ');
  assert.deepEqual(continueList('- one\n- ', 8), { value: '- one\n\n', start: 7, end: 7 }, 'a blank line separates the list from what follows');
  assert.deepEqual(continueList('- ', 2), { value: '', start: 0, end: 0 }, 'a lone empty item just disappears');
  assert.deepEqual(continueList('Intro\n- ', 8), { value: 'Intro\n', start: 6, end: 6 });
  assert.equal(continueList('plain text', 10), null);
  assert.equal(continueList('## Heading', 10), null);
  assert.equal(continueList('  - nested', 10).value, '  - nested\n  - ');
});

test('note clips round trip, and are not mistaken for code clips', () => {
  const md = '# Title\n\n- **bold** item\n';
  const stored = encodeNote(md);
  assert.equal(stored.length, md.length + NOTE_MARKER_LENGTH);
  assert.equal(stored.charCodeAt(0), 0x2063, 'starts with the marker character the receiver checks');
  assert.equal(decodeNote(stored), md);
  assert.equal(decodeNote('plain text'), null);
  assert.equal(decodeNote(encodeCode('x = 1', 'python')), null);
  assert.equal(decodeCode(stored), null);
  assert.equal(decodeNote(''), null);
});

test('withTitle adds the title as a heading unless the note already starts with one', () => {
  assert.equal(withTitle('Shopping', '- milk'), '# Shopping\n\n- milk');
  assert.equal(withTitle('  ', '- milk'), '- milk');
  assert.equal(withTitle('Shopping', '# My list\n- milk'), '# My list\n- milk');
  assert.equal(withTitle('Shopping', '## Sub\n- milk'), '# Shopping\n\n## Sub\n- milk');
});

test('bold over several lines wraps each line, keeping list and heading marks outside, and toggles back', () => {
  const v = '## Title\n- item one\n\n- item two';
  const r = f(v, 0, v.length, 'bold');
  assert.equal(r.value, '## **Title**\n- **item one**\n\n- **item two**');
  assert.equal(f(r.value, r.start, r.end, 'bold').value, v);
  assert.equal(f('a\nb', 0, 3, 'italic').value, '_a_\n_b_');
});
