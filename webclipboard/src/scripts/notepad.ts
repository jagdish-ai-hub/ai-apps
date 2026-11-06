// Online notepad: formatting toolbar, autosave to this browser, downloads (Word, PDF, .txt, .md) and a hand-off to the share page.
// Nothing here talks to a server. The note lives in localStorage until the person shares it.
import { initNoteEditor } from './noteeditor';
import { withTitle } from '../lib/mdtoolbar.js';

type Cfg = { lang: string; shareHref: string; ui: Record<string, string> };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cfg: Cfg = JSON.parse($('np-config').textContent || '{}');
const ui = cfg.ui;
const KEY = 'wc-note-v1';
const DRAFT = 'wc-note-draft';

const title = $<HTMLInputElement>('np-title');
const text = $<HTMLTextAreaElement>('np-text');
const count = $('np-count');
const saved = $('np-saved');
const msg = $('np-msg');

const editor = initNoteEditor({
  text, wrap: $('np-wrap'), bar: $('np-bar'), preview: $('np-preview'), viewBtn: $<HTMLButtonElement>('np-view'),
  labels: { preview: ui.preview, edit: ui.edit, empty: ui.previewEmpty },
});

// ------------------------------------------------------------ storage (every access is guarded: it can be blocked or full)

function load(): { title: string; text: string } | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v.text === 'string' ? { title: String(v.title ?? ''), text: v.text } : null; } catch { return null; }
}
let storageOk = true;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ title: title.value, text: text.value, at: Date.now() })); storageOk = true; saved.textContent = ui.saved; }
  catch { storageOk = false; saved.textContent = ui.notSaved; }
}
let saveTimer: number | undefined;
const queueSave = () => { clearTimeout(saveTimer); saveTimer = window.setTimeout(save, 400); };

// ------------------------------------------------------------ counts

async function updateCount() {
  const { analyze } = await import('../lib/textstats.js');
  const s = analyze(text.value);
  count.textContent = ui.count.replace('{chars}', s.chars.toLocaleString()).replace('{words}', s.words.toLocaleString());
}
function changed() { void updateCount(); queueSave(); }
text.addEventListener('input', changed);
title.addEventListener('input', queueSave);
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

const old = load();
if (old) { title.value = old.title; text.value = old.text; saved.textContent = ui.saved; editor.autosize(); }
void updateCount();

$('np-new').addEventListener('click', () => {
  if ((text.value.trim() || title.value.trim()) && !confirm(ui.newConfirm)) return;
  title.value = ''; text.value = ''; msg.textContent = '';
  save(); void updateCount(); void editor.render(); editor.autosize(); text.focus();
});

// ------------------------------------------------------------ downloads

const btn = $('np-download');
const menu = $('np-menu');
const setMenu = (open: boolean) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
btn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target as Node)) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); } });

menu.addEventListener('click', async (e) => {
  const fmt = (e.target as HTMLElement).closest<HTMLElement>('[data-fmt]')?.dataset.fmt;
  if (!fmt) return;
  setMenu(false);
  msg.textContent = '';
  if (!text.value.trim() && !title.value.trim()) { msg.textContent = ui.errEmpty; text.focus(); return; }
  try {
    const out = await import('../lib/export.js');
    const md = withTitle(title.value, text.value);
    const name = out.safeName(title.value, ui.defaultName);
    if (fmt === 'md') out.saveBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${name}.md`);
    else if (fmt === 'txt') out.saveBlob(new Blob([(await import('../lib/md.js')).markdownToPlain(md)], { type: 'text/plain;charset=utf-8' }), `${name}.txt`);
    else if (fmt === 'docx') out.saveBlob(new Blob([(await import('../lib/docx.js')).markdownToDocx(md)], { type: out.DOCX_TYPE }), `${name}.docx`);
    else if (fmt === 'pdf') out.printAsPdf(out.htmlNode((await import('../lib/md.js')).markdownToHtml(md)), {}, name);
  } catch { msg.textContent = ui.errCreate; }
});

// ------------------------------------------------------------ copy all: formatted for Word, Docs and email, clean plain text for chat apps

let md: typeof import('../lib/md.js') | undefined;
void import('../lib/md.js').then((m) => { md = m; }); // loaded ahead, so the copy happens inside the click (Safari requires that)

function legacyCopy(value: string) {
  const ta = Object.assign(document.createElement('textarea'), { value });
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* reported below */ }
  ta.remove();
  return ok;
}

const copyBtn = $<HTMLButtonElement>('np-copy');
copyBtn.addEventListener('click', async () => {
  msg.textContent = '';
  if (!text.value.trim() && !title.value.trim()) { msg.textContent = ui.errEmpty; text.focus(); return; }
  const lib = md ?? (md = await import('../lib/md.js'));
  const note = withTitle(title.value, text.value);
  const plain = lib.markdownToPlain(note);
  const html = lib.markdownToHtml(note);
  let ok = false;
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      })]);
    } else await navigator.clipboard.writeText(plain);
    ok = true;
  } catch {
    try { await navigator.clipboard.writeText(plain); ok = true; } catch { ok = legacyCopy(plain); }
  }
  if (!ok) { msg.textContent = ui.copyFail; return; }
  copyBtn.textContent = ui.copied;
  setTimeout(() => { copyBtn.textContent = ui.copyAll; }, 1600);
});

// ------------------------------------------------------------ share: hand the note to the share page (it has the code, link, QR and password logic)

$('np-share').addEventListener('click', () => {
  msg.textContent = '';
  if (!text.value.trim()) { msg.textContent = ui.shareEmpty; text.focus(); return; }
  save();
  try { sessionStorage.setItem(DRAFT, JSON.stringify({ title: title.value, text: text.value })); location.assign(cfg.shareHref); }
  catch { msg.textContent = ui.shareFail; }
});
