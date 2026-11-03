import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SITE = (process.env.SITE_URL ?? "https://frosted-cranberry.example.com").replace(/\/$/, "");
const MODIFIED = "2026-11-03";
const manifest = JSON.parse(readFileSync("scripts/images.manifest.json", "utf8"));
const IMG = "/assets/img/";
const OG_IMAGE = "frosted-cranberry-og-image-1200x630.jpg";

const TITLE = "Frosted Cranberry Cleaner & Soap Bundle | Truly Free Home";
const DESCRIPTION =
  "Non-toxic, refillable Frosted Cranberry Everyday Cleaner and Aloe Hand Soap. Buy 4, get 6 free — 10 products for $39. 30-day money-back guarantee.";
if (TITLE.length > 60) throw new Error(`title ${TITLE.length} > 60`);
if (DESCRIPTION.length > 155) throw new Error(`description ${DESCRIPTION.length} > 155`);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pic = (key, { sizes, alt, cls = "", eager = false, fallbackWidth }) => {
  const full = `frosted-cranberry-${key}`;
  const m = manifest[full];
  if (!m) throw new Error(`missing image ${full}`);
  const top = m.widths[m.widths.length - 1];
  const h = Math.round(top * m.ratio);
  const set = (ext) => m.widths.map((w) => `${IMG}${full}-${w}.${ext} ${w}w`).join(", ");
  const fb = fallbackWidth ?? m.widths[Math.min(1, m.widths.length - 1)];
  const load = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img${cls ? ` class="${cls}"` : ""} src="${IMG}${full}-${fb}.webp" width="${top}" height="${h}" alt="${esc(alt)}" ${load}></picture>`;
};

const svg = (inner, extra = "") => `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${inner}</svg>`;
const ICON = {
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  leaf: svg('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  heart: svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  dye: svg('<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>'),
  recycle: svg('<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.4"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1"/><path d="m14 16-3 3 3 3"/><path d="M8.3 13.6 7.2 9.4 3 10.5"/><path d="m9.3 5.5 1.1-1.8a1.8 1.8 0 0 1 3.1 0l3.9 6.8"/><path d="m13.4 10.6 4-1.1 1.1 4.2"/>'),
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  arrows: svg('<path d="m9 18-6-6 6-6M15 6l6 6-6 6"/>'),
};

const BUNDLES = {
  good: { name: "Good", price: 14, products: 2, unit: "7.00", contents: "2 Everyday Cleaner" },
  better: { name: "Better", price: 24, products: 4, unit: "6.00", contents: "2 Everyday Cleaner + 2 Aloe Hand Soap" },
  best: { name: "Best", price: 39, products: 10, unit: "3.90", contents: "2 Everyday Cleaner + 2 Aloe Hand Soap, plus 3 + 3 free" },
};
const ctaLabel = (k) => `Get my ${BUNDLES[k].products} products — $${BUNDLES[k].price}`;

const TRUST = [
  ["Plant-based", ICON.leaf],
  ["Cruelty-free", ICON.heart],
  ["Dye-free", ICON.dye],
  ["Refillable", ICON.recycle],
  ["Made in Michigan", ICON.pin],
];

const WITHOUT = ["Dyes", "Glycol ethers", "Thickeners", "Formaldehyde", "Fillers", "Parabens", "Monoethanolamine", "Isopropanol", "Phthalates", "Perchloroethylene", "Triclosan", "Quats"];
const SURFACES = ["Stainless steel", "Appliances", "Toys", "Tables & chairs", "Kitchen", "Countertops", "Sinks & basins", "Porcelain", "Cabinets"];

const FAQ = [
  {
    q: "What does Frosted Cranberry smell like?",
    lead: "Like a cozy holiday cranberry.",
    rest: "Frosted Cranberry is our holiday scent, and it is the same in the Everyday Cleaner and the Aloe Hand Soap, so the counter and the sink smell alike.",
  },
  {
    q: "What's in the Best bundle exactly?",
    lead: "Ten products for $39.",
    rest: "You buy 2 Everyday Cleaner and 2 Aloe Hand Soap, and we add 3 Everyday Cleaner and 3 Aloe Hand Soap free. That's $3.90 per product, 44% less per product than the Good bundle.",
  },
  {
    q: "Are these refills or bottles?",
    lead: "Both products are refillable.",
    rest: "You fill a bottle with warm water to the fill line, add one refill pouch, cap it and shake gently. The steps are above.",
  },
  {
    q: "Is it safe around kids and pets?",
    lead: "Yes.",
    rest: "Both products are made without dyes, phthalates, parabens, triclosan or quats, and the non-toxic formula is safe to use around pets. Read the label for directions.",
  },
  {
    q: "Which surfaces can I clean?",
    lead: "100s of household surfaces.",
    rest: "That includes stainless steel, appliances, toys, tables and chairs, kitchen surfaces, countertops, sinks and basins, porcelain and cabinets. The Everyday Cleaner is ammonia-free and chlorine-free.",
  },
  {
    q: "Is this a subscription?",
    lead: "No.",
    rest: "This is a one-time purchase and no subscription is required.",
  },
  {
    q: "When will my order ship?",
    lead: "Orders placed before 3 PM EST ship the same business day.",
    rest: "Orders placed after 3 PM EST ship the next business day.",
  },
  {
    q: "What if I don't love it?",
    lead: "We'll refund you in full.",
    rest: "Try your bundle for 30 days. If you're not happy for any reason, call us at 231-944-1716 and we'll make it right with a full refund.",
  },
];

const faqHtml = FAQ.map(
  (f) => `<details><summary>${esc(f.q)}</summary><div class="fc-faq__a"><p><strong>${esc(f.lead)}</strong> ${esc(f.rest)}</p></div></details>`,
).join("\n      ");

const tier = (key, { ribbon = false, checked = false, imgKey, imgAlt, free = false, listHtml, saveHtml = "" }) => {
  const b = BUNDLES[key];
  return `<label class="fc-tier fc-tier--${key}">
        ${ribbon ? '<div class="fc-tier__ribbon">Best value · 10 products</div>' : ""}
        <input type="radio" name="bundle" value="${key}" data-name="${b.name}" data-price="${b.price}" data-products="${b.products}" data-unit="${b.unit}"${checked ? " checked" : ""}>
        <div class="fc-tier__media">${pic(imgKey, { sizes: "(min-width:1200px) 380px, 33vw", alt: imgAlt })}${free ? '<span class="fc-tier__free">+6 FREE</span>' : ""}</div>
        <div class="fc-tier__body">
          <div class="fc-tier__head"><span class="fc-tier__name">${b.name}</span><span class="fc-tier__radio" aria-hidden="true"></span></div>
          <div class="fc-tier__price">$${b.price} <span class="fc-tier__unit">$${b.unit} per product</span></div>
          ${saveHtml}
          <ul class="fc-tier__list">${listHtml}</ul>
          <div class="fc-tier__ship">Shipping calculated at checkout</div>
        </div>
      </label>`;
};
const li = (text, free = false) => `<li${free ? ' class="is-free"' : ""}>${ICON.check}${text}</li>`;

const baItem = (id, pair, beforeKey, afterKey, beforeAlt, afterAlt, label, product) => `<li class="ba-item">
        <div class="fc-ba" data-pair="${pair}">
          ${pic(beforeKey, { sizes: "(min-width:1024px) 380px, 85vw", alt: beforeAlt })}
          ${pic(afterKey, { sizes: "(min-width:1024px) 380px, 85vw", alt: afterAlt, cls: "fc-ba__after" })}
          <span class="fc-ba__line"></span><span class="fc-ba__knob">${ICON.arrows}</span>
          <span class="fc-ba__tag fc-ba__tag--before">Before</span><span class="fc-ba__tag fc-ba__tag--after">After</span>
          <input type="range" min="0" max="100" value="50" aria-label="Before and after comparison: ${esc(label)}">
        </div>
        <p class="fc-ba-caption">${esc(label)} <span>· ${esc(product)}</span></p>
      </li>`;

const step = (key, alt, text) => `<li>${pic(key, { sizes: "(min-width:1024px) 380px, 112px", alt })}<div class="fc-steps__text"><p>${text}</p></div></li>`;

const review = (key, alt, who) => `<article class="fc-review">
          ${pic(key, { sizes: "(min-width:1024px) 420px, 85vw", alt, cls: "fc-review__photo" })}
          <div class="fc-review__body">
            <p class="fc-review__text fc-todo">[VERIFICAR: real customer review text, copied from the live offer or review system]</p>
            <div class="fc-review__who fc-todo">[VERIFICAR: reviewer name and rating]<span>${esc(who)}</span></div>
          </div>
        </article>`;

const PRODUCT_ALT = "Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap with refill pouches on a kitchen counter";

const body = `
<a class="skip" href="#main">Skip to main content</a>

<div class="fc-announce" role="region" aria-label="Offer" id="announce">
  <span class="fc-announce__msg is-active"><strong>Holiday bundle: buy 4, get 6 free</strong></span><span class="fc-announce__sep"></span><span class="fc-announce__msg">Orders before 3 PM EST ship the same day</span>
</div>

<header class="site-header">
  <div class="container site-header__row">
    <!-- TODO: replace this wordmark with the official Truly Free Home SVG logo (not provided). -->
    <a class="wordmark" href="/" aria-label="Truly Free Home">Truly Free Home</a>
    <div class="site-header__side">
      <span class="fc-muted t-small site-header__phone">Questions? <a href="tel:+12319441716">231-944-1716</a></span>
      <a class="fc-btn fc-btn--secondary fc-btn--sm" href="#offer">Shop the bundle</a>
    </div>
  </div>
</header>

<main id="main">

<section class="hero" aria-labelledby="hero-title">
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="t-eyebrow">Frosted Cranberry · Holiday 2026</p>
      <h1 class="t-display" id="hero-title">The coziest scent of the season. Zero toxic chemicals.</h1>
      <p class="t-lead hero__lead">Frosted Cranberry Everyday Cleaner and Aloe Hand Soap — plant-powered, refillable and made in Michigan for homes with little helpers.</p>
      <div class="hero__cta">
        <a class="fc-btn fc-btn--primary" id="hero-cta" href="#offer">Choose my bundle</a>
        <span class="fc-btn__note">From $3.90 per product · 30-day money-back guarantee</span>
      </div>
      <ul class="fc-trust fc-trust--compact hero__bullets">
        ${li("Cleans 100s of surfaces")}${li("10x concentrated aloe for softer hands")}${li("Refill pouches: less plastic, less money")}
      </ul>
    </div>
    <div class="hero__media">
      ${pic("hero-bundle-kitchen", { sizes: "(min-width:1024px) 560px, calc(100vw - 32px)", alt: "Truly Free Home Frosted Cranberry Aloe Hand Soap and Everyday Cleaner bottles with their refill pouches on a kitchen counter, with frosted cranberries", eager: true, fallbackWidth: 960 })}
      <span class="hero__chip">Holiday 2026 scent</span>
    </div>
  </div>
</section>

<section class="trust-band" aria-label="Product facts">
  <ul class="fc-trust">
    ${TRUST.map(([t, i]) => `<li>${i}${t}</li>`).join("")}
  </ul>
</section>

<section class="section reveal" id="offer" aria-labelledby="offer-title" data-hide-sticky>
  <div class="container">
    <div class="section__head">
      <p class="t-eyebrow">Holiday bundles</p>
      <h2 class="t-h2" id="offer-title">Pick your Frosted Cranberry bundle</h2>
    </div>
    <fieldset class="offer-fieldset">
      <legend class="sr-only">Choose your bundle</legend>
      <div class="fc-offer">
      ${tier("good", {
        imgKey: "everyday-cleaner-refill-white",
        imgAlt: "Truly Free Home Frosted Cranberry Everyday Cleaner bottle next to its refill pouch on a white background",
        listHtml: li("2 Everyday Cleaner"),
      })}
      ${tier("better", {
        imgKey: "bundle-white",
        imgAlt: "Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap bottles with refill pouches on a white background",
        listHtml: li("2 Everyday Cleaner") + li("2 Aloe Hand Soap"),
      })}
      ${tier("best", {
        ribbon: true,
        checked: true,
        free: true,
        imgKey: "bundle-white",
        imgAlt: "Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap bottles with refill pouches on a white background",
        saveHtml: '<div class="fc-tier__save">You save 44% per product</div>',
        listHtml: li("Buy 2 Everyday Cleaner + 2 Aloe Hand Soap") + li("+3 Everyday Cleaner FREE", true) + li("+3 Aloe Hand Soap FREE", true),
      })}
      </div>
    </fieldset>
    <div class="fc-offer__cta">
      <a class="fc-btn fc-btn--primary offer__buy" id="buy" href="/checkout?bundle=best" data-cta="offer" data-tier="best">${ctaLabel("best")}</a>
    </div>
    <div class="fc-offer__foot">
      <div class="fc-guarantee fc-guarantee--inline"><div class="fc-guarantee__seal" aria-hidden="true"><b>30</b><small>Day</small></div><p>30-day money-back guarantee</p></div>
      <span>One-time purchase · no subscription</span>
    </div>

    <div class="glance">
      <h3 class="t-h3" id="glance-title">Bundle at a glance</h3>
      <div class="table-wrap" role="region" aria-labelledby="glance-title" tabindex="0">
        <table>
          <thead><tr><th scope="col">Bundle</th><th scope="col">What you get</th><th scope="col">Price</th><th scope="col">Per product</th><th scope="col">Shipping</th><th scope="col">Guarantee</th></tr></thead>
          <tbody>
            ${Object.values(BUNDLES)
              .map(
                (b) =>
                  `<tr><th scope="row">${b.name}</th><td>${b.products} products: ${b.contents}</td><td>$${b.price}</td><td>$${b.unit}</td><td>Calculated at checkout</td><td>30-day money-back</td></tr>`,
              )
              .join("\n            ")}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section class="section section--cream reveal" aria-labelledby="duo-title">
  <div class="container duo">
    <div class="duo__media">${pic("duo-water-flatlay", { sizes: "(min-width:1024px) 560px, calc(100vw - 32px)", alt: "Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap bottles with refill pouches floating on pink water with cranberries" })}</div>
    <div class="duo__copy">
      <p class="t-eyebrow">Two everyday essentials</p>
      <h2 class="t-h2" id="duo-title">One festive scent, from the counter to the sink</h2>
      <div class="duo__items">
        <div class="duo__item">
          <h3 class="t-h3">Everyday Cleaner</h3>
          <ul class="fc-tier__list">${li("Formulated for 100s of household surfaces")}${li("Ammonia-free &amp; chlorine-free")}${li("Plant-powered chemistry")}</ul>
        </div>
        <div class="duo__item">
          <h3 class="t-h3">Aloe Hand Soap</h3>
          <ul class="fc-tier__list">${li("10x concentrated aloe vera")}${li("Softer, cleaner hands with every wash")}${li("Gentle foam kids actually like using")}</ul>
        </div>
      </div>
      <a class="fc-btn fc-btn--link" href="#offer">See bundles →</a>
    </div>
  </div>
</section>

<section class="section reveal" aria-labelledby="ba-title">
  <div class="container">
    <div class="section__head">
      <p class="t-eyebrow">Real messes</p>
      <h2 class="t-h2" id="ba-title">Pizza night. Finger paint. Handled.</h2>
    </div>
    <ul class="ba-grid">
      ${baItem("ba1", "table", "table-paint-before", "table-paint-after", "Wood table covered in dried finger paint before cleaning", "The same wood table wiped clean with Truly Free Home Frosted Cranberry Everyday Cleaner", "Wood table", "Everyday Cleaner")}
      ${baItem("ba2", "counter", "counter-pizza-before", "counter-pizza-after", "Kitchen counter with pizza sauce spills before cleaning", "The same counter wiped clean with Truly Free Home Frosted Cranberry Everyday Cleaner", "Quartz counter", "Everyday Cleaner")}
      ${baItem("ba3", "hands", "hands-paint-before", "hands-paint-after", "Child's hands covered in paint before washing", "The same hands clean after washing with Truly Free Home Frosted Cranberry Aloe Hand Soap", "Little hands", "Aloe Hand Soap")}
    </ul>
  </div>
</section>

<section class="section section--cream reveal" aria-labelledby="without-title">
  <div class="container without-grid">
    <div class="without-grid__media">${pic("made-without-little-hands", { sizes: "(min-width:1024px) 560px, calc(100vw - 32px)", alt: "Toddler looking at her soapy hands at a kitchen counter, with a Truly Free Home Frosted Cranberry Aloe Hand Soap bottle beside her" })}</div>
    <div class="fc-without">
      <p class="t-eyebrow">Nothing to hide</p>
      <h2 class="t-h2" id="without-title">Made without the stuff you can't pronounce</h2>
      <ul class="fc-without__list">${WITHOUT.map((w) => `<li>${ICON.x}${w}</li>`).join("")}</ul>
      <div class="fc-without__seals"><span>${ICON.heart}Cruelty-free</span><span>${ICON.leaf}Plant-based</span><span>${ICON.dye}Dye-free</span></div>
    </div>
  </div>
</section>

<section class="section reveal" aria-labelledby="refill-title">
  <div class="container">
    <div class="section__head">
      <p class="t-eyebrow">Refillable</p>
      <h2 class="t-h2" id="refill-title">Refill in three steps</h2>
    </div>
    <ol class="fc-steps">
      ${step("refill-step-1-fill", "Filling a Truly Free Home Frosted Cranberry Everyday Cleaner bottle with warm water at the sink", "Fill with warm water to the fill line")}
      ${step("refill-step-2-pouch", "Pouring a Frosted Cranberry Everyday Cleaner refill pouch into the bottle", "Add one refill pouch")}
      ${step("refill-step-3-cap", "Capping the refilled Frosted Cranberry Everyday Cleaner spray bottle", "Cap, shake gently, clean")}
    </ol>
  </div>
</section>

<section class="section section--cream reveal" aria-labelledby="surfaces-title">
  <div class="container">
    <div class="section__head">
      <h2 class="t-h2" id="surfaces-title">One cleaner for messes all over your home</h2>
    </div>
    <ul class="chips">${SURFACES.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
  </div>
</section>

<section class="section reveal" aria-labelledby="reviews-title">
  <div class="container">
    <div class="section__head">
      <p class="t-eyebrow">Reviews</p>
      <h2 class="t-h2" id="reviews-title">Families are making the switch</h2>
      <p class="fc-todo review-summary">[VERIFICAR: average rating and review count from the real review system. Nothing is shown until it exists.]</p>
    </div>
    <div class="review-grid">
        ${review("ugc-pizza-night", "Customer photo: a mom and two kids making pizza at a kitchen counter", "Everyday Cleaner")}
        ${review("ugc-handwashing", "Customer photo: a mom helping two kids wash their hands at the kitchen sink", "Aloe Hand Soap")}
    </div>
  </div>
</section>

<section class="section section--cream reveal" aria-labelledby="guarantee-title">
  <div class="container">
    <div class="fc-guarantee">
      <div class="fc-guarantee__seal" aria-hidden="true"><b>30</b><small>Day<br>guarantee</small></div>
      <div><h2 class="t-h3" id="guarantee-title">Love it or it's free</h2><p>Try your bundle for 30 days. If you're not happy for any reason, we'll refund you in full.</p></div>
    </div>
  </div>
</section>

<section class="section reveal" aria-labelledby="faq-title">
  <div class="container">
    <div class="section__head">
      <p class="t-eyebrow">Questions</p>
      <h2 class="t-h2" id="faq-title">Before you order</h2>
    </div>
    <div class="fc-faq">
      ${faqHtml}
    </div>
  </div>
</section>

<section class="final" aria-labelledby="final-title" data-hide-sticky>
  <div class="container final__grid">
    <div class="final__copy">
      <h2 class="t-h2" id="final-title">Make the season smell like cranberries, not chemicals</h2>
      <p class="t-lead">Best bundle: 10 products for $39</p>
      <a class="fc-btn fc-btn--on-dark" href="/checkout?bundle=best" data-cta="final" data-tier="best">Claim my 6 free products</a>
    </div>
    <div class="final__media">${pic("everyday-cleaner-flatlay", { sizes: "(min-width:1024px) 520px, calc(100vw - 32px)", alt: "Truly Free Home Frosted Cranberry Everyday Cleaner bottle and refill pouch on pink water with cranberries" })}</div>
  </div>
</section>

</main>

<footer class="site-footer" data-hide-sticky>
  <div class="container site-footer__grid">
    <div>
      <p class="wordmark wordmark--light">Truly Free Home</p>
      <p>Truly Free Home, Inc<br>6261 US Highway 31 N<br>Williamsburg, MI 49690</p>
    </div>
    <div>
      <p><strong>Customer support</strong><br><a href="tel:+12319441716">231-944-1716</a><br>Mon–Fri 9AM–9PM EST</p>
    </div>
    <div>
      <p><a href="https://my4.trulyfreehome.com/pages/privacy-policy">Privacy Policy</a><br><a href="https://my4.trulyfreehome.com/pages/terms-of-service">Terms of Service</a></p>
    </div>
  </div>
  <p class="container site-footer__legal">© 2026 Truly Free Home, Inc. All rights reserved. Made in Michigan.</p>
</footer>

<div class="fc-sticky" id="sticky" inert>
  <div class="fc-sticky__info"><strong id="sticky-title">Best · 10 products — $39</strong><span id="sticky-sub">+6 FREE · $3.90 per product</span></div>
  <a class="fc-btn fc-btn--primary" id="sticky-buy" href="/checkout?bundle=best" data-cta="sticky" data-tier="best">Get my bundle</a>
</div>
`;

const url = (k) => `${SITE}/checkout?bundle=${k}`;
const imgUrl = (key, w) => `${SITE}${IMG}frosted-cranberry-${key}-${w}.webp`;
const brand = { "@type": "Brand", name: "Truly Free Home" };
const scent = [{ "@type": "PropertyValue", name: "Scent", value: "Frosted Cranberry" }];

const offerFor = (k) => ({
  "@type": "Offer",
  "@id": `${SITE}/#offer-${k}`,
  name: `${BUNDLES[k].name}: ${BUNDLES[k].products} products`,
  description: BUNDLES[k].contents,
  price: String(BUNDLES[k].price),
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
  url: url(k),
  itemCondition: "https://schema.org/NewCondition",
  shippingDetails: {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
    deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" } },
  },
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
  },
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Truly Free Home",
      url: "https://trulyfreehome.com",
      telephone: "+1-231-944-1716",
      address: { "@type": "PostalAddress", streetAddress: "6261 US Highway 31 N", addressLocality: "Williamsburg", addressRegion: "MI", postalCode: "49690", addressCountry: "US" },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE}/#webpage`,
      url: `${SITE}/`,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "en-US",
      dateModified: MODIFIED,
      primaryImageOfPage: { "@type": "ImageObject", url: `${SITE}${IMG}${OG_IMAGE}` },
      about: { "@id": `${SITE}/#bundle` },
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "Product",
      "@id": `${SITE}/#everyday-cleaner`,
      name: "Truly Free Home Frosted Cranberry Everyday Cleaner",
      brand,
      description: "Refillable, plant-powered Everyday Cleaner in the Frosted Cranberry holiday scent. Ammonia-free and chlorine-free, formulated for 100s of household surfaces.",
      image: imgUrl("everyday-cleaner-refill-white", 960),
      additionalProperty: scent,
    },
    {
      "@type": "Product",
      "@id": `${SITE}/#aloe-hand-soap`,
      name: "Truly Free Home Frosted Cranberry Aloe Hand Soap",
      brand,
      description: "Refillable Aloe Hand Soap in the Frosted Cranberry holiday scent, made with 10x concentrated aloe vera.",
      image: imgUrl("bundle-white", 960),
      additionalProperty: scent,
    },
    {
      "@type": "Product",
      "@id": `${SITE}/#bundle`,
      name: "Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap Bundle",
      brand,
      description: "Holiday bundle of Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap. Best value: buy 2 Everyday Cleaner and 2 Aloe Hand Soap, get 3 of each free, 10 products for $39.",
      image: imgUrl("bundle-white", 960),
      additionalProperty: scent,
      isRelatedTo: [{ "@id": `${SITE}/#everyday-cleaner` }, { "@id": `${SITE}/#aloe-hand-soap` }],
      offers: {
        "@type": "AggregateOffer",
        "@id": `${SITE}/#bundle-offers`,
        lowPrice: "14",
        highPrice: "39",
        priceCurrency: "USD",
        offerCount: 3,
        offers: ["good", "better", "best"].map(offerFor),
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: `${f.lead} ${f.rest}` } })),
    },
  ],
};

