// Browser logic for the clipboard tool: send, receive, optional end-to-end encryption, QR code.
// Passwords never leave the browser; the server only ever stores ciphertext for protected clips.

type Cfg = { maxChars: number; turnstileSiteKey: string; domain: string; defaultExpiry: string; ui: Record<string, string> };

import { decodeCode, encodeCode, languageById } from '../lib/codeclip.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cfg: Cfg = JSON.parse($('tool-config').textContent || '{}');
const t = (k: string) => cfg.ui[k] || k;

// ---------------------------------------------------------------- helpers

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  return JSON.stringify({ v: 1, s: toB64(salt), i: toB64(iv), c: toB64(ct) });
}

async function decrypt(envelope: string, password: string): Promise<string> {
  const e = JSON.parse(envelope);
  const key = await deriveKey(password, fromB64(e.s));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(e.i) }, key, fromB64(e.c));
  return dec.decode(plain);
}

async function api<T = any>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data: any = {};
  try { data = await res.json(); } catch { /* non-JSON error */ }
  return { ok: res.ok, status: res.status, data };
}

function errorText(code: string | undefined, status: number): string {
  switch (code) {
    case 'empty': return t('errEmpty');
    case 'too_long': return t('errTooLong');
    case 'not_found': return t('errNotFound');
    case 'bad_code': return t('errCode');
    case 'rate_limited': return t('errRate');
    default: return status === 429 ? t('errRate') : t('errGeneric');
  }
}

async function copy(text: string, btn?: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = t('copied');
    setTimeout(() => (btn.textContent = old), 1400);
  }
}

// ---------------------------------------------------------------- tabs

const tabs = { send: $('tab-send'), receive: $('tab-receive') };
const panels = { send: $('panel-send'), receive: $('panel-receive') };
function showTab(name: 'send' | 'receive') {
  (Object.keys(tabs) as Array<'send' | 'receive'>).forEach((k) => {
    tabs[k].setAttribute('aria-selected', String(k === name));
    panels[k].hidden = k !== name;
  });
}
tabs.send.addEventListener('click', () => showTab('send'));
tabs.receive.addEventListener('click', () => { showTab('receive'); $('code-input').focus(); });

// ---------------------------------------------------------------- turnstile (optional)

let tsToken = '';
let tsWidget: string | undefined;
let tsLoading: Promise<void> | undefined;
function loadTurnstile(): Promise<void> {
  if (!cfg.turnstileSiteKey) return Promise.resolve();
  tsLoading ||= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => {
      tsWidget = (window as any).turnstile.render('#turnstile', {
        sitekey: cfg.turnstileSiteKey,
        callback: (tok: string) => (tsToken = tok),
        'expired-callback': () => (tsToken = ''),
      });
      resolve();
    };
    document.head.appendChild(s);
  });
  return tsLoading;
}

// ---------------------------------------------------------------- send

const text = $<HTMLTextAreaElement>('text');
const count = $('count');
const sendMsg = $('send-msg');
let currentCode = '';
const codeMode = $('tool').dataset.code === '1';
if (codeMode) void import('./codeeditor').then((m) => m.initEditor());

text.addEventListener('input', () => {
  count.textContent = text.value.length.toLocaleString();
  count.parentElement!.classList.toggle('over', text.value.length > cfg.maxChars);
});
text.addEventListener('focus', () => void loadTurnstile(), { once: true });
$<HTMLSelectElement>('expiry').value = cfg.defaultExpiry;

