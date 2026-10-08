// WebClipboard.online — Cloudflare Worker (free plan friendly).
//
// Static pages (all languages) are served directly from Workers Static Assets,
// which is free and unmetered. This script only runs for the routes listed in
// wrangler.toml `run_worker_first` (/api/* and /c/*) plus the hourly cron.

import { CODE_RE, MAX_BODY_BYTES, randomCode, validateCreate } from './clips.js';
import { langPath, negotiate } from './lang.js';

const REPORTS_TO_REMOVE = 3;
const REPORT_REASON_MAX = 500;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    try {
      if (pathname.startsWith('/api/')) {
        if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
        const blocked = checkOrigin(request, url);
        if (blocked) return blocked;
        if (pathname === '/api/clips') return await createClip(request, env);
        if (pathname === '/api/open') return await openClip(request, env);
        if (pathname === '/api/report') return await reportClip(request, env);
        return json({ error: 'not_found' }, 404);
      }
      if (pathname.startsWith('/c/')) return shortLink(request, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error' }, 500);
    }
    return env.ASSETS.fetch(request);
  },

  // Hourly cleanup of expired clips (cron trigger in wrangler.toml).
  async scheduled(_event, env) {
    const res = await env.DB.prepare('DELETE FROM clips WHERE expires_at <= ?').bind(now()).run();
    console.log(`cleanup: removed ${res.meta.changes} expired clips`);
  },
};

// ---------------------------------------------------------------------------
// Handlers

async function createClip(request, env) {
  const ip = clientIp(request);
  if (!(await allow(env.CREATE_LIMITER, ip))) return json({ error: 'rate_limited' }, 429);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400);

  const v = validateCreate(body);
  if (!v.ok) return json({ error: v.error }, v.error === 'too_long' ? 413 : 400);

  if (env.TURNSTILE_SECRET && !(await verifyTurnstile(env.TURNSTILE_SECRET, body.turnstile, ip))) {
    return json({ error: 'captcha' }, 403);
  }

  const { content, ttl, burn, encrypted } = v.value;
  const created = now();
  const expires = created + ttl;

  // Pick a random free code. An expired-but-not-yet-cleaned row with the same
  // code is removed first so codes recycle without waiting for the cron.
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomCode();
    const [, insert] = await env.DB.batch([
      env.DB.prepare('DELETE FROM clips WHERE code = ? AND expires_at <= ?').bind(code, created),
      env.DB.prepare(
        'INSERT OR IGNORE INTO clips (code, content, encrypted, burn, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(code, content, encrypted ? 1 : 0, burn ? 1 : 0, created, expires),
    ]);
    if (insert.meta.changes === 1) return json({ code, expiresAt: expires * 1000, burn, encrypted }, 201);
  }
  return json({ error: 'busy' }, 503);
}

async function openClip(request, env) {
  if (!(await allow(env.READ_LIMITER, clientIp(request)))) return json({ error: 'rate_limited' }, 429);

  const body = await readJson(request);
  const code = typeof body?.code === 'string' ? body.code.replace(/\s+/g, '') : '';
  if (!CODE_RE.test(code)) return json({ error: 'bad_code' }, 400);

  const t = now();
  let row = await env.DB.prepare(
    'SELECT content, encrypted, burn, expires_at FROM clips WHERE code = ? AND expires_at > ?',
  ).bind(code, t).first();
  if (!row) return json({ error: 'not_found' }, 404);

  if (row.burn) {
    // DELETE ... RETURNING makes burn-after-reading atomic: only one reader wins.
    row = await env.DB.prepare(
      'DELETE FROM clips WHERE code = ? AND expires_at > ? RETURNING content, encrypted, burn, expires_at',
    ).bind(code, t).first();
    if (!row) return json({ error: 'not_found' }, 404);
  }

  return json({
    content: row.content,
    encrypted: row.encrypted === 1,
    burned: row.burn === 1,
    expiresAt: row.expires_at * 1000,
  });
}

async function reportClip(request, env) {
  if (!(await allow(env.CREATE_LIMITER, clientIp(request)))) return json({ error: 'rate_limited' }, 429);

  const body = await readJson(request);
  const code = typeof body?.code === 'string' ? body.code.replace(/\s+/g, '') : '';
  if (!CODE_RE.test(code)) return json({ error: 'bad_code' }, 400);
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, REPORT_REASON_MAX) : '';

  const t = now();
  const row = await env.DB.prepare(
    'UPDATE clips SET reports = reports + 1 WHERE code = ? AND expires_at > ? RETURNING content, encrypted, reports',
  ).bind(code, t).first();
  if (!row) return json({ ok: true }); // already gone; nothing to do

  const excerpt = row.encrypted ? '[encrypted]' : row.content.slice(0, 2000);
  const stmts = [
    env.DB.prepare('INSERT INTO reports (code, reason, excerpt, created_at) VALUES (?, ?, ?, ?)').bind(code, reason, excerpt, t),
  ];
  if (row.reports >= REPORTS_TO_REMOVE) stmts.push(env.DB.prepare('DELETE FROM clips WHERE code = ?').bind(code));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

// Short share link: /c/123456 -> /<visitor language>/#123456
// The code travels in the URL fragment so it never reaches server logs, analytics
// or ad requests, and link-preview bots cannot consume burn-after-reading clips.
function shortLink(request, url) {
  const code = url.pathname.slice(3).replace(/\/$/, '');
  const lang = negotiate(request.headers.get('Accept-Language'));
  const target = new URL(langPath(lang), url.origin);
  if (CODE_RE.test(code)) target.hash = code;
  return new Response(null, {
    status: 302,
    headers: { Location: target.toString(), 'Cache-Control': 'no-store', Vary: 'Accept-Language' },
  });
}

// ---------------------------------------------------------------------------
// Utilities

const now = () => Math.floor(Date.now() / 1000);

const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      ...extraHeaders,
    },
  });
}

/** Only accept same-origin JSON requests (blocks cross-site form posts and other sites using the API). */
function checkOrigin(request, url) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.startsWith('application/json')) return json({ error: 'unsupported_media_type' }, 415);
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return json({ error: 'forbidden' }, 403);
  return null;
}

async function readJson(request) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Workers Rate Limiting binding; if it is not configured, allow the request. */
async function allow(limiter, key) {
  if (!limiter) return true;
  const { success } = await limiter.limit({ key });
  return success;
}

async function verifyTurnstile(secret, token, ip) {
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip !== 'unknown') form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}
