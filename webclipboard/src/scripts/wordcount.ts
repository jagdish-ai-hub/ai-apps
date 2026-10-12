import { $, wireInput } from './shared';
import { analyze, formatDuration, topWords } from '../lib/textstats.js';

const input = $<HTMLTextAreaElement>('wc-in');
const set = (id: string, v: string | number) => ($(id).textContent = typeof v === 'number' ? v.toLocaleString() : v);
const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

function update() {
  const text = input.value;
  const a = analyze(text);
  set('wc-words', a.words); set('wc-chars', a.chars); set('wc-nospace', a.charsNoSpaces); set('wc-sent', a.sentences); set('wc-para', a.paragraphs);
  set('wc-lines', a.lines); set('wc-bytes', fmtBytes(a.bytes));
  set('wc-read', formatDuration(a.readingMinutes)); set('wc-speak', formatDuration(a.speakingMinutes));
  const limit = parseInt($<HTMLInputElement>('wc-limit').value.replace(/[^\d]/g, ''), 10);
  const msg = $('wc-limit-msg');
  if (Number.isFinite(limit) && limit > 0) {
    const left = limit - a.chars;
    msg.textContent = left >= 0 ? `${left.toLocaleString()} characters left of ${limit.toLocaleString()}` : `${(-left).toLocaleString()} characters over the limit of ${limit.toLocaleString()}`;
    msg.style.color = left >= 0 ? '' : 'var(--danger)';
  } else msg.textContent = '';
  const top = topWords(text, 10);
  $('wc-top').replaceChildren(...top.map((t) => Object.assign(document.createElement('li'), { innerHTML: `<span>${t.word.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)}</span><b>${t.count}</b>` })));
}
wireInput('wc', input, $('wc-sample-text').textContent || '', update);
$('wc-limit').addEventListener('input', update);
update();
