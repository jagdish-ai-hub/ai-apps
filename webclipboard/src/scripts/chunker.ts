import { $, copyText, getEncoder, PLAIN, wireInput } from './shared';
import { chunkText, toJson, toJsonl } from '../lib/chunker.js';
import { saveBlob } from '../lib/export.js';

const input = $<HTMLTextAreaElement>('ck-in');
const MAX_CHARS = 1_000_000;
const SHOW = 200;
let chunks: ReturnType<typeof chunkText> = [];
let meta: Record<string, unknown> = {};

const num = (id: string, fallback: number) => {
  const n = parseInt($<HTMLInputElement>(id).value.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

wireInput('ck', input, $('ck-sample-text').textContent || '', () => { $('ck-status').textContent = ''; });

$('ck-go').addEventListener('click', async () => {
  const status = $('ck-status');
  const raw = input.value;
  if (!raw.trim()) { status.textContent = 'Paste some text first.'; return; }
  const text = raw.slice(0, MAX_CHARS);
  const size = num('ck-size', 500);
  let overlap = parseInt($<HTMLInputElement>('ck-overlap').value.replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(overlap)) overlap = 0;
  if (overlap >= size) { overlap = Math.floor(size / 2); $<HTMLInputElement>('ck-overlap').value = String(overlap); }
  const btn = $<HTMLButtonElement>('ck-go');
  btn.disabled = true;
  status.textContent = 'Loading the tokenizer…';
  try {
    const name = $<HTMLSelectElement>('ck-tok').value;
    const enc = await getEncoder(name);
    status.textContent = 'Splitting…';
    await new Promise((r) => setTimeout(r, 20)); // let the message paint before the heavy work
    const splitOn = $<HTMLSelectElement>('ck-split').value as 'paragraph' | 'sentence' | 'line';
    chunks = chunkText(text, { size, overlap, splitOn, encode: (s: string) => enc.encode(s, PLAIN) });
    meta = { tokenizer: name, chunk_size: size, overlap, keep_together: splitOn };
    render();
    status.textContent = raw.length > MAX_CHARS ? `Only the first ${MAX_CHARS.toLocaleString()} characters were used.` : '';
  } catch {
    status.textContent = 'Something went wrong while splitting. Try a smaller text or another tokenizer.';
  } finally {
    btn.disabled = false;
  }
});

function render() {
  const toks = chunks.map((c) => c.tokens);
  const total = toks.reduce((a, b) => a + b, 0);
  $('ck-result').hidden = chunks.length === 0;
  $('ck-n').textContent = chunks.length.toLocaleString();
  $('ck-total').textContent = total.toLocaleString();
  $('ck-avg').textContent = chunks.length ? Math.round(total / chunks.length).toLocaleString() : '0';
  $('ck-max').textContent = chunks.length ? Math.max(...toks).toLocaleString() : '0';
  $('ck-min').textContent = chunks.length ? Math.min(...toks).toLocaleString() : '0';
  const list = $('ck-list');
  list.replaceChildren(...chunks.slice(0, SHOW).map((c) => {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.className = 'chunk-head';
    head.textContent = `Chunk ${c.index + 1} · ${c.tokens.toLocaleString()} tokens${c.overlapTokens ? ` · first ${c.overlapTokens.toLocaleString()} repeated from the previous chunk` : ''}`;
    const body = document.createElement('div');
    body.className = 'chunk-body';
    body.textContent = c.text; // textContent: never interpret pasted text as HTML
    li.append(head, body);
    return li;
  }));
  $('ck-more').textContent = chunks.length > SHOW ? `Showing the first ${SHOW} of ${chunks.length.toLocaleString()} chunks. The downloads and the copied JSON contain all of them.` : '';
}
$('ck-copy').addEventListener('click', (e) => { if (chunks.length) copyText(toJson(chunks, meta), e.currentTarget as HTMLElement); });
$('ck-jsonl').addEventListener('click', () => { if (chunks.length) saveBlob(new Blob([toJsonl(chunks)], { type: 'application/x-ndjson' }), 'chunks.jsonl'); });
$('ck-json').addEventListener('click', () => { if (chunks.length) saveBlob(new Blob([toJson(chunks, meta)], { type: 'application/json' }), 'chunks.json'); });
