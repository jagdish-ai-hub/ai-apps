// QR code generator: builds the code in the browser, shows it, and offers PNG and SVG downloads. Nothing is uploaded.
import { $ } from './shared';
import { buildMatrix, normalizeUrl, wifiPayload, scanRisk, toSvg, renderRgba, scaleFor } from '../lib/qr.js';
import { saveBlob } from '../lib/export.js';

const cfg = JSON.parse($('qr-config').textContent || '{}') as { kind: 'text' | 'url' | 'wifi'; ui: Record<string, string> };
const ui = cfg.ui;
const kind = cfg.kind;
const val = (id: string) => ($<HTMLInputElement>(id)?.value ?? '');
const msg = $('qr-msg');
const pngBtn = $<HTMLButtonElement>('qr-png');
const svgBtn = $<HTMLButtonElement>('qr-svg');
let matrix: boolean[][] | null = null;
let qrLib: Promise<any> | undefined;
let timer: number | undefined;
let run = 0;

function payload(): { text?: string; empty?: boolean; error?: string } {
  if (kind === 'text') {
    const t = val('qr-text');
    return t.trim() ? { text: t } : { empty: true };
  }
  if (kind === 'url') {
    if (!val('qr-url').trim()) return { empty: true };
    const r = normalizeUrl(val('qr-url'));
    if ('error' in r) return { error: r.error === 'empty' ? 'errEmpty' : r.error === 'spaces' ? 'errSpaces' : r.error === 'unsafe' ? 'errUnsafe' : r.error === 'host' ? 'errHost' : 'errInvalid' };
    return { text: r.url };
  }
  const ssid = val('qr-ssid');
  const sec = val('qr-sec');
  if (!ssid.trim() && !val('qr-pass')) return { empty: true };
  if (!ssid.trim()) return { error: 'errSsid' };
  if (sec !== 'nopass' && !val('qr-pass')) return { error: 'errPass' };
  return { text: wifiPayload({ ssid, password: val('qr-pass'), security: sec as 'WPA' | 'WEP' | 'nopass', hidden: $<HTMLInputElement>('qr-hidden').checked }) };
}

const opts = () => ({ margin: Number(val('qr-margin')), fg: val('qr-fg'), bg: val('qr-bg'), size: Number(val('qr-size')) });

function showEmpty() {
  matrix = null;
  $('qr-preview').replaceChildren(Object.assign(document.createElement('p'), { className: 'hint', id: 'qr-empty', textContent: ui.empty }));
  pngBtn.disabled = svgBtn.disabled = true;
}

async function update() {
  const mine = ++run;
  const p = payload();
  msg.textContent = '';
  if (p.empty) { showEmpty(); return; }
  if (p.error) { msg.textContent = ui[p.error]; showEmpty(); return; }
  try {
    qrLib ||= import('qrcode-generator').then((m) => m.default);
    const lib = await qrLib;
    if (mine !== run) return;
    matrix = buildMatrix(lib, p.text!, val('qr-ecc'));
  } catch (e) {
    msg.textContent = ui.errTooLong;
    showEmpty();
    return;
  }
  const o = opts();
  const preview = $('qr-preview');
  preview.innerHTML = toSvg(matrix, { ...o, size: 320 }); // built from numbers and validated colours only
  preview.querySelector('svg')?.setAttribute('aria-label', ui.altText);
  pngBtn.disabled = svgBtn.disabled = false;
  const risk = scanRisk(o.fg, o.bg);
  if (risk === 'low') msg.textContent = ui.warnLow;
  else if (risk === 'inverted') msg.textContent = ui.warnInverted;
}
const schedule = () => { clearTimeout(timer); timer = window.setTimeout(update, 80); };

for (const id of ['qr-text', 'qr-url', 'qr-ssid', 'qr-pass', 'qr-sec', 'qr-hidden', 'qr-ecc', 'qr-size', 'qr-margin', 'qr-fg', 'qr-bg']) document.getElementById(id)?.addEventListener('input', schedule);
$('qr-clear').addEventListener('click', () => {
  for (const id of ['qr-text', 'qr-url', 'qr-ssid', 'qr-pass']) { const el = document.getElementById(id) as HTMLInputElement | null; if (el) el.value = ''; }
  update();
});
$('qr-sample').addEventListener('click', () => {
  if (kind === 'text') $<HTMLTextAreaElement>('qr-text').value = ui.textSample;
  if (kind === 'url') $<HTMLInputElement>('qr-url').value = ui.urlSample;
  update();
});
document.getElementById('qr-show')?.addEventListener('change', (e) => { $<HTMLInputElement>('qr-pass').type = (e.target as HTMLInputElement).checked ? 'text' : 'password'; });

const fileBase = kind === 'wifi' ? 'wifi-qr-code' : 'qr-code';
svgBtn.addEventListener('click', () => { if (matrix) saveBlob(new Blob([toSvg(matrix, opts())], { type: 'image/svg+xml' }), `${fileBase}.svg`); });
pngBtn.addEventListener('click', () => {
  if (!matrix) return;
  const o = opts();
  const img = renderRgba(matrix, { margin: o.margin, scale: scaleFor(matrix, o.margin, o.size), fg: o.fg, bg: o.bg });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d')!.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  canvas.toBlob((b) => { if (b) saveBlob(b, `${fileBase}.png`); }, 'image/png');
});
