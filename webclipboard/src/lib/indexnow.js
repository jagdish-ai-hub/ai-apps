// IndexNow helpers (https://www.indexnow.org/documentation). Pure functions, unit-tested; the CLI in scripts/indexnow.mjs does the I/O.

export const MAX_URLS_PER_REQUEST = 10_000;
export const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Keys are 8-128 characters: letters, digits and dashes. */
export const isValidKey = (key) => typeof key === 'string' && /^[A-Za-z0-9-]{8,128}$/.test(key);

export const keyFileName = (key) => `${key}.txt`;
export const keyLocation = (host, key) => `https://${host}/${keyFileName(key)}`;

/** All <loc> URLs of a sitemap. (xhtml:link alternates use href, not <loc>, and are intentionally ignored.) */
export function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
}

/**
 * Build one or more request bodies. URLs outside https://<host>/ are dropped (IndexNow rejects them with 422),
 * duplicates are removed, and long lists are split into chunks of at most `max` URLs.
 * @returns {{bodies: object[], kept: string[], dropped: string[]}}
 */
export function buildPayloads({ host, key, urls, max = MAX_URLS_PER_REQUEST }) {
  if (!host || /[/:]/.test(host)) throw new Error('host must be a bare hostname such as example.com');
  if (!isValidKey(key)) throw new Error('IndexNow key must be 8-128 letters, digits or dashes');
  const kept = [];
  const dropped = [];
  const seen = new Set();
  for (const raw of urls) {
    let u;
    try { u = new URL(raw); } catch { dropped.push(raw); continue; }
    if (u.protocol !== 'https:' || u.hostname !== host || u.hash) { dropped.push(raw); continue; }
    if (seen.has(u.href)) continue;
    seen.add(u.href);
    kept.push(u.href);
  }
  const bodies = [];
  for (let i = 0; i < kept.length; i += max) {
    bodies.push({ host, key, keyLocation: keyLocation(host, key), urlList: kept.slice(i, i + max) });
  }
  return { bodies, kept, dropped };
}

const STATUS = {
  200: 'OK: URLs submitted.',
  202: 'Accepted: URLs received, key validation is pending.',
  400: 'Bad request: invalid format.',
  403: 'Forbidden: the key is not valid, the key file was not found, or it does not contain the key.',
  422: 'Unprocessable: the URLs do not belong to the host, or the key does not match the schema.',
  429: 'Too many requests: slow down, this can be flagged as spam.',
};
export const describeStatus = (code) => STATUS[code] || `Unexpected response ${code}.`;
export const isSuccess = (code) => code === 200 || code === 202;
