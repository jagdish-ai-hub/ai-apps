# WebClipboard.online: project status

Last updated: 2026-10-14. Live at https://webclipboard.online (deployed from `main` by Cloudflare Workers Builds).
For setup, deploy steps and technical detail see [README.md](README.md). This file says what is built, what is verified and what is left.

## At a glance

| | |
|---|---|
| What it is | Free multilingual online clipboard (paste text, get a 6-digit code, short link and QR) plus a set of free in-browser text, QR, converter and AI-text tools |
| Stack | Astro static site, Cloudflare Worker, D1 database, Cloudflare Workers Static Assets. Free plan only |
| Languages | 30 for the clipboard; 6 (en, ja, ko, de, es, pt) for native guides, landing pages and QR pages |
| Pages live | 152 URLs in the sitemap, all returning 200 |
| Tests | 272 passing (`npm test`, needs a build first) |
| `main` vs dev branch | identical (`b840916`); dev branch is `ccr-a2a0a830-dn3nce` |

## Built

### Clipboard (home page, 30 languages)
- Paste text, get a 6-digit code, share link and QR; receive by code or link.
- Expiry of 10 minutes, 1 hour, 1 day or 7 days; delete after the first view.
- Optional password: text is encrypted in the browser (AES-256-GCM) and the server stores only ciphertext.
- Download received text as .txt, .md, Word (.docx) or PDF (PDF uses the browser's print dialog, so every script prints correctly).
- Limit of 100,000 characters, rate limiting, report button, privacy/terms/about/contact pages.
- Browser-language suggestion banner, light and dark themes, share buttons.

### Tools (each has its own page, title, JSON-LD, FAQ and its own guide)
| Group | Pages |
|---|---|
| Move text between devices | `/iphone-to-windows-clipboard/`, `/code-share/` (syntax-highlighted code, 20 languages, auto-detect) |
| QR codes | `/qr-code-generator/`, `/url-to-qr-code/`, `/wifi-qr-code-generator/` (PNG and SVG, colours, size, error correction; also in ja/ko/de/es/pt) |
| Converters | `/text-to-pdf/`, `/text-to-word/`, `/markdown-to-pdf/`, `/markdown-to-word/` |
| AI-answer and LLM tools | `/chatgpt-to-word/`, `/chatgpt-to-pdf/`, `/strip-markdown/`, `/rag-text-chunker/`, `/jsonl-fine-tuning-validator/` |
| Text | `/word-counter/` (handles Japanese, Chinese, Thai), `/case-converter/` |
| Tokens | `/token-calculator/`, `/o200k-base-token-counter/`, `/cl100k-base-tokenizer/`, `/token-cost-by-language/`, plus per-language pages under `/tokens-in/` |
| Hub | `/tools/` lists everything; the home page has a "More free tools" section |

All tools run in the browser; nothing typed into them is uploaded.

### Content
- Guides: 36 English, 7 Japanese, 3 each in Korean, German, Spanish and Portuguese. Guides are original, not machine-translated copies.
- Native landing pages for iPhone to Windows (ja, ko, de, es, pt) and native QR pages (same languages).
- Reciprocal hreflang with `x-default`, sitemap alternates, JSON-LD (WebApplication, BreadcrumbList, HowTo, FAQPage, Article, CollectionPage).

### Analytics and indexing
- Microsoft Clarity installed, with clip text, codes, passwords and links masked. Cloudflare Web Analytics code is in place but its token is empty.
- IndexNow set up; all 152 URLs were submitted on 2026-10-13.
- Bing site verification present.

## Verified on the live site (2026-10-13)
- All 152 sitemap URLs return 200; 24 key pages load with no script errors; no sideways scrolling at 320 px and 390 px.
- QR codes render and download; a clip made in one browser was received in another; a Python snippet round-tripped through code share with syntax colours.
- Word files checked with python-docx and LibreOffice; QR codes checked by decoding them back; PDFs checked headless.

## Not verified yet
- Real Safari, Firefox and a real Word install; the PDF print dialog on phones.
- Korean, German, Spanish and Portuguese text has not been read by native speakers.
- Korean, Hindi and Arabic PDF fonts (depends on the viewer's device fonts).
- One claim in the Korean iPhone/Windows guide (KakaoTalk PC "chat with myself") rests on a 2015 article.

## Your to-do list (cannot be done from code)
1. Cloudflare: turn on **Always Use HTTPS** (http currently answers 200 without redirecting).
2. Cloudflare: set up the **www to apex redirect** (www currently errors).
3. Submit `https://webclipboard.online/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
4. Cloudflare Web Analytics: create the site token and put it in `site.config.json` (`cloudflareAnalyticsToken`); turn on **Bot Fight Mode**.
5. AdSense: apply, then fill `adsense.client` and the three slot IDs in `site.config.json`.
6. Turnstile: create a site key and put it in `turnstileSiteKey` if bot abuse appears.
7. If many visitors come from the EU or UK, add a consent banner before ads and Clarity.
8. Ask a native speaker to read the ko/de/es/pt pages.

## Pipeline (not started)
Wait two to four weeks and see which pages get impressions before building more.
- Generic text tools: remove line breaks / extra spaces, remove duplicate lines and sort, compare two texts (diff).
- Native versions of the new text, AI and converter tool pages (only the clipboard, QR pages, landings and some guides are native today).
- Native token-cost pages in the remaining languages.
- More guides on topics that Search Console shows are working.

## Decisions already made
- Everything stays free-plan friendly: static pages, browser-side tools, one small D1 table.
- No sign-in, no tracking of QR scans, text never sent to third parties.
- No cost claims on token pages unless measured; numbers come from the real tokenizers at build time.
- `main` is updated only when the owner says so; IndexNow is run only for new or changed pages.
