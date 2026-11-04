const CONSENT = { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
const root = document.documentElement;
const variant = root.dataset.variant ?? "control";
const dataLayer = (window.dataLayer = window.dataLayer || []);
const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content;
const ids = { gtm: meta("gtm-id"), ga4: meta("ga4-id"), clarity: meta("clarity-id") };
const enabled = Boolean(ids.gtm || ids.ga4 || ids.clarity);

function gtag() {
  dataLayer.push(arguments);
}

const clarity = (...args) => window.clarity?.(...args);

export const track = (event, params = {}) => {
  dataLayer.push({ event, variant, ...params });
  if (ids.ga4) gtag("event", event, { variant, ...params });
  clarity("event", event);
  if (params.tier) clarity("set", "tier", params.tier);
};

const loadScript = (src) => {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

let loaded = false;

const load = () => {
  if (loaded) return;
  loaded = true;
  if (ids.gtm) {
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(ids.gtm)}`);
  } else if (ids.ga4) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga4)}`);
    gtag("js", new Date());
    gtag("config", ids.ga4);
  }
  if (ids.clarity) {
    window.clarity =
      window.clarity ||
      function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(ids.clarity)}`);
    clarity("set", "variant", variant);
  }
};

if (enabled) {
  if (ids.gtm || ids.ga4) gtag("consent", "default", CONSENT);
  load();
  if (ids.clarity) clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
}

track("experiment_view");

const phone = (e) => {
  const link = e.target.closest('a[href^="tel:"]');
  if (link) track("click_phone", { location: link.closest("footer") ? "footer" : "header" });
};
document.addEventListener("click", phone);

const depths = [25, 50, 75, 100];
const reached = new Set();
let scheduled = false;

const measure = () => {
  scheduled = false;
  const percent = Math.round(((scrollY + innerHeight) / root.scrollHeight) * 100);
  for (const depth of depths) {
    if (percent >= depth && !reached.has(depth)) {
      reached.add(depth);
      track("scroll_depth", { percent: depth });
    }
  }
  if (reached.size === depths.length) removeEventListener("scroll", schedule);
};

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(measure);
}

addEventListener("scroll", schedule, { passive: true });
