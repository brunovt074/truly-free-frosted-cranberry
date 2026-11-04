# Changelog

## [Unreleased]

### Added
- Demo checkout payment button: shows a spinner and a progress label, then explains that no payment is taken.
- The header phone number copies to the clipboard on a pointer device and confirms it with a chip.
- Frosted Cranberry offer landing: 15 blueprint sections plus the mobile sticky buy bar, built on the Frosted Cranberry design system tokens and `fc-*` components.
- Good / Better / Best offer selector with native radios, Best preselected, per-product prices ($7.00 / $6.00 / $3.90) and a CTA that follows the selection.
- Before/after sliders, FAQ, "Bundle at a glance" table, JSON-LD (Organization, WebPage, Product x3 with AggregateOffer, FAQPage).
- `dataLayer` events: `view_offer`, `select_tier`, `begin_checkout`, `ba_interact`, `faq_open`.
- AVIF + WebP image pipeline (`npm run images`) and static HTML generator (`npm run build`).
- Checkout demo page that shows the bundle chosen via `?bundle=` (payment disabled, noindex).
- Google Tag Manager, GA4 and Microsoft Clarity hooks (`GTM_ID`, `GA4_ID`, `CLARITY_ID`) that load on arrival, with Consent Mode v2 set to analytics granted and ads denied.
- A/B variants `/v1/` (hero photo) and `/v2/` (H1), canonical to `/`.
- Events `experiment_view`, `scroll_depth`, `click_phone`; `variant` on every event; `value` and `currency` on `begin_checkout`.
- `docs/measurement-and-experiments.md`.
- `llms.txt`, Content-Security-Policy and extra security headers.
- Test suite (`npm test`) with axe-core accessibility checks, and a CI workflow.
- Deploy to the VPS as an nginx container behind Easypanel Traefik, via GitHub Actions.

### Changed
- The cookie bar is gone: the page now measures on arrival like the brand's own site, with ads denied, and the EU/UK opt-in is documented as the production refinement.
- "Shop the bundle" and "Choose my bundle" scroll to the bundle cards instead of the section top, so the three prices land inside the viewport, and the product shots no longer overflow onto the price rows.
- The Best row of the "Bundle at a glance" table reads "2 Everyday Cleaner + 2 Aloe Hand Soap + 3 of each free".
- Review cards show only the real customer photos and the product name; the review text, names and rating summary are no longer placeholders on the page.
- The deploy workflow passes `GTM_ID`, `GA4_ID` and `CLARITY_ID` repository variables to the build, so tracking can be switched on without a code change.
- A malformed `GTM_ID`, `GA4_ID` or `CLARITY_ID` now fails the build instead of silently disabling tracking.
- Clarity's `consentv2` signal is sent after the tag stub exists, so it is no longer dropped.
- With `GTM_ID`, the CSP also allows Clarity hosts so a Clarity tag inside the container is not blocked.
- Fonts are self-hosted (woff2) instead of loaded from Google Fonts.
- Carousels that scroll horizontally on mobile are keyboard-focusable.
