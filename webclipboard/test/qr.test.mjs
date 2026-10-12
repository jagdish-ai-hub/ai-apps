import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';
import { buildMatrix, wifiPayload, escapeWifi, normalizeUrl, contrastRatio, scanRisk, toSvg, renderRgba, scaleFor, hexToRgb } from '../src/lib/qr.js';

const decode = (text, o = {}) => {
  const m = buildMatrix(qrcode, text, o.ecc ?? 'M');
  const img = renderRgba(m, { margin: o.margin ?? 4, scale: 6, fg: o.fg, bg: o.bg });
  return jsQR(img.data, img.width, img.height)?.data;
};

test('a QR code decodes back to the same text (ASCII, URL, Japanese, emoji, accents)', () => {
  for (const t of ['hello', 'https://example.com/a?b=1&c=2#frag', '日本語のテキスト', 'Привет, мир', 'Ñandú ✓ 😀', 'x'.repeat(500)]) assert.equal(decode(t), t, t.slice(0, 20));
});
test('every error-correction level decodes', () => {
  for (const ecc of ['L', 'M', 'Q', 'H']) assert.equal(decode('error correction ' + ecc, { ecc }), 'error correction ' + ecc);
});
test('custom dark colours and margin still decode', () => {
  assert.equal(decode('colours', { fg: '#1a3a8a', bg: '#fff7e0', margin: 2 }), 'colours');
});
test('too much data throws too_long', () => {
  assert.throws(() => buildMatrix(qrcode, 'x'.repeat(5000), 'H'), /too_long/);
});

test('Wi-Fi payload format and escaping', () => {
  assert.equal(wifiPayload({ ssid: 'Home', password: 'secret123', security: 'WPA' }), 'WIFI:T:WPA;S:Home;P:secret123;;');
  assert.equal(wifiPayload({ ssid: 'Cafe', security: 'nopass' }), 'WIFI:T:nopass;S:Cafe;;');
  assert.equal(wifiPayload({ ssid: 'Hidden', password: 'pw', security: 'WPA', hidden: true }), 'WIFI:T:WPA;S:Hidden;P:pw;H:true;;');
  assert.equal(wifiPayload({ ssid: 'Old', password: 'k', security: 'WEP' }), 'WIFI:T:WEP;S:Old;P:k;;');
  const BS = String.fromCharCode(92);
  assert.equal(escapeWifi(`a;b,c:d"e${BS}f`), `a${BS};b${BS},c${BS}:d${BS}"e${BS}${BS}f`);
  { const BS = String.fromCharCode(92); assert.equal(wifiPayload({ ssid: 'My;Net', password: 'p:w;d', security: 'WPA' }), `WIFI:T:WPA;S:My${BS};Net;P:p${BS}:w${BS};d;;`); }
  assert.equal(wifiPayload({ ssid: 'x', password: 'y', security: 'unknown' }), 'WIFI:T:WPA;S:x;P:y;;');
});
test('Wi-Fi QR decodes to its payload (with special characters and Unicode)', () => {
  const p = wifiPayload({ ssid: 'Café "5G"; home', password: 'pä:ss;wörd,\\', security: 'WPA', hidden: true });
  assert.equal(decode(p), p);
});

test('normalizeUrl', () => {
  assert.deepEqual(normalizeUrl('example.com'), { url: 'https://example.com' });
  assert.deepEqual(normalizeUrl('  https://example.com/path?q=1  '), { url: 'https://example.com/path?q=1' });
  assert.deepEqual(normalizeUrl('//example.com'), { url: 'https://example.com' });
  assert.deepEqual(normalizeUrl('example.com:8080/x'), { url: 'https://example.com:8080/x' });
  assert.deepEqual(normalizeUrl('http://localhost:3000'), { url: 'http://localhost:3000' });
  assert.deepEqual(normalizeUrl('mailto:a@b.co'), { url: 'mailto:a@b.co' });
  assert.deepEqual(normalizeUrl('tel:+123456'), { url: 'tel:+123456' });
  assert.equal(normalizeUrl('').error, 'empty');
  assert.equal(normalizeUrl('two words.com').error, 'spaces');
  assert.equal(normalizeUrl('javascript:alert(1)').error, 'unsafe');
  assert.equal(normalizeUrl('data:text/html,hi').error, 'unsafe');
  assert.equal(normalizeUrl('notadomain').error, 'host');
  assert.equal(normalizeUrl('日本語.jp').url, 'https://日本語.jp');
});

test('contrast and scan risk', () => {
  assert.ok(contrastRatio('#000000', '#ffffff') > 20);
  assert.ok(contrastRatio('#777777', '#888888') < 2);
  assert.equal(scanRisk('#000000', '#ffffff'), 'ok');
  assert.equal(scanRisk('#ffffff', '#000000'), 'inverted');
  assert.equal(scanRisk('#777777', '#888888'), 'low');
  assert.deepEqual(hexToRgb('#ff8000'), [255, 128, 0]);
  assert.equal(hexToRgb('red'), null);
});

test('SVG output is well formed, scales and contains the colours', () => {
  const m = buildMatrix(qrcode, 'svg test', 'M');
  const svg = toSvg(m, { margin: 4, fg: '#112233', bg: '#ffeedd', size: 256 });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) \1"/);
  assert.ok(svg.includes('fill="#112233"') && svg.includes('fill="#ffeedd"') && svg.includes('width="256"'));
  assert.ok(!/NaN|undefined/.test(svg));
  assert.equal(scaleFor(m, 4, 300), Math.ceil(300 / (m.length + 8)));
});
