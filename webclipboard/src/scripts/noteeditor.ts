// Toolbar, keyboard shortcuts and formatted preview for a notes text box. Shared by the notepad and the share-a-note page.
// Own tiny helpers on purpose: importing the clipboard script's helpers would pull that whole script into pages that do not need it.
import { applyFormat, continueList, FORMATS } from '../lib/mdtoolbar.js';

export interface NoteEditorOptions {
  text: HTMLTextAreaElement;
  wrap: HTMLElement; // gets data-view="edit" | "preview"
  bar: HTMLElement; // contains buttons with data-fmt
  preview: HTMLElement;
  viewBtn: HTMLButtonElement;
  labels: { preview: string; edit: string; empty: string };
}

const MAX = 2_000_000;

export function initNoteEditor(o: NoteEditorOptions) {
  const { text, wrap, bar, preview, viewBtn, labels } = o;
  let mdLib: Promise<typeof import('../lib/md.js')> | undefined;
  let timer: number | undefined;

  // Replacing the whole value through execCommand keeps the browser's undo history; the fallback sets the value directly.
  function set(r: { value: string; start: number; end: number }) {
    text.focus();
    if (r.value !== text.value) {
      text.setSelectionRange(0, text.value.length);
      let ok = false;
      try { ok = document.execCommand('insertText', false, r.value); } catch { /* fall back below */ }
      if (!ok || text.value !== r.value) { text.value = r.value; text.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    text.setSelectionRange(r.start, r.end);
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

  function setView(view: 'edit' | 'preview') {
    wrap.dataset.view = view;
    viewBtn.textContent = view === 'preview' ? labels.edit : labels.preview;
    viewBtn.setAttribute('aria-pressed', String(view === 'preview'));
    bar.querySelectorAll<HTMLButtonElement>('button[data-fmt]').forEach((b) => { b.disabled = view === 'preview'; });
    void render();
    if (view === 'edit') text.focus();
  }

  bar.addEventListener('mousedown', (e) => { if ((e.target as HTMLElement).closest('button[data-fmt]')) e.preventDefault(); }); // keep the selection
  bar.addEventListener('click', (e) => {
    const kind = (e.target as HTMLElement).closest<HTMLElement>('button[data-fmt]')?.dataset.fmt;
    if (kind) format(kind);
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
  text.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(render, 120); });

  setView('edit');
  return { setView, render };
}
