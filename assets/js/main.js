const dataLayer = (window.dataLayer = window.dataLayer || []);
const track = (event, params = {}) => dataLayer.push({ event, ...params });
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const buy = document.getElementById("buy");
const sticky = document.getElementById("sticky");
const stickyBuy = document.getElementById("sticky-buy");
const stickyTitle = document.getElementById("sticky-title");
const stickySub = document.getElementById("sticky-sub");
const radios = document.querySelectorAll('input[name="bundle"]');

const offerGrid = document.querySelector(".fc-offer");
const tierLabels = Object.fromEntries([...offerGrid.children].map((el) => [el.querySelector("input").value, el]));
const tierOrder = matchMedia("(max-width: 767px)");
const syncTierOrder = () => {
  const keys = tierOrder.matches ? ["best", "better", "good"] : ["good", "better", "best"];
  const focused = document.activeElement;
  keys.forEach((k) => offerGrid.appendChild(tierLabels[k]));
  if (focused && focused.matches?.('input[name="bundle"]')) focused.focus();
};
tierOrder.addEventListener("change", syncTierOrder);
syncTierOrder();

const render = (radio) => {
  const { value, dataset } = radio;
  const { name, price, products, unit } = dataset;
  const href = `/checkout?bundle=${value}`;
  buy.textContent = `Get my ${products} products — $${price}`;
  buy.href = href;
  buy.dataset.tier = value;
  stickyBuy.href = href;
  stickyBuy.dataset.tier = value;
  stickyTitle.textContent = `${name} · ${products} products — $${price}`;
  stickySub.textContent = value === "best" ? `+6 FREE · $${unit} per product` : `$${unit} per product`;
};

radios.forEach((radio) =>
  radio.addEventListener("change", () => {
    render(radio);
    track("select_tier", { tier: radio.value, price: Number(radio.dataset.price) });
  }),
);
render(document.querySelector('input[name="bundle"]:checked'));

document.addEventListener("click", (e) => {
  const cta = e.target.closest("[data-cta]");
  if (!cta) return;
  const tier = cta.dataset.tier;
  const price = Number(document.querySelector(`input[value="${tier}"]`).dataset.price);
  track("begin_checkout", { tier, price, cta_location: cta.dataset.cta });
});

const announce = document.getElementById("announce");
const messages = announce.querySelectorAll(".fc-announce__msg");
const mobile = matchMedia("(max-width: 639px)");
let rotation = null;
let paused = false;
const syncRotation = () => {
  clearInterval(rotation);
  const active = mobile.matches && !reducedMotion.matches;
  announce.classList.toggle("is-rotating", active);
  if (!active) return;
  let index = 0;
  rotation = setInterval(() => {
    if (paused) return;
    index = (index + 1) % messages.length;
    messages.forEach((m, i) => m.classList.toggle("is-active", i === index));
  }, 5000);
};
["mouseenter", "focusin", "touchstart"].forEach((t) => announce.addEventListener(t, () => (paused = true), { passive: true }));
["mouseleave", "focusout"].forEach((t) => announce.addEventListener(t, () => (paused = false)));
mobile.addEventListener("change", syncRotation);
reducedMotion.addEventListener("change", syncRotation);
syncRotation();

document.querySelectorAll(".fc-ba").forEach((ba) => {
  const input = ba.querySelector("input");
  let interacted = false;
  input.addEventListener("input", () => {
    ba.style.setProperty("--pos", `${input.value}%`);
    if (!interacted) {
      interacted = true;
      track("ba_interact", { pair: ba.dataset.pair });
    }
  });
});

document.querySelectorAll(".fc-faq details").forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) track("faq_open", { question: d.querySelector("summary").textContent.trim() });
  }),
);

const offer = document.getElementById("offer");
new IntersectionObserver(
  (entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) {
      track("view_offer");
      obs.disconnect();
    }
  },
  { rootMargin: "-50% 0px -50% 0px" },
).observe(offer);

const heroCta = document.getElementById("hero-cta");
const hideTargets = [...document.querySelectorAll("[data-hide-sticky]")];
let heroGone = false;
const overlapping = new Set();
const updateSticky = () => {
  const show = heroGone && overlapping.size === 0;
  sticky.classList.toggle("is-visible", show);
  sticky.toggleAttribute("inert", !show);
};
new IntersectionObserver(([e]) => {
  heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
  updateSticky();
}).observe(heroCta);
const hideObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? overlapping.add(e.target) : overlapping.delete(e.target)));
  updateSticky();
});
hideTargets.forEach((t) => hideObserver.observe(t));

if (!reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

const gtmId = document.querySelector('meta[name="gtm-id"]')?.content;
if (gtmId) {
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const gtm = document.createElement("script");
  gtm.async = true;
  gtm.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(gtm);
}
