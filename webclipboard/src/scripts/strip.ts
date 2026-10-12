import { $, copyText, wireInput } from './shared';
import { markdownToPlain } from '../lib/md.js';
import { saveBlob } from '../lib/export.js';

const input = $<HTMLTextAreaElement>('st-in');
const output = $<HTMLTextAreaElement>('st-out');
let timer: number | undefined;

function update() {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    const v = input.value.slice(0, 2_000_000);
    output.value = v.trim() ? markdownToPlain(v) : '';
    $('st-count').textContent = v.trim() ? `${[...v].length.toLocaleString()} characters in, ${[...output.value].length.toLocaleString()} characters out` : '';
  }, 100);
}
wireInput('st', input, $('st-sample-text').textContent || '', update);
$('st-copy').addEventListener('click', (e) => copyText(output.value, e.currentTarget as HTMLElement));
$('st-download').addEventListener('click', () => { if (output.value) saveBlob(new Blob([output.value], { type: 'text/plain;charset=utf-8' }), 'plain-text.txt'); });
