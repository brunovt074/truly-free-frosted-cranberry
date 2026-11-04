# Changelog

## [Unreleased]

### Added
- Frosted Cranberry offer landing: 15 blueprint sections plus the mobile sticky buy bar, built on the Frosted Cranberry design system tokens and `fc-*` components.
- Good / Better / Best offer selector with native radios, Best preselected, per-product prices ($7.00 / $6.00 / $3.90) and a CTA that follows the selection.
- Before/after sliders, FAQ, "Bundle at a glance" table, JSON-LD (Organization, WebPage, Product x3 with AggregateOffer, FAQPage).
- `dataLayer` events: `view_offer`, `select_tier`, `begin_checkout`, `ba_interact`, `faq_open`.
- AVIF + WebP image pipeline (`npm run images`) and static HTML generator (`npm run build`).
- Checkout demo page that shows the bundle chosen via `?bundle=` (payment disabled, noindex).
- Google Tag Manager, GA4 and Microsoft Clarity hooks (`GTM_ID`, `GA4_ID`, `CLARITY_ID`), loaded only after consent, with a consent bar and Consent Mode v2.
- A/B variants `/v1/` (hero photo) and `/v2/` (H1), canonical to `/`.
- Events `experiment_view`, `scroll_depth`, `click_phone`; `variant` on every event; `value` and `currency` on `begin_checkout`.
- `docs/measurement-and-experiments.md`.
- `llms.txt`, Content-Security-Policy and extra security headers.
- Test suite (`npm test`) with axe-core accessibility checks, and a CI workflow.
- Deploy to the VPS as an nginx container behind Easypanel Traefik, via GitHub Actions.

### Changed
- Clarity consent signal is sent after the tag stub exists, so it is no longer dropped; the sticky buy bar hides while the consent bar is open.
- With `GTM_ID`, the CSP also allows Clarity hosts so a Clarity tag inside the container is not blocked.
- Fonts are self-hosted (woff2) instead of loaded from Google Fonts.
- Carousels that scroll horizontally on mobile are keyboard-focusable.
