// Toolbar, Undo/Redo, keyboard shortcuts, auto-growing text box and formatted preview for notes.
// Shared by the notepad and the share-a-note page.
// Own tiny helpers on purpose: importing the clipboard script's helpers would pull that whole script into pages that do not need it.
import { applyFormat, continueList, FORMATS } from '../lib/mdtoolbar.js';

export interface NoteEditorOptions {
  text: HTMLTextAreaElement;
  wrap: HTMLElement; // gets data-view="edit" | "preview"
  bar: HTMLElement; // contains buttons with data-fmt (formatting) and data-act (undo, redo)
  preview: HTMLElement;
  viewBtn: HTMLButtonElement;
  labels: { preview: string; edit: string; empty: string };
}

const MAX = 2_000_000;
const MIN_HEIGHT = 320;

export function initNoteEditor(o: NoteEditorOptions) {
  const { text, wrap, bar, preview, viewBtn, labels } = o;
  let mdLib: Promise<typeof import('../lib/md.js')> | undefined;
  let timer: number | undefined;

  // ------------------------------------------------ auto-grow: from MIN_HEIGHT up to 70% of the screen, then scroll inside
  function autosize() {
    const y = window.scrollY;
    text.style.height = 'auto';
    const cap = Math.max(MIN_HEIGHT, Math.round(window.innerHeight * 0.7));
    const h = Math.min(Math.max(text.scrollHeight + 2, MIN_HEIGHT), cap);
    text.style.height = `${h}px`;
    text.style.overflowY = text.scrollHeight + 2 > h ? 'auto' : 'hidden';
    if (window.scrollY !== y) window.scrollTo(window.scrollX, y); // shrinking for a moment must not make the page jump
  }

  // ------------------------------------------------ fallback history, used only when the browser's own undo is not available
  const past: string[] = [];
  const future: string[] = [];
  let last = text.value;
  const remember = () => { if (text.value !== last) { past.push(last); if (past.length > 200) past.shift(); future.length = 0; last = text.value; } };

  // Replacing the whole value through execCommand keeps the browser's undo history; the fallback sets the value directly.
  function set(r: { value: string; start: number; end: number }) {
    text.focus();
    if (r.value !== text.value) {
      remember();
      text.setSelectionRange(0, text.value.length);
      let ok = false;
      try { ok = document.execCommand('insertText', false, r.value); } catch { /* fall back below */ }
      if (!ok || text.value !== r.value) { text.value = r.value; text.dispatchEvent(new Event('input', { bubbles: true })); }
      last = text.value;
    }
    text.setSelectionRange(r.start, r.end);
  }

  function step(dir: 'undo' | 'redo') {
    text.focus();
    const before = text.value;
    let ok = false;
    try { ok = document.execCommand(dir); } catch { /* use our own history */ }
    if (ok && text.value !== before) { last = text.value; return; }
    const from = dir === 'undo' ? past : future;
    const to = dir === 'undo' ? future : past;
    const value = from.pop();
    if (value === undefined) return;
    to.push(text.value);
    text.value = value;
    last = value;
    text.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function format(kind: string) {
    if (!FORMATS.includes(kind)) return;
    set(applyFormat(text.value, text.selectionStart, text.selectionEnd, kind));
  }

  async function render() {
    if (wrap.dataset.view !== 'preview') return;
    if (!text.value.trim()) { preview.innerHTML = `<p class="hint">${labels.empty}</p>`; return; }
    const { markdownToHtml } = await (mdLib ||= import('../lib/md.js'));
    preview.innerHTML = markdownToHtml(text.value.slice(0, MAX)); // escaped, only safe elements
  }

  function setView(view: 'edit' | 'preview', focus = true) {
    wrap.dataset.view = view;
    viewBtn.textContent = view === 'preview' ? labels.edit : labels.preview;
    viewBtn.setAttribute('aria-pressed', String(view === 'preview'));
    bar.querySelectorAll<HTMLButtonElement>('button[data-fmt], button[data-act]').forEach((b) => { b.disabled = view === 'preview'; });
    void render();
    if (view === 'edit') { if (focus) text.focus(); autosize(); }
  }

  bar.addEventListener('mousedown', (e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }); // keep the selection
  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.dataset.fmt) format(b.dataset.fmt);
    else if (b.dataset.act === 'undo' || b.dataset.act === 'redo') step(b.dataset.act);
  });
  viewBtn.addEventListener('click', () => setView(wrap.dataset.view === 'preview' ? 'edit' : 'preview'));

  text.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); format('bold'); return; }
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); format('italic'); return; }
    if (e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && !e.isComposing && text.selectionStart === text.selectionEnd) {
      const r = continueList(text.value, text.selectionStart);
      if (r) { e.preventDefault(); set(r); }
    }
  });
  let histTimer: number | undefined;
  text.addEventListener('input', () => {
    autosize();
    clearTimeout(histTimer); histTimer = window.setTimeout(remember, 600); // typing is grouped into one fallback history step
    clearTimeout(timer); timer = window.setTimeout(render, 120);
  });
  // Fade the toolbar's right edge while more buttons are hidden off-screen (narrow phones).
  const hint = () => bar.classList.toggle('more', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 2);
  bar.addEventListener('scroll', hint, { passive: true });
  window.addEventListener('resize', () => { autosize(); hint(); });
  hint();

  setView('edit', false); // no focus on load: it would scroll the page and open the phone keyboard
  return { setView, render, autosize };
}
