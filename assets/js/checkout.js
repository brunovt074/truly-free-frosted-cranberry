const cards = [...document.querySelectorAll("[data-bundle]")];
const requested = new URLSearchParams(location.search).get("bundle");
const selected = cards.find((c) => c.dataset.bundle === requested) ?? cards.find((c) => c.dataset.bundle === "best");
cards.forEach((c) => {
  c.hidden = c !== selected;
});
