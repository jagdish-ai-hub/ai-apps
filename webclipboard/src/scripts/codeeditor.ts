// The code editor on /code-share/: a plain textarea with a syntax-highlighted copy drawn behind it (so typing, selection, undo,
// IME input and mobile keyboards all stay native), plus Tab and auto-indent. Highlighting is loaded on first use.
import { languageById } from '../lib/codeclip.js';

// Deliberately not importing ./shared: this file is loaded from app.ts, and sharing a module between the clipboard script and the
// other tool scripts lets the bundler pull the clipboard code into pages that have no clipboard.
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function initEditor() {
  const ta = $<HTMLTextAreaElement>('text');
  const wrap = $('code-editor');
  const pre = wrap.querySelector('pre') as HTMLElement;
  const code = $('ce-code');
  const select = $<HTMLSelectElement>('code-lang');
  const note = $('code-detected');
  let mod: Promise<typeof import('../lib/highlight')> | undefined;
  const load = () => (mod ||= import('../lib/highlight'));
  let timer: number | undefined;
  let run = 0;
  let tabMoves = false; // after Esc, Tab leaves the editor (keyboard users must not get trapped)

  async function render() {
    const mine = ++run;
    const text = ta.value;
    let lang = select.value;
    let detected: string | null = null;
    if (lang === 'auto' && text.trim()) {
      detected = (await load()).detect(text);
      lang = detected ?? 'plain';
    } else if (lang === 'auto') lang = 'plain';
    if (mine !== run) return;
    const plain = lang === 'plain';
    wrap.classList.toggle('plain', plain);
    if (plain) code.textContent = '';
    else {
      const { highlight } = await load();
      if (mine !== run) return;
      code.innerHTML = highlight(text, lang) + ' '; // the extra character keeps a trailing empty line the same height in both layers
    }
    note.hidden = select.value !== 'auto' || !text.trim();
    note.textContent = detected ? `Detected: ${languageById(detected)?.label}. Change it above if that is wrong.` : 'Language not detected, so the code is shown as plain text. Choose one above to highlight it.';
  }
  const schedule = () => { clearTimeout(timer); timer = window.setTimeout(render, 60); };

  ta.addEventListener('input', () => { tabMoves = false; schedule(); });
  select.addEventListener('change', () => void render());
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { tabMoves = true; return; }
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' && !e.shiftKey && !tabMoves) {
      e.preventDefault();
      insert('  ');
    } else if (e.key === 'Enter' && !e.shiftKey && select.value !== 'plain') {
      // keep the indentation of the line you are leaving
      const before = ta.value.slice(0, ta.selectionStart);
      const indent = /^[ \t]*/.exec(before.slice(before.lastIndexOf('\n') + 1))![0];
      if (indent) { e.preventDefault(); insert('\n' + indent); }
    }
  });
  function insert(s: string) {
    // execCommand keeps the browser's undo history; setRangeText is the fallback where it is not available
    if (!document.execCommand || !document.execCommand('insertText', false, s)) {
      ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  void render();
}
