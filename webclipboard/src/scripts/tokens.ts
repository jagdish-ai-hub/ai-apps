// Token calculator: counts tokens with OpenAI's real BPE vocabularies, entirely in the browser.
import { CONTEXT_WINDOWS, MAX_CHARS, countWords, estimate, formatMoney, groupTokens, quickEstimate, windowUse, parseNumber } from '../lib/tokencalc.js';

type Encoder = { encode: (t: string, o?: object) => number[]; decode: (ids: number[]) => string };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const loaders: Record<string, () => Promise<Encoder>> = {
  o200k_base: () => import('gpt-tokenizer/encoding/o200k_base') as unknown as Promise<Encoder>,
  cl100k_base: () => import('gpt-tokenizer/encoding/cl100k_base') as unknown as Promise<Encoder>,
};
const cache: Record<string, Promise<Encoder>> = {};
const getEncoder = (name: string) => (cache[name] ||= loaders[name]());
const PLAIN = { disallowedSpecial: new Set<string>() }; // treat "<|endoftext|>" etc. as ordinary text

const text = $<HTMLTextAreaElement>('tc-text');
const tokenizer = $<HTMLSelectElement>('tc-tokenizer');
const fields = ['tc-in-price', 'tc-out-price', 'tc-out-tokens', 'tc-requests', 'tc-currency'] as const;
const MAX_CHIPS = 3000;
const locked = $('token-calc').dataset.lockTokenizer === '1'; // dedicated tokenizer pages keep their own default

