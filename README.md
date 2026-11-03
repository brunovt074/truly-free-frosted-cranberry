# Truly Free Home · Frosted Cranberry offer landing

Single-page offer landing for the Frosted Cranberry Everyday Cleaner + Aloe Hand Soap bundle (Good $14 · Better $24 · Best $39). Static HTML/CSS/JS, no UI framework, no Tailwind. Built strictly on the Frosted Cranberry design system (`tokens.json`, `bundle.css`, blueprint, SEO/GEO and handoff docs).

- Live URL: https://frosted-cranberry.72-60-247-32.sslip.io (deployed to the VPS by GitHub Actions on every push to `main`).
- Screenshots: `screenshots/` (full page at 1440, 1024, 768 and 390 px).
- Lighthouse mobile (Chrome 156, simulated slow 4G): Performance 99-100 · Accessibility 100 · Best Practices 100 · SEO 100. LCP 1.7 s, CLS 0.02, TBT 0 ms.

## Run

```bash
npm install
npm run build      # regenerates index.html, checkout/index.html, robots.txt, sitemap.xml, llms.txt
npm run serve      # http://localhost:4173
SITE_URL=https://your-domain GTM_ID=GTM-XXXX npm run build   # canonical, og:url, JSON-LD URLs; GTM_ID optional
CHROME_PATH=/path/to/chrome npm test
npm run images     # re-exports AVIF/WebP from the client zips (TF_ASSETS=<folder with both zips>)
```

Deploy the repo root as a static site (Vercel or Netlify, no build command needed; `vercel.json` and `netlify.toml` set cache headers). Run `npm run build` with the real `SITE_URL` before deploying.

## Deploy to the VPS (GitHub Actions)

`.github/workflows/deploy.yml` runs on push to `main` (or manually). Same pattern as the other VPS projects: a Docker Compose project in `/opt/frosted-cranberry` behind the Easypanel Traefik (network `easypanel`, entrypoint `https`, resolver `letsencrypt`, via labels).

1. `npm run build` with `SITE_URL`.
2. rsync of the static site, `Dockerfile` (nginx), `deploy/nginx.conf` and `docker-compose.prod.yml` to the VPS.
3. `docker compose up -d --build` with `SITE_HOST` taken from `SITE_URL`.
4. Smoke test on `/` and `/checkout`.

Repository secrets: `VPS_SSH_KEY` (dedicated key for this repo), `VPS_KNOWN_HOSTS`, `VPS_HOST`, `VPS_USER`. Variables: `SITE_URL` (currently `https://frosted-cranberry.72-60-247-32.sslip.io`, no DNS needed; change it when a real domain points to the VPS) and `VPS_DEPLOY_PATH` (`/opt/frosted-cranberry`).

## Structure

| Path | What |
|---|---|
| `scripts/build.mjs` | Generates `index.html` (markup, JSON-LD built from the same FAQ data as the visible FAQ) |
| `scripts/images.mjs` | `sharp` pipeline: AVIF + WebP at 640/960/1280/1600 (capped to the source width, small slots stop at 960), descriptive `frosted-cranberry-*` names |
| `assets/css/tokens.css` | Every custom property, generated from `tokens.json` |
| `assets/css/components.css` | `bundle.css` ported 1:1 (only the extra button shadow removed: the DS allows two shadows) |
| `assets/css/landing.css` | Page layout only, built from tokens |
| `assets/js/main.js` | Offer selector, sticky bar, announcement rotation, before/after, analytics, reveal, optional GTM loader |
| `assets/js/checkout.js` | Shows the bundle chosen via `?bundle=` on the demo checkout |
| `assets/css/fonts.css`, `assets/fonts/` | Self-hosted fonts |
| `deploy/`, `Dockerfile`, `docker-compose.prod.yml` | nginx container + Traefik labels for the VPS |
| `tests/landing.test.mjs` | Behavior, schema and accessibility tests |

## Design, UX and CRO decisions

- **Offer early.** Traffic to an offer page is warm (email, ads), so the selector sits right after the hero and trust row, and "Shop the bundle" in the header plus the mobile sticky bar keep it one tap away. Everything below exists for the visitor who still doubts.
- **Best preselected.** Best is the highest-value option for the customer, not a trick: 10 products for $39. It is ribboned and taller, but Good and Better keep equal clarity (same type, same radios), no dark patterns. Preselection also means a visitor who only taps the CTA gets the best deal.
- **Price per product** ($7.00 · $6.00 · $3.90, "You save 44% per product" vs Good). It is plain arithmetic, makes the tiers comparable at a glance, and turns "buy 4, get 6" into the more honest "10 products for $39". The CTA names the total: "Get my 10 products — $39".
- **Order flips on mobile.** Desktop reads Good, Better, Best left to right. Below 768 px the stack is Best, Better, Good so the high anchor comes first. `main.js` also reorders the DOM at that breakpoint so arrow-key and tab order match what is on screen.
- **Mobile hero.** Photo cropped 4:3 (keeps the full width of the product line), copy and CTA below. The CTA ends at y=739 on a 390x844 viewport, so it is visible without scrolling. Bullets come after the CTA on mobile.
- **Color discipline.** Light grounds dominate, navy for ink and small marks, cranberry only for the CTA, prices and the final band. The footer is navy so the final cranberry band is never stacked against another cranberry block.
- **No invented proof.** No stars, review text, names, family count, certifications or struck-through prices. Reviews show real customer photos with explicit placeholders for the text.
- **Motion.** One fade + 12 px rise (200 ms, once) on sections below the hero, none under `prefers-reduced-motion`. No parallax, snow, confetti, countdowns or gradients.
- **Accessibility.** Native radios in a `fieldset`, `input type=range` for the sliders, `details/summary` FAQ, 2 px focus ring (white on dark), `inert` on the sticky bar while hidden, skip link, descriptive `alt`.

