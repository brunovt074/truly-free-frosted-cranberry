const cards = [...document.querySelectorAll("[data-bundle]")];
const requested = new URLSearchParams(location.search).get("bundle");
const selected = cards.find((c) => c.dataset.bundle === requested) ?? cards.find((c) => c.dataset.bundle === "best");
cards.forEach((c) => {
  c.hidden = c !== selected;
});

const pay = document.getElementById("pay");
const status = document.getElementById("pay-status");
const label = pay.textContent;

pay.addEventListener("click", () => {
  if (pay.dataset.busy) return;
  pay.dataset.busy = "true";
  pay.setAttribute("aria-busy", "true");
  pay.classList.add("is-busy");
  pay.textContent = "Processing…";
  status.textContent = "";
  setTimeout(() => {
    delete pay.dataset.busy;
    pay.removeAttribute("aria-busy");
    pay.classList.remove("is-busy");
    pay.textContent = label;
    status.textContent = "Demo only: no payment is taken. The real checkout is pending, so call 231-944-1716 to place the order.";
  }, 1200);
});
