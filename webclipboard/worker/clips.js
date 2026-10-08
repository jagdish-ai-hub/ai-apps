// Pure helpers for clip validation and code generation (no I/O, unit-tested).

export const CODE_RE = /^\d{6}$/;

export const EXPIRY_SECONDS = {
  '10m': 600,
  '1h': 3600,
  '1d': 86400,
  '7d': 604800,
};

// Plain text is capped client-side at site.config.json maxChars (100k). Encrypted
// envelopes are base64 of UTF-8 bytes, so allow generous headroom server-side.
export const MAX_PLAIN_CHARS = 100_000;
export const MAX_STORED_CHARS = 600_000;
export const MAX_BODY_BYTES = 700_000;

/** Cryptographically random 6-digit code ("000000"–"999999"). */
export function randomCode() {
  const buf = new Uint32Array(1);
  // Rejection sampling avoids modulo bias.
  const limit = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

/** Validate the client-side encryption envelope: {"v":1,"s":salt,"i":iv,"c":ciphertext}. */
export function isValidEnvelope(content) {
  let env;
  try {
    env = JSON.parse(content);
  } catch {
    return false;
  }
  return (
    env !== null &&
    typeof env === 'object' &&
    env.v === 1 &&
    typeof env.s === 'string' && B64_RE.test(env.s) && env.s.length <= 64 &&
    typeof env.i === 'string' && B64_RE.test(env.i) && env.i.length <= 64 &&
    typeof env.c === 'string' && B64_RE.test(env.c)
  );
}

/**
 * Validate a create-clip request body.
 * Returns { ok: true, value } or { ok: false, error } with a machine-readable error code.
 */
export function validateCreate(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'bad_request' };
  const { content, expiry, burn = false, encrypted = false } = body;
  if (typeof content !== 'string' || content.trim() === '') return { ok: false, error: 'empty' };
  if (typeof burn !== 'boolean' || typeof encrypted !== 'boolean') return { ok: false, error: 'bad_request' };
  if (!Object.hasOwn(EXPIRY_SECONDS, expiry)) return { ok: false, error: 'bad_expiry' };
  if (encrypted) {
    if (content.length > MAX_STORED_CHARS || !isValidEnvelope(content)) return { ok: false, error: 'bad_envelope' };
  } else if (content.length > MAX_PLAIN_CHARS) {
    return { ok: false, error: 'too_long' };
  }
  return { ok: true, value: { content, ttl: EXPIRY_SECONDS[expiry], burn, encrypted } };
}
