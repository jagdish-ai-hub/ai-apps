// Converter pages: text or Markdown in, .docx or PDF out. Everything happens in the browser.
import { saveBlob, safeName, printAsPdf, textNode, htmlNode, DOCX_TYPE } from '../lib/export.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const root = $('converter');
const mode = root.dataset.mode as 'text-pdf' | 'text-docx' | 'md-pdf' | 'md-docx';
const isMd = mode.startsWith('md');
const isPdf = mode.endsWith('pdf');
const MAX = 2_000_000;

const text = $<HTMLTextAreaElement>('cv-text');
const msg = $('cv-msg');
const count = $('cv-count');
const preview = document.getElementById('cv-preview');

const opts = () => ({
  font: $<HTMLSelectElement>('cv-font').value,
  size: Number($<HTMLSelectElement>('cv-size').value),
  page: $<HTMLSelectElement>('cv-page').value,
  margin: $<HTMLSelectElement>('cv-margin').value,
});

let mdLib: Promise<typeof import('../lib/md.js')> | undefined;
const loadMd = () => (mdLib ||= import('../lib/md.js'));

let timer: number | undefined;
function update() {
  const v = text.value;
  const words = (v.trim().match(/\S+/g) || []).length;
  count.textContent = `${[...v].length.toLocaleString()} characters · ${words.toLocaleString()} words`;
  if (preview) {
    clearTimeout(timer);
    timer = window.setTimeout(async () => {
      if (!text.value.trim()) { preview.innerHTML = '<p class="hint">The formatted preview appears here as you type.</p>'; return; }
      const { markdownToHtml } = await loadMd();
      preview.innerHTML = markdownToHtml(text.value.slice(0, MAX)); // escaped, only safe elements
    }, 120);
  }
}
text.addEventListener('input', update);

$('cv-sample').addEventListener('click', () => { text.value = $('cv-sample-text').textContent || ''; update(); text.focus(); });
$('cv-clear').addEventListener('click', () => { text.value = ''; msg.textContent = ''; update(); text.focus(); });
$('cv-paste').addEventListener('click', async () => {
  try { text.value = await navigator.clipboard.readText(); update(); }
  catch { msg.textContent = 'Your browser did not allow reading the clipboard. Paste with Ctrl+V (or long-press and Paste) instead.'; }
});

$('cv-go').addEventListener('click', async () => {
  msg.textContent = '';
  const value = text.value;
  if (!value.trim()) { msg.textContent = 'Paste some text first.'; text.focus(); return; }
  if (value.length > MAX) { msg.textContent = 'That is too long for one file. Split it into smaller parts.'; return; }
  const btn = $<HTMLButtonElement>('cv-go');
  btn.disabled = true;
  const name = safeName($<HTMLInputElement>('cv-name').value);
  try {
    if (isPdf) {
      if (isMd) { const { markdownToHtml } = await loadMd(); printAsPdf(htmlNode(markdownToHtml(value)), opts(), name); }
      else printAsPdf(textNode(value), opts(), name);
    } else {
      const { textToDocx, markdownToDocx } = await import('../lib/docx.js');
      const bytes = isMd ? markdownToDocx(value, opts()) : textToDocx(value, opts());
      saveBlob(new Blob([bytes], { type: DOCX_TYPE }), `${name}.docx`);
    }
  } catch {
    msg.textContent = 'Something went wrong while creating the file. Try a smaller piece of text.';
  } finally {
    btn.disabled = false;
  }
});
update();
