// QR code helpers: payloads (URL, Wi-Fi), contrast check and rendering. Pure functions, unit-tested; the encoder is qrcode-generator.
// The same renderRgba() produces the PNG in the browser and the pixels the tests decode with jsQR, so what we test is what we ship.

export const ECC_LEVELS = ['L', 'M', 'Q', 'H'];

/** Build the module matrix (true = dark) for a text. Throws RangeError('too_long') when it does not fit even at version 40. */
export function buildMatrix(qrcode, text, ecc = 'M') {
  qrcode.stringToBytes = (str) => Array.from(new TextEncoder().encode(str)); // non-ASCII text (Japanese, emoji, accents) must be UTF-8
  const qr = qrcode(0, ECC_LEVELS.includes(ecc) ? ecc : 'M');
  qr.addData(String(text), 'Byte');
  try { qr.make(); } catch (e) { throw new RangeError('too_long'); }
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

/** Escape the characters that are special in the WIFI: format. */
export const escapeWifi = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');

/**
 * Wi-Fi join string understood by the camera apps on iOS and Android: WIFI:T:WPA;S:name;P:password;H:true;;
 * security: 'WPA' (also used for WPA2 and WPA3 networks), 'WEP' or 'nopass'.
 */
export function wifiPayload({ ssid, password = '', security = 'WPA', hidden = false }) {
  const t = security === 'nopass' || security === 'WEP' ? security : 'WPA';
  let out = `WIFI:T:${t};S:${escapeWifi(ssid)};`;
  if (t !== 'nopass') out += `P:${escapeWifi(password)};`;
  if (hidden) out += 'H:true;';
  return out + ';';
}

/** A link a person typed: add https:// when no scheme was given. Returns { url } or { error }. */
export function normalizeUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { error: 'empty' };
  if (/\s/.test(raw)) return { error: 'spaces' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[a-z0-9.-]+:\d+(\/|$)/i.test(raw); // "example.com:8080" is a host and port, not a scheme
  const url = hasScheme ? raw : `https://${raw.replace(/^\/\//, '')}`;
  if (/^(javascript|data|vbscript|file):/i.test(url)) return { error: 'unsafe' };
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (!u.hostname || (!u.hostname.includes('.') && u.hostname !== 'localhost' && !/^[\d.]+$|:/.test(u.hostname))) return { error: 'host' };
    } catch { return { error: 'invalid' }; }
  }
  return { url };
}

// ---------------------------------------------------------------- colours and rendering

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a, b) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return 1;
  const [hi, lo] = lum(x) >= lum(y) ? [lum(x), lum(y)] : [lum(y), lum(x)];
  return (hi + 0.05) / (lo + 0.05);
}

/** 'ok', 'low' (hard to scan) or 'inverted' (light code on a dark background: many readers fail). */
export function scanRisk(fg, bg) {
  const x = hexToRgb(fg);
  const y = hexToRgb(bg);
  if (!x || !y) return 'ok';
  if (lum(x) > lum(y)) return 'inverted';
  return contrastRatio(fg, bg) < 3 ? 'low' : 'ok';
}

/** SVG markup: one path of squares, scalable, with the quiet zone (margin, in modules) included. */
export function toSvg(matrix, { margin = 4, fg = '#000000', bg = '#ffffff', size = 300 } = {}) {
  const n = matrix.length;
  const total = n + margin * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      let run = 1; // join horizontal neighbours into one rectangle to keep the file small
      while (c + run < n && matrix[r][c + run]) run++;
      d += `M${c + margin} ${r + margin}h${run}v1h-${run}z`;
      c += run - 1;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img"><rect width="${total}" height="${total}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
}

/** RGBA pixels for a PNG or for decoding. `scale` is the pixel size of one module. */
export function renderRgba(matrix, { margin = 4, scale = 8, fg = '#000000', bg = '#ffffff' } = {}) {
  const n = matrix.length;
  const side = (n + margin * 2) * scale;
  const f = hexToRgb(fg) ?? [0, 0, 0];
  const b = hexToRgb(bg) ?? [255, 255, 255];
  const data = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) {
    const r = Math.floor(y / scale) - margin;
    for (let x = 0; x < side; x++) {
      const c = Math.floor(x / scale) - margin;
      const dark = r >= 0 && c >= 0 && r < n && c < n && matrix[r][c];
      const col = dark ? f : b;
      const i = (y * side + x) * 4;
      data[i] = col[0]; data[i + 1] = col[1]; data[i + 2] = col[2]; data[i + 3] = 255;
    }
  }
  return { data, width: side, height: side };
}

/** Pixels per module that makes the image at least `size` pixels wide with whole-pixel modules. */
export const scaleFor = (matrix, margin, size) => Math.max(1, Math.ceil(size / (matrix.length + margin * 2)));
