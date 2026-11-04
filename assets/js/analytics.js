const root = document.documentElement;
const variant = root.dataset.variant ?? "control";
const dataLayer = (window.dataLayer = window.dataLayer || []);

// Events only go to the in-page dataLayer. No third-party script is loaded and nothing is
// written to cookies or storage: without a consent banner there is no consent to rely on.
export const track = (event, params = {}) => {
  dataLayer.push({ event, variant, ...params });
};

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