## Analytics

`dataLayer` events: `view_offer`, `select_tier {tier, price}`, `begin_checkout {tier, price, cta_location}`, `ba_interact {pair}`, `faq_open {question}`.
`begin_checkout` fires on the three links that go to checkout (`cta_location`: `offer`, `sticky`, `final`). The hero and header buttons only scroll to `#offer`, so they do not fire it.

Purchase CTAs point to `/checkout?bundle=good|better|best`. `checkout/index.html` is a documented placeholder (`noindex`) so the demo link does not 404; replace it with the real checkout and variant IDs.

## Pending data (`[VERIFICAR]`) and deviations

Facts taken from the live offer page `my4.trulyfreehome.com/offers/fc-feg-b4g6-v1`. That page is the sibling Fresh Evergreen offer, so confirm each one for Frosted Cranberry before launch:

- Support phone 231-944-1716, hours Mon–Fri 9AM–9PM EST, address 6261 US Highway 31 N, Williamsburg, MI 49690, Privacy/Terms links.
- "Orders before 3 PM EST ship the same business day" (announcement bar, FAQ, schema handling time 0–1 days).
- 30-day money-back guarantee wording and "no subscription required" (guarantee, FAQ, tier footnote).
- FAQ line that the non-toxic formula is safe around pets.

Still open, shown as visible placeholders or left out:

- **Official logo SVG.** Wordmark "Truly Free Home" in Merriweather 700 with a `TODO` comment in the header. No Organization `logo` in the schema.
- **Shipping per tier.** Cards and table say "Shipping calculated at checkout". The sibling page shows $4.95 on lower tiers and free on the top tier, unconfirmed here. No `shippingRate` in the schema.
- **Reviews.** Review text, names, ratings and the rating summary are dashed `[VERIFICAR]` boxes. `AggregateRating` is omitted until real reviews exist.
- **Families count.** Omitted: the sources disagree (598,000 vs 648,000).
- **"Limited" scent claim.** The blueprint's "Limited holiday scent" / "limited batch" is replaced by "Holiday 2026", since limited stock is unconfirmed.
- **Bundle contents.** Whether units are refill pouches or bottles, and whether Best includes reusable bottles. The FAQ only states that both products are refillable.
- **Checkout URL and variant IDs**, canonical domain (`SITE_URL`), Organization `sameAs` profiles.
- **Copy from the design system not verified against the offer:** "Refill pouches: less plastic, less money", "Plant-powered chemistry".
- Blueprint deviations: "Refill in 30 seconds" became "Refill in three steps" (time unverified); two review cards instead of three (only two real UGC photos); Leaping Bunny is not mentioned (not in the allowed claims list); section backgrounds alternate frost/cream strictly.

## Not yet verified

- Structured data: validated on the live URL with validator.schema.org (0 errors, 0 warnings: Organization, WebPage, Product, FAQPage). Google's Rich Results Test was not run. No tier sells a single product, so the Everyday Cleaner and Aloe Hand Soap `Product` nodes carry no `offers` (a tier price would be wrong for them); only the bundle `Product` has the `AggregateOffer`. Google may warn that those two nodes lack `offers`.
- Screen readers (VoiceOver/NVDA) were not run. Covered instead: full keyboard flow, Lighthouse accessibility 100, and axe-core (WCAG 2.2 AA + best practices) in `npm test` on landing 390/1440 and checkout.

## Hardening and measurement

- **Fonts are self-hosted** (Latin subset woff2, preloaded, `font-display: swap`): no third-party request, no render-blocking stylesheet. Merriweather 700 / 400 italic and Figtree 400-800 (one variable file).
- **CSP** via `<meta>` (script hash computed at build for the single inline init script; JSON-LD is a data block and unaffected) plus `frame-ancestors`, `Permissions-Policy`, `nosniff` and `Referrer-Policy` headers in `deploy/nginx.conf`.
- **GTM hook.** `GTM_ID=GTM-XXXX npm run build` adds the container loader and the matching CSP hosts; without it, nothing third-party loads and events stay in `window.dataLayer`. No ID is invented.
- **`llms.txt`** summarizes the offer and the allowed facts for AI crawlers (Lighthouse agentic audit passes). `/checkout` is `Disallow`ed in `robots.txt`.
- **Tests** (`npm test`, needs `CHROME_PATH`): Best preselected and CTA, tier order per breakpoint, `select_tier` event, per-product prices, FAQ vs JSON-LD parity, no `AggregateRating`, checkout bundle param, no horizontal overflow at 390/768/1024/1440, axe. CI runs them on every PR and checks generated files are committed.
