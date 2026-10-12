import { $, copyText, wireInput } from './shared';
import { MODES } from '../lib/casing.js';

const input = $<HTMLTextAreaElement>('cc-in');
const output = $<HTMLTextAreaElement>('cc-out');
let mode = '';

function render() {
  const m = MODES.find((x) => x.id === mode);
  document.querySelectorAll<HTMLElement>('.cc-modes [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  output.value = m ? m.fn(input.value) : '';
  $('cc-msg').textContent = m ? `${m.label}: ${[...output.value].length.toLocaleString()} characters` : '';
}
document.querySelectorAll<HTMLElement>('.cc-modes [data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode!; render(); }));
wireInput('cc', input, $('cc-sample-text').textContent || '', render);
$('cc-copy').addEventListener('click', (e) => { if (output.value) copyText(output.value, e.currentTarget as HTMLElement); });
$('cc-use').addEventListener('click', () => { if (output.value) { input.value = output.value; render(); } });
