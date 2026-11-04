# Changelog

## [Unreleased]

### Added
- Frosted Cranberry offer landing: 15 blueprint sections plus the mobile sticky buy bar, built on the Frosted Cranberry design system tokens and `fc-*` components.
- Good / Better / Best offer selector with native radios, Best preselected, per-product prices ($7.00 / $6.00 / $3.90) and a CTA that follows the selection.
- Before/after sliders, FAQ, "Bundle at a glance" table, JSON-LD (Organization, WebPage, Product x3 with AggregateOffer, FAQPage).
- `dataLayer` events: `view_offer`, `select_tier`, `begin_checkout`, `ba_interact`, `faq_open`.
- AVIF + WebP image pipeline (`npm run images`) and static HTML generator (`npm run build`).
- Checkout demo page that shows the bundle chosen via `?bundle=` (payment disabled, noindex).
- A/B variants `/v1/` (hero photo) and `/v2/` (H1), canonical to `/`.
- Events `experiment_view`, `scroll_depth`, `click_phone`; `variant` on every event; `value` and `currency` on `begin_checkout`.
- `docs/measurement-and-experiments.md`.
- `llms.txt`, Content-Security-Policy and extra security headers.
- Test suite (`npm test`) with axe-core accessibility checks, and a CI workflow.
- Deploy to the VPS as an nginx container behind Easypanel Traefik, via GitHub Actions.

### Changed
- Refresh the before-and-after captions and FAQ wording without adding product claims.
- Reformat bundle comparisons for narrow screens and compact the mobile demo checkout so its actions are visible sooner.
- Serve the site at `frosted-cranberry.brunodev.store` and redirect the legacy hostname while preserving paths and query strings.
- Keep the header's shop button on one line on narrow mobile screens.
- Compact the desktop offer to keep product images, prices and the purchase button visible together at laptop heights.
- Removed the cookie banner and external analytics loaders; events remain in memory without cookies.
- Aligned bundle cards, replaced the comparison highlight with a neutral navy accent, and replaced unverified review placeholders with a photo gallery.
- The header phone link leads to support details; the demo checkout explains that no payment or order is made.
- Fonts are self-hosted (woff2) instead of loaded from Google Fonts.
- Carousels that scroll horizontally on mobile are keyboard-focusable.