// ---------------------------------------------------------------- saved preferences (convenience only)
const KEY = 'wc-token-prefs';
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const id of fields) if (typeof p[id] === 'string') $<HTMLInputElement>(id).value = p[id];
    if (!locked && typeof p.tokenizer === 'string' && p.tokenizer in { ...loaders, estimate: 1 }) tokenizer.value = p.tokenizer;
  } catch { /* storage unavailable */ }
}
function savePrefs() {
  try {
    let p: Record<string, string> = {};
    try { p = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* start fresh */ }
    if (!locked) p.tokenizer = tokenizer.value;
    for (const id of fields) p[id] = $<HTMLInputElement>(id).value;
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------- counting
let run = 0; // guards against out-of-order async results
let last = { tokens: 0, ready: false };

async function recount() {
  const mine = ++run;
  let value = text.value;
  const truncated = value.length > MAX_CHARS;
  if (truncated) value = value.slice(0, MAX_CHARS);
  $('tc-trunc').hidden = !truncated;
  const chars = [...value].length;
  $('tc-chars').textContent = chars.toLocaleString();
  $('tc-words').textContent = countWords(value).toLocaleString();

  let tokens = 0;
  let groups: { text: string; ids: number[] }[] | null = null;
  const mode = tokenizer.value;
  if (value === '') {
    tokens = 0;
  } else if (mode === 'estimate') {
    tokens = quickEstimate(value);
  } else {
    $('tc-status').textContent = cache[mode] ? '' : 'Loading tokenizer…';
    try {
      const enc = await getEncoder(mode);
      if (mine !== run) return;
      const ids = enc.encode(value, PLAIN);
      tokens = ids.length;
      groups = groupTokens(ids.slice(0, MAX_CHIPS * 2), enc.decode);
    } catch {
      $('tc-status').textContent = 'Could not load the tokenizer. Check your connection and try again.';
      return;
    }
    $('tc-status').textContent = '';
  }
  if (mine !== run) return;
  last = { tokens, ready: true };
  $('tc-tokens').textContent = tokens.toLocaleString();
  $('tc-cpt').textContent = tokens ? (chars / tokens).toFixed(2) : '–';
  $('tc-tpw').textContent = tokens && countWords(value) ? (tokens / countWords(value)).toFixed(2) : '–';
  renderWindows(tokens);
  renderChips(groups, tokens, mode === 'estimate');
  renderCost();
}

function renderChips(groups: { text: string; ids: number[] }[] | null, tokens: number, isEstimate: boolean) {
  const box = $('tc-chips');
  const note = $('tc-chips-note');
  box.replaceChildren();
  if (!groups || groups.length === 0) {
    note.textContent = isEstimate ? 'Token boundaries are not available for the rule-of-thumb estimate. Choose an OpenAI tokenizer to see them.' : '';
    return;
  }
  const frag = document.createDocumentFragment();
  groups.slice(0, MAX_CHIPS).forEach((g, i) => {
    const s = document.createElement('span');
    s.className = i % 2 ? 'tk b' : 'tk a';
    s.textContent = g.text.replace(/\n/g, '↵\n');
    s.title = g.ids.length > 1 ? `Token ids: ${g.ids.join(', ')}` : `Token id: ${g.ids[0]}`;
    frag.appendChild(s);
  });
  box.appendChild(frag);
  note.textContent = tokens > MAX_CHIPS ? `Showing the first ${MAX_CHIPS.toLocaleString()} of ${tokens.toLocaleString()} tokens.` : '';
}

function renderWindows(tokens: number) {
  const box = $('tc-windows');
  box.replaceChildren(
    ...CONTEXT_WINDOWS.map((w) => {
      const pct = windowUse(tokens, w.size);
      const el = document.createElement('div');
      el.className = 'win' + (pct > 100 ? ' over' : '');
      const label = pct > 100 ? 'too long' : pct < 0.1 && tokens ? '<0.1%' : `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
      el.innerHTML = `<span class="mono">${w.label}</span><i style="--w:${Math.min(100, pct)}%"></i><span class="mono">${label}</span>`;
      el.title = `${w.size.toLocaleString()} token context window`;
      return el;
    }),
  );
}

function renderCost() {
  const sym = $<HTMLInputElement>('tc-currency').value.trim().slice(0, 3) || '$';
  const e = estimate({
    inputTokens: last.tokens,
    outputTokens: $<HTMLInputElement>('tc-out-tokens').value,
    inputPrice: $<HTMLInputElement>('tc-in-price').value,
    outputPrice: $<HTMLInputElement>('tc-out-price').value,
    requests: $<HTMLInputElement>('tc-requests').value,
  });
  $('tc-cost-in').textContent = formatMoney(e.input, sym);
  $('tc-cost-out').textContent = formatMoney(e.output, sym);
  $('tc-cost-req').textContent = formatMoney(e.perRequest, sym);
  $('tc-cost-total').textContent = formatMoney(e.total, sym);
  $('tc-total-label').textContent = e.requests > 1 ? `Total for ${e.requests.toLocaleString()} requests` : 'Total';
  $('tc-out-count').textContent = e.outputTokens.toLocaleString();
  const missing = !Number.isFinite(parseNumber($<HTMLInputElement>('tc-in-price').value)) && !Number.isFinite(parseNumber($<HTMLInputElement>('tc-out-price').value));
  $('tc-price-hint').hidden = !missing;
}

// ---------------------------------------------------------------- wiring
let timer: number | undefined;
text.addEventListener('input', () => {
  clearTimeout(timer);
  timer = window.setTimeout(recount, text.value.length > 100_000 ? 400 : 120);
});
text.addEventListener('focus', () => { if (tokenizer.value !== 'estimate') void getEncoder(tokenizer.value).catch(() => {}); }, { once: true });
tokenizer.addEventListener('change', () => { savePrefs(); void recount(); });
for (const id of fields) {
  $(id).addEventListener('input', () => { savePrefs(); renderCost(); });
}
$('tc-clear').addEventListener('click', () => { text.value = ''; void recount(); text.focus(); });
$('tc-sample').addEventListener('click', () => {
  text.value = $('tc-sample-text').textContent || '';
  void recount();
});
$('tc-paste').addEventListener('click', async () => {
  try {
    text.value = await navigator.clipboard.readText();
    void recount();
  } catch {
    $('tc-status').textContent = 'Your browser blocked clipboard access. Paste with Ctrl+V (⌘V on Mac) instead.';
  }
});
$('tc-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLElement;
  try { await navigator.clipboard.writeText(String(last.tokens)); btn.textContent = 'Copied!'; setTimeout(() => (btn.textContent = 'Copy count'), 1200); } catch { /* ignore */ }
});

loadPrefs();
renderCost();
renderWindows(0);
void recount();
