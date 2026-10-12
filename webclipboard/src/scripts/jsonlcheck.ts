import { $, getEncoder, PLAIN } from './shared';
import { validateJsonl } from '../lib/jsonl.js';

const input = $<HTMLTextAreaElement>('jl-in');
const status = $('jl-status');
const SHOW = 300;
const BIG = 3_000_000; // above this, the file is checked straight from memory and not put into the text box
let fileText: string | null = null;

$('jl-sample').addEventListener('click', () => { fileText = null; input.value = $('jl-sample-text').textContent || ''; $('jl-file-note').hidden = true; });
$('jl-clear').addEventListener('click', () => { fileText = null; input.value = ''; $('jl-file-note').hidden = true; $('jl-result').hidden = true; status.textContent = ''; });
input.addEventListener('input', () => { fileText = null; $('jl-file-note').hidden = true; });

$<HTMLInputElement>('jl-file').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const t = await f.text();
  const note = $('jl-file-note');
  note.hidden = false;
  if (t.length > BIG) { fileText = t; input.value = ''; note.textContent = `${f.name} (${(t.length / 1048576).toFixed(1)} MB) is loaded and too large to show here. Press "Check the file" to check it.`; }
  else { fileText = null; input.value = t; note.textContent = `${f.name} loaded (${t.length.toLocaleString()} characters).`; }
});

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
function fill(bodyId: string, headId: string, wrapId: string, items: { line: number; message: string }[]) {
  const shown = items.slice(0, SHOW);
  $(bodyId).innerHTML = shown.map((i) => `<tr><td class="num">${i.line || '–'}</td><td>${esc(i.message)}</td></tr>`).join('');
  $(headId).hidden = $(wrapId).hidden = items.length === 0;
}

$('jl-go').addEventListener('click', async () => {
  const raw = fileText ?? input.value;
  if (!raw.trim()) { status.textContent = 'Paste your JSONL or open a file first.'; return; }
  const btn = $<HTMLButtonElement>('jl-go');
  btn.disabled = true;
  status.textContent = 'Loading the tokenizer…';
  try {
    const enc = await getEncoder($<HTMLSelectElement>('jl-tok').value);
    status.textContent = 'Checking…';
    await new Promise((r) => setTimeout(r, 20));
    const maxTokens = parseInt($<HTMLInputElement>('jl-max').value.replace(/[^\d]/g, ''), 10) || undefined;
    const r = validateJsonl(raw, { encode: (s: string) => enc.encode(s, PLAIN), maxTokens });
    $('jl-result').hidden = false;
    $('jl-verdict').textContent = r.ok ? (r.warnings.length ? 'Valid, with warnings' : 'Looks valid') : 'Has problems';
    $('jl-lines').textContent = r.totalLines.toLocaleString();
    $('jl-valid').textContent = r.valid.toLocaleString();
    $('jl-errors').textContent = r.errors.length.toLocaleString();
    $('jl-warns').textContent = r.warnings.length.toLocaleString();
    const t = r.tokens;
    $('jl-total').textContent = t ? t.total.toLocaleString() : '–';
    $('jl-mean').textContent = t ? Math.round(t.mean).toLocaleString() : '–';
    $('jl-median').textContent = t ? t.median.toLocaleString() : '–';
    $('jl-maxtok').textContent = t ? t.max.toLocaleString() : '–';
    fill('jl-err-body', 'jl-err-h', 'jl-err-wrap', r.errors);
    fill('jl-warn-body', 'jl-warn-h', 'jl-warn-wrap', r.warnings);
    const more = Math.max(r.errors.length - SHOW, 0) + Math.max(r.warnings.length - SHOW, 0);
    $('jl-more').textContent = more ? `Only the first ${SHOW} errors and ${SHOW} warnings are listed.` : '';
    status.textContent = '';
  } catch {
    status.textContent = 'Something went wrong while checking the file.';
  } finally {
    btn.disabled = false;
  }
});