$('send-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  sendMsg.textContent = '';
  const value = text.value;
  if (!value.trim()) { sendMsg.textContent = t('errEmpty'); return; }

  const btn = $<HTMLButtonElement>('send-btn');
  btn.disabled = true;
  btn.textContent = t('saving');
  try {
    // Code clips carry an invisible marker with the language, so the receiver can show them highlighted.
    let lang = codeMode ? $<HTMLSelectElement>('code-lang').value : 'plain';
    if (lang === 'auto') lang = (await import('../lib/highlight')).detect(value) ?? 'plain';
    const payload = encodeCode(value, lang);
    if (payload.length > cfg.maxChars) { sendMsg.textContent = t('errTooLong'); return; }
    await loadTurnstile();
    if (cfg.turnstileSiteKey && !tsToken) { sendMsg.textContent = t('errGeneric'); return; }
    const password = $<HTMLInputElement>('password').value;
    const body = {
      content: password ? await encrypt(payload, password) : payload,
      encrypted: Boolean(password),
      burn: $<HTMLInputElement>('burn').checked,
      expiry: $<HTMLSelectElement>('expiry').value,
      turnstile: tsToken || undefined,
    };
    const { ok, status, data } = await api('/api/clips', body);
    if (!ok) { sendMsg.textContent = errorText(data.error, status); return; }
    showResult(data.code, data.expiresAt);
  } catch {
    sendMsg.textContent = t('errGeneric');
  } finally {
    btn.disabled = false;
    btn.textContent = t('sendBtn');
    if (tsWidget !== undefined) { (window as any).turnstile?.reset(tsWidget); tsToken = ''; }
  }
});

async function showResult(code: string, expiresAt: number) {
  currentCode = code;
  const url = `${location.origin}/c/${code}`;
  $('compose').hidden = true;
  $('result').hidden = false;
  $('digits').replaceChildren(...[...code].map((d) => Object.assign(document.createElement('span'), { className: 'digit', textContent: d })));
  $<HTMLInputElement>('share-url').value = url;
  $('copy-code').textContent = `${t('copy')} · ${code}`;
  $('expires').textContent = `${t('expiresAt')}: ${new Date(expiresAt).toLocaleString()}`;
  try {
    const { default: qrcode } = await import('qrcode-generator');
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch { /* QR is a nicety; the code and link still work */ }
}

$('copy-link').addEventListener('click', (e) => copy($<HTMLInputElement>('share-url').value, e.currentTarget as HTMLElement));
$('copy-code').addEventListener('click', (e) => copy(currentCode, e.currentTarget as HTMLElement));
$('new-clip').addEventListener('click', () => {
  $('result').hidden = true;
  $('compose').hidden = false;
  text.value = '';
  $<HTMLInputElement>('password').value = '';
  $<HTMLInputElement>('burn').checked = false;
  count.textContent = '0';
  $('qr').replaceChildren();
  text.dispatchEvent(new Event('input')); // lets the code editor redraw its highlighting
  text.focus();
});

// ---------------------------------------------------------------- receive

const codeInput = $<HTMLInputElement>('code-input');
const receiveMsg = $('receive-msg');
let pending: { code: string; envelope: string } | null = null;
let openedCode = '';
let openedLang = '';

codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
  if (codeInput.value.length === 6) $('receive-form').requestSubmit();
});

$('receive-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  void openClip(codeInput.value);
});

async function openClip(code: string) {
  receiveMsg.textContent = '';
  if (!/^\d{6}$/.test(code)) { receiveMsg.textContent = t('errCode'); return; }
  const btn = $<HTMLButtonElement>('receive-btn');
  btn.disabled = true;
  btn.textContent = t('loading');
  try {
    const { ok, status, data } = await api('/api/open', { code });
    if (!ok) { receiveMsg.textContent = errorText(data.error, status); return; }
    openedCode = code;
    if (data.encrypted) {
      pending = { code, envelope: data.content };
      $('receive-box').hidden = true;
      $('pw-form').hidden = false;
      $('burned').hidden = !data.burned;
      $<HTMLInputElement>('pw-input').focus();
      return;
    }
    showOpened(data.content, data);
  } catch {
    receiveMsg.textContent = t('errGeneric');
  } finally {
    btn.disabled = false;
    btn.textContent = t('receiveBtn');
  }
}

