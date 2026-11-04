const cards = [...document.querySelectorAll("[data-bundle]")];
const requested = new URLSearchParams(location.search).get("bundle");
const selected = cards.find((c) => c.dataset.bundle === requested) ?? cards.find((c) => c.dataset.bundle === "best");
cards.forEach((c) => {
  c.hidden = c !== selected;
});

const pay = document.querySelector("[data-demo-pay]");
if (pay) {
  const status = document.createElement("div");
  status.id = "pay-status";
  status.className = "checkout__pay-status";
  status.setAttribute("role", "status");
  pay.closest(".checkout__actions").after(status);

  pay.setAttribute("aria-describedby", status.id);
  pay.classList.add("is-demo");

  const message = () => {
    const bundle = selected?.querySelector("h2")?.textContent.trim();
    return `<p class="checkout__pay-title">This is a demo: no payment was made.</p><p class="checkout__pay-body">No card was requested or charged${bundle ? ` and nothing was ordered for ${bundle}` : ""}. The real checkout is not connected yet. Use “Change bundle” to keep exploring.</p>`;
  };

  pay.addEventListener("click", (e) => {
    e.preventDefault();
    status.innerHTML = message();
    status.classList.remove("is-shown");
    void status.offsetWidth;
    status.classList.add("is-shown");
    status.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
}
