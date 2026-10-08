# WebClipboard.online

A free, multilingual online clipboard: paste text on one device, get a **6-digit code + short link + QR code**, open it on another device. No sign-up. Built to run entirely on the **Cloudflare free plan** and to rank in Google across Europe, Latin America and Asia-Pacific.

## Stack

| Layer | Tech | Why |
|---|---|---|
| Pages | **Astro 7** (static output) | Every language page is pre-rendered HTML, so crawlers see full content instantly |
| UI | Hand-written CSS (inlined), system fonts, ~8 KB of JS | No render-blocking requests, no webfont downloads, good Core Web Vitals |
| Hosting | **Cloudflare Workers Static Assets** | Static requests are free and unlimited on the free plan |
| API | One Cloudflare Worker (`worker/index.js`) | Only `/api/*` and `/c/*` run Worker code (`run_worker_first` in `wrangler.toml`) |
| Storage | **Cloudflare D1** (SQLite) | Clips + abuse reports; hourly cron deletes expired rows |
| Abuse control | Workers Rate Limiting binding, optional Turnstile, report button | Per-IP limits, auto-removal after 3 reports |
| Privacy | AES-256-GCM + PBKDF2 (250k iterations) in the browser | Optional password: the server only stores ciphertext |

## How it works

1. **Send**: `POST /api/clips` stores the text under a random 6-digit code with the chosen expiry (10 min / 1 h / 1 day / 7 days), optional burn-after-reading, optional client-side encryption.
2. **Receive**: enter the code (`POST /api/open`), open `/c/123456`, or scan the QR. `/c/<code>` redirects to the visitor's language page as `/<lang>/#<code>`. The code lives in the URL *fragment*, so it never reaches server logs, analytics or ad requests, and link-preview bots can't burn a one-time clip.
3. Burn-after-reading is atomic (`DELETE ... RETURNING`), so only one reader can win.

## Project layout

```
astro.config.mjs        static build, trailing slashes, inlined CSS
site.config.json        domain, contact email, AdSense/GA/Turnstile ids, max length
wrangler.toml           assets + D1 + rate limiters + cron
migrations/             D1 schema
worker/                 API (index.js), validation (clips.js), language negotiation (lang.js)
src/i18n/               languages.json + one JSON per language (30)
src/pages/              [...lang]/index.astro (home in every language), legal pages, sitemap, robots, ads.txt, manifest
src/components/         Tool (the clipboard UI), Ad (lazy AdSense slot)
src/scripts/app.ts      browser logic: send/receive, encryption, QR
test/                   node --test: translation integrity + core logic
```

## Develop

```bash
npm install
npm run dev                 # Astro dev server (UI only, no API)
npm run build               # -> dist/
npx wrangler d1 migrations apply webclipboard --local
npx wrangler dev            # full site + API on http://127.0.0.1:8787
npm test                    # 34 tests (translations + logic)
```

## Deploy to Cloudflare (free plan)

The D1 database `webclipboard` already exists on the account and its id is in `wrangler.toml`; the schema is applied. Remaining steps:

**Option A, from your terminal**
```bash
npx wrangler login
npm run deploy              # astro build && wrangler deploy
```

**Option B, auto-deploy from GitHub (recommended)**: Cloudflare dashboard → Workers & Pages → Create → Import a repository → this repo.
- Root directory: `webclipboard`
- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy`

**Custom domain**: add `webclipboard.online` to Cloudflare (Websites → Add a site), switch the registrar's nameservers, then uncomment the `routes` block in `wrangler.toml` and redeploy. Also add a redirect rule `www.webclipboard.online → https://webclipboard.online` (one canonical host).

Re-running `npm run db:migrate` is safe; the migration is idempotent.

### Free-plan capacity (verified against Cloudflare docs)

| Resource | Free limit | Effect here |
|---|---|---|
| Static asset requests | free, unlimited | All 30 language pages, CSS, JS, images never count against any quota |
| Worker requests | 100,000 / day | Only API calls and `/c/` links count (about 3 per clip lifecycle) |
| D1 row writes | 100,000 / day | A clip costs about 4 row writes (insert + index, later delete + index), so **roughly 25,000 clips/day** |
| D1 row reads | 5 million / day | Lookups are by primary key; not a constraint |
| D1 storage | 5 GB | Clips are deleted within the hour after expiry |
| CPU per request | 10 ms | Encryption/PBKDF2 runs in the browser, not the Worker |
| Cron triggers | 5 per account | Uses 1 |

When the daily API cap is hit, **pages keep loading and ads keep serving**; only saving/opening clips returns an error until midnight UTC. If you outgrow this, Workers Paid is $5/month and lifts all of these.

## SEO

- One crawlable URL per language: `/` (English), `/es/`, `/pt/`, `/ja/`, `/zh-tw/`, ... each with a translated title, description, H1, features, how-to and FAQ written around that language's own search term ("Portapapeles online", "Presse-papiers en ligne", "オンラインクリップボード", ...).
- `hreflang` for all 30 + `x-default`, self-referencing canonicals, `sitemap.xml` with alternates, `robots.txt` (blocks `/api/` and `/c/`).
- JSON-LD `WebApplication` + `FAQPage`, Open Graph / Twitter cards with a generated 1200×630 image.
- Language pages are only built if their translation file exists (a unit test enforces key parity, so an untranslated page can't ship as duplicate English).
- User clips are never indexable: they're fetched client-side by code and the `/c/` and `/api/` paths are `Disallow`ed.
- Performance: no blocking CSS/font requests, AdSense loads only when a slot nears the viewport and each slot reserves its height (no layout shift).

After launch: add the site to **Google Search Console** and **Bing Webmaster Tools**, submit `https://webclipboard.online/sitemap.xml`, and enable Cloudflare **Web Analytics** (cookie-free).

## Ads (AdSense) and Google Ads

1. Edit `site.config.json`: `adsense.client` (`ca-pub-…`) and the three slot ids (`afterTool`, `inContent`, `beforeFooter`). Leave blank and no ad code or space is emitted.
2. `/ads.txt` is generated from the same value. Redeploy.
3. Apply for AdSense after the site is live on the real domain. Reviewers look for original content, working navigation, and About / Privacy / Terms / Contact pages. These all exist; the English legal pages are linked from every page.
4. **EU/UK/Switzerland visitors require a consent message** (Google's certified CMP). Turn on *Privacy & messaging → European regulations* in AdSense; the footer "Privacy settings" link reopens it.
5. Running **Google Ads campaigns** to buy traffic: create one campaign per language and send each to its own URL (`/es/`, `/ja/` ...), keep the landing page's language identical to the ad's. Start with exact-match keywords in each language. Add `gtagId` in `site.config.json` and import conversions (e.g. "clip saved") if you want to optimise for them.

## Operations

- Abuse reports: `SELECT * FROM reports ORDER BY id DESC;` in the D1 console. Clips are auto-removed at 3 reports.
- Optional bot protection: create a Turnstile widget, put the site key in `site.config.json` (`turnstileSiteKey`) and store the secret with `npx wrangler secret put TURNSTILE_SECRET`.
- Legal pages are templates. Have them reviewed for your jurisdiction before relying on them.

## Adding or editing a language

Copy `src/i18n/en.json` to `src/i18n/<code>.json`, translate, add the entry to `src/i18n/languages.json`, run `npm test`.