const html = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESCRIPTION)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#a9303a">
<link rel="canonical" href="${SITE}/">
<link rel="icon" href="data:,">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Truly Free Home">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESCRIPTION)}">
<meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}${IMG}${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Truly Free Home Frosted Cranberry Everyday Cleaner and Aloe Hand Soap bundle with refill pouches">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESCRIPTION)}">
<meta name="twitter:image" content="${SITE}${IMG}${OG_IMAGE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&family=Merriweather:ital,wght@0,700;1,400&display=swap" rel="stylesheet">
<link rel="preload" as="image" type="image/avif" imagesrcset="${manifest["frosted-cranberry-hero-bundle-kitchen"].widths.map((w) => `${IMG}frosted-cranberry-hero-bundle-kitchen-${w}.avif ${w}w`).join(", ")}" imagesizes="(min-width:1024px) 560px, calc(100vw - 32px)" fetchpriority="high">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/landing.css">
<script>document.documentElement.classList.add("js");window.dataLayer=window.dataLayer||[];</script>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>${body}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;

writeFileSync("index.html", html);

mkdirSync("checkout", { recursive: true });
writeFileSync(
  "checkout/index.html",
  `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Checkout placeholder | Truly Free Home</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/landing.css">
</head>
<body>
<main class="container checkout-stub">
  <h1 class="t-h2">Checkout placeholder</h1>
  <p>This page stands in for the real Truly Free Home checkout. The CTA sends the selected bundle in the <code>bundle</code> query parameter (<code>good</code>, <code>better</code> or <code>best</code>). Real variant IDs are pending from Truly Free.</p>
  <p><a class="fc-btn fc-btn--secondary" href="/#offer">Back to the bundles</a></p>
</main>
</body>
</html>
`,
);

writeFileSync("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc><lastmod>${MODIFIED}</lastmod></url></urlset>\n`,
);
console.log("built index.html", html.length, "bytes");