function showOpened(content: string, meta: { burned?: boolean; expiresAt?: number }) {
  $('receive-box').hidden = true;
  $('pw-form').hidden = true;
  $('opened').hidden = false;
  // A code clip starts with an invisible marker naming the language: show it highlighted, without the marker.
  const code = decodeCode(content);
  const shown = code ? code.text : content;
  openedLang = code ? code.lang : '';
  const pre = $('opened-text');
  pre.classList.toggle('hl', Boolean(code));
  pre.dir = code ? 'ltr' : 'auto';
  pre.textContent = shown; // textContent: never interpret clip text as HTML
  const badge = $('opened-lang');
  badge.hidden = !code;
  const dlCode = $('dl-code');
  dlCode.hidden = !code;
  if (code) {
    const l = languageById(code.lang)!;
    badge.textContent = l.label;
    dlCode.textContent = `.${l.ext} (${l.label})`;
    // Highlighting is loaded only when a code clip is opened. highlight.js escapes the code, and textContent stays the raw code.
    void import('../lib/highlight').then(({ highlight }) => { if (pre.classList.contains('hl') && pre.textContent === shown) pre.innerHTML = highlight(shown, code.lang); });
  }
  $('burned').hidden = !meta.burned;
  $('opened-meta').textContent = meta.expiresAt && !meta.burned ? `${t('expiresAt')}: ${new Date(meta.expiresAt).toLocaleString()}` : '';
}

$('pw-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (!pending) return;
  const msg = $('pw-msg');
  msg.textContent = '';
  try {
    const plain = await decrypt(pending.envelope, $<HTMLInputElement>('pw-input').value);
    const burned = !$('burned').hidden;
    showOpened(plain, { burned });
    pending = null;
    $<HTMLInputElement>('pw-input').value = '';
  } catch {
    msg.textContent = t('wrongPassword');
  }
});

$('copy-text').addEventListener('click', (e) => copy($('opened-text').textContent || '', e.currentTarget as HTMLElement));
const dlBtn = $('download');
const dlMenu = $('download-menu');
const setMenu = (open: boolean) => { dlMenu.hidden = !open; dlBtn.setAttribute('aria-expanded', String(open)); };
dlBtn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(dlMenu.hidden); });
document.addEventListener('click', (e) => { if (!dlMenu.hidden && !dlMenu.contains(e.target as Node)) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlMenu.hidden) { setMenu(false); dlBtn.focus(); } });
dlMenu.addEventListener('click', async (e) => {
  const fmt = (e.target as HTMLElement).closest<HTMLElement>('[data-fmt]')?.dataset.fmt;
  if (!fmt) return;
  setMenu(false);
  const text = $('opened-text').textContent || '';
  const name = `clipboard-${openedCode}`;
  // The Word and PDF code is only loaded when someone picks those formats.
  const out = await import('../lib/export.js');
  if (fmt === 'code' && openedLang) {
    out.saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${name}.${languageById(openedLang)!.ext}`);
  } else if (fmt === 'txt' || fmt === 'md') {
    out.saveBlob(new Blob([text], { type: fmt === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' }), `${name}.${fmt}`);
  } else if (fmt === 'docx') {
    const { textToDocx } = await import('../lib/docx.js');
    out.saveBlob(new Blob([textToDocx(text)], { type: out.DOCX_TYPE }), `${name}.docx`);
  } else if (fmt === 'pdf') {
    out.printAsPdf(out.textNode(text), {}, name);
  }
});
$('report').addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  btn.disabled = true;
  await api('/api/report', { code: openedCode });
  btn.textContent = t('reported');
});
$('another').addEventListener('click', () => {
  $('opened').hidden = true;
  $('opened-text').textContent = '';
  $('receive-box').hidden = false;
  codeInput.value = '';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  codeInput.focus();
});

// ---------------------------------------------------------------- deep link: /c/123456 -> /#123456

function fromHash() {
  const m = /^#(\d{6})$/.exec(location.hash);
  if (!m) return;
  showTab('receive');
  codeInput.value = m[1];
  void openClip(m[1]);
}
window.addEventListener('hashchange', fromHash);
fromHash();
