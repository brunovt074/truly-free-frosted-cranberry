# Measurement and experiments

No tracking IDs were provided, so the page ships with the hooks and loads nothing third-party until IDs are set at build time and the visitor accepts analytics.

## Turning tools on

| Build variable | Effect |
|---|---|
| `GTM_ID=GTM-XXXX` | Loads Google Tag Manager after consent. Put GA4 and Clarity inside the container (Clarity has an official GTM template). `GA4_ID` and `CLARITY_ID` are ignored so nothing is counted twice. |
| `GA4_ID=G-XXXX` | No GTM: loads `gtag.js` after consent and forwards every event with `gtag("event", ...)`. |
| `CLARITY_ID=xxxxxxxxxx` | No GTM: loads Microsoft Clarity after consent, tags sessions with `variant` and `tier`, and mirrors every event as a Clarity custom event. |

```bash
SITE_URL=https://example.com GA4_ID=G-XXXX CLARITY_ID=xxxxxxxxxx npm run build
```

- The CSP is built from the same variables, so only the hosts of the tools in use are allowed.
- Consent: a bar with equal-weight Decline / Accept buttons appears only when a tool is configured. Choice is stored in `localStorage` (`fc_consent`), and "Analytics preferences" in the footer reopens it. Google Consent Mode v2 defaults are sent as `denied` and updated on accept; Clarity receives `consentv2`.
- Trade-off: because nothing loads before consent, reported traffic is lower than real traffic. That is the price of not setting cookies without permission.
- Not verified with real IDs. The test suite proves the right scripts are requested, only after Accept, and that the CSP does not block them. It does not prove that GA4 or Clarity accept the data.

## Event taxonomy

All events go to `window.dataLayer` and carry `variant` (`control`, `v1`, `v2`).

| Event | When | Parameters | Use |
|---|---|---|---|
| `experiment_view` | page load | `variant` | Denominator per variant |
| `view_offer` | `#offer` crosses the viewport middle | | Funnel step 1 |
| `select_tier` | tier radio changes | `tier`, `price` | Mix of Good/Better/Best |
| `begin_checkout` | any buy CTA | `tier`, `price`, `value`, `currency`, `cta_location` | **Primary conversion** (mark as GA4 key event) |
| `scroll_depth` | 25, 50, 75, 100 % | `percent` | Where visitors stop |
| `ba_interact` | first drag of a before/after slider | `pair` | Proof engagement |
| `faq_open` | FAQ item opened | `question` | Unanswered objections |
| `click_phone` | tap on a phone number | `location` | Support intent |

GA4 setup: register `variant`, `tier` and `cta_location` as event-scoped custom dimensions; mark `begin_checkout` as a key event; build the funnel `experiment_view` → `view_offer` → `select_tier` → `begin_checkout`.

## What Clarity would answer

- Heatmaps and scroll maps: does the sticky bar get the taps on mobile, or the in-page CTA? Do visitors reach the before/after proof?
- Rage and dead clicks: placeholder links and the demo checkout will show up here; fix before launch.
- Recordings filtered by `tier`: do people who choose Good hesitate at the price per product?
- Filter by `variant` to see why a variant wins, not just that it does.

A heatmap needs hundreds of sessions per device type to mean anything. Until there is real traffic, none is shown or simulated here.

## Experiments

The design handoff names three testable levers: card order, H1, hero photo. Two are built as separate static pages (all canonical to `/`, not in the sitemap, so no duplicate-content risk):

| Page | Change vs control | Hypothesis |
|---|---|---|
| `/` | Control | |
| `/v1/` | Hero photo: the design-system alternative with a parent and child in the kitchen | A human moment lifts click-through to the offer for the "homes with little helpers" audience |
| `/v2/` | H1: "Buy 4, get 6 free: 10 plant-powered products for $39." | Leading with the offer beats leading with the scent for traffic that already knows the product |

Card order (Good-first vs Best-first on mobile) is the third lever and is not built yet.

Rules:

1. One test at a time: v1 vs control, then v2 vs control. They are not combined.
2. Primary metric: `begin_checkout` / `experiment_view`. Guardrails: revenue per visitor (tier mix shifts) and `scroll_depth` 100.
3. Split by link, not by script: the ad or email for each arm points to its own URL (UTM `utm_content` = variant). No client-side swap, so no flicker and no layout shift. When traffic is organic, the same pages can sit behind an edge split (nginx `split_clients` with a cookie).
4. Run whole weeks, fix the sample size beforehand, do not stop at the first significant reading.

Sample size per arm (two-sided α = 0.05, power 80 %, two-proportion test). The baseline conversion rate is an assumption, not data:

| Baseline | Detect +10 % relative | Detect +20 % relative |
|---|---|---|
| 2 % | 76,920 | 19,230 |
| 3 % | 50,757 | 12,690 |
| 4 % | 37,675 | 9,419 |

Honest reading: a single landing page needs thousands of visitors per arm to detect a 20 % lift. Below that, use Clarity recordings and the funnel to find problems and ship fixes; reserve A/B for when traffic supports it.
