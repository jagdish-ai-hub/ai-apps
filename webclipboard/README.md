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
src/pages/              [...lang]/index.astro (home in every language), guides/, legal pages, sitemap, robots, ads.txt, manifest
src/guides/             one Markdown file per guide (frontmatter: title, description, h1, lead, category, updated, related, faq)
src/components/         Tool (the clipboard UI), TokenCalc (token calculator UI), Ad (lazy AdSense slot)
src/scripts/app.ts      browser logic: send/receive, encryption, QR
src/scripts/tokens.ts   token calculator: OpenAI BPE tokenizers (lazy-loaded), cost, context-fit, token view
src/lib/tokencalc.js    pure helpers for the calculator (cost maths, formatting, token grouping), unit-tested
test/                   node --test: translation integrity + core logic
```

## Develop

```bash
npm install
npm run dev                 # Astro dev server (UI only, no API)
npm run build               # -> dist/
npx wrangler d1 migrations apply webclipboard --local
npx wrangler dev            # full site + API on http://127.0.0.1:8787
npm run build && npm test   # translations, core logic, guide quality, broken-link crawl
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

## Token Calculator (`/token-calculator/`)

A second tool, linked from the nav bar. It counts tokens with OpenAI's real vocabularies (`o200k_base` for GPT-4o and newer, `cl100k_base` for GPT-4/3.5, via the MIT-licensed `gpt-tokenizer` package), shows how the text is split, how much of common context windows it uses, and estimates input/output cost from prices the visitor types in (per 1M tokens; no price table is shipped because prices change). Everything runs in the browser; each 1-2 MB vocabulary is a separate chunk that downloads only when needed. Three more token pages are generated from data at build time: `/token-cost-by-language/` (the site's own copy counted with both tokenizers in all 30 languages, with a chart, table, method notes and CSV/JSON downloads at `/data/`; `src/lib/tokenstats.js` is the pure, tested maths and `src/lib/langdata.ts` feeds it from `src/i18n`), and two tokenizer pages, `/o200k-base-token-counter/` and `/cl100k-base-tokenizer/` (`src/components/TokenizerPage.astro`, content in `src/lib/tokenizers.ts`), each with the calculator preset to that encoding. Model names shown come from the library's own model table, not from memory. Add a language and its row, chart bar, CSV line and JSON entry appear automatically. Five guides in the **Tokens** category explain tokenizers, rules of thumb, language differences, API pricing and token-saving tips; their numbers were measured with the same library.

## Guides (original, non-translated content)

`/guides/` is a hub plus thirteen English guides: eight clipboard how-tos (phone to PC, iPhone and Windows, Wi-Fi password, students, notes transfer, code snippets, public computers, smart TVs) and five token guides (set `tool: tokens` in the frontmatter to show a calculator link instead of the clipboard). Each page embeds the working clipboard, a table of contents, an FAQ and related guides, and emits `Article`, `BreadcrumbList` and `FAQPage` JSON-LD. Add a guide by dropping a Markdown file in `src/guides/`; the hub, sitemap and tests pick it up automatically. Tests enforce a minimum body length (a thin-content guard), unique titles and descriptions, valid `related` slugs, and that no internal link in the built site is broken.

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

## Share this tool

A small floating **Share** button (bottom-right, icon-only on phones, hidden while the footer is on screen) and a "Share this tool" prompt shown after a code is created and after text is received. On touch devices it opens the phone's native share sheet (WhatsApp, Messages, AirDrop, Nearby Share, etc.); everywhere else, or if the native sheet errors, it shows a menu with brand icons (simple-icons, CC0; paths in `src/lib/shareicons.js`, logic in `src/lib/sharenets.js`, both unit-tested) and, on desktop browsers that have the system share sheet, a "More…" tile that opens it. The menu order depends on the page language (e.g. LINE first for Japanese, Thai and Traditional Chinese, Telegram and VK for Russian, Weibo for Simplified Chinese). It always shares the page's canonical URL with `utm_source=share&utm_medium=<channel>`, never `location.href`, so a clip code in the address bar can never leak. Link previews: every page emits Open Graph and Twitter tags (title and description in the page language, a 1200×630 PNG, alt text); `test/social.test.mjs` fails the build if any page lacks them or the image is missing or over 300 KB. Strings are translated in all 30 languages (`share*` keys); code is in `src/components/ShareWidget.astro` and `src/scripts/share.ts`.

## Analytics (Cloudflare Web Analytics, cookie-free)

Workers logs and request metrics are already on in the Cloudflare dashboard (`observability` in `wrangler.toml`). For visitor analytics (page views, countries, referrers, Core Web Vitals):

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**, hostname `webclipboard.online`.
2. Copy the `token` from the snippet it shows and put it in `site.config.json` as `cloudflareAnalyticsToken`, then deploy. The beacon loads deferred on every page; with an empty token no analytics code is emitted.
   (Alternatively use the "automatic setup" toggle there, which needs no code once the domain is proxied through Cloudflare.)

Because it uses no cookies, it needs no consent banner. The privacy policy already describes it.

## Operations

- Abuse reports: `SELECT * FROM reports ORDER BY id DESC;` in the D1 console. Clips are auto-removed at 3 reports.
- Optional bot protection: create a Turnstile widget, put the site key in `site.config.json` (`turnstileSiteKey`) and store the secret with `npx wrangler secret put TURNSTILE_SECRET`.
- Legal pages are templates. Have them reviewed for your jurisdiction before relying on them.

## Adding or editing a language

Copy `src/i18n/en.json` to `src/i18n/<code>.json`, translate, add the entry to `src/i18n/languages.json`, run `npm test`.
