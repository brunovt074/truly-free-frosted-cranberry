import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer-core";

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".avif": "image/avif", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };
const executablePath = process.env.CHROME_PATH;
let server, browser, base;

before(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/") || path === "/checkout") path = join(path, "index.html");
    try {
      const body = await readFile(join(process.cwd(), path));
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
});

after(async () => {
  await browser.close();
  server.close();
});

const open = async (width, path = "/") => {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: "networkidle0" });
  return { page, errors };
};

test("Best is preselected and the CTA reflects it", async () => {
  const { page, errors } = await open(1440);
  const state = await page.evaluate(() => ({
    checked: document.querySelector('input[name="bundle"]:checked').value,
    text: document.getElementById("buy").textContent.trim(),
    href: document.getElementById("buy").getAttribute("href"),
  }));
  assert.deepEqual(state, { checked: "best", text: "Get my 10 products — $39", href: "/checkout?bundle=best" });
  assert.deepEqual(errors, []);
  await page.close();
});

test("tier order matches the screen: Good-Better-Best on desktop, Best-Better-Good on mobile", async () => {
  const order = (page) => page.evaluate(() => [...document.querySelectorAll('input[name="bundle"]')].map((i) => i.value));
  const desktop = await open(1440);
  assert.deepEqual(await order(desktop.page), ["good", "better", "best"]);
  const mobile = await open(390);
  assert.deepEqual(await order(mobile.page), ["best", "better", "good"]);
  await desktop.page.close();
  await mobile.page.close();
});

test("selecting a tier updates the CTA and emits select_tier", async () => {
  const { page } = await open(1440);
  await page.click('label:has(input[value="good"])');
  const state = await page.evaluate(() => ({
    text: document.getElementById("buy").textContent.trim(),
    href: document.getElementById("buy").getAttribute("href"),
    events: window.dataLayer.filter((e) => e.event === "select_tier"),
  }));
  assert.equal(state.text, "Get my 2 products — $14");
  assert.equal(state.href, "/checkout?bundle=good");
  assert.deepEqual(state.events, [{ event: "select_tier", tier: "good", price: 14 }]);
  await page.close();
});

test("per-product prices are $7.00, $6.00 and $3.90", async () => {
  const { page } = await open(1440);
  const units = await page.evaluate(() => [...document.querySelectorAll('input[name="bundle"]')].map((i) => `${i.value}:${i.dataset.unit}`));
  assert.deepEqual(units, ["good:7.00", "better:6.00", "best:3.90"]);
  await page.close();
});

test("FAQPage JSON-LD matches the visible FAQ", async () => {
  const { page } = await open(1440);
  const { visible, schema } = await page.evaluate(() => {
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@graph"];
    const faq = graph.find((n) => n["@type"] === "FAQPage").mainEntity;
    return {
      schema: faq.map((q) => [q.name, q.acceptedAnswer.text]),
      visible: [...document.querySelectorAll("details")].map((d) => [d.querySelector("summary").textContent.trim(), d.querySelector(".fc-faq__a").textContent.trim()]),
    };
  });
  assert.deepEqual(schema, visible);
  await page.close();
});

test("schema has no AggregateRating and no per-product offers", async () => {
  const { page } = await open(1440);
  const graph = await page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@graph"]);
  assert.ok(!JSON.stringify(graph).includes("AggregateRating"));
  const products = graph.filter((n) => n["@type"] === "Product");
  const bundle = products.find((n) => n.offers?.["@type"] === "AggregateOffer");
  assert.equal(products.filter((n) => n.offers).length, 1);
  assert.equal(Number(bundle.offers.lowPrice), 14);
  assert.equal(Number(bundle.offers.highPrice), 39);
  assert.equal(bundle.offers.offers.length, 3);
  await page.close();
});

test("checkout shows the requested bundle and defaults to Best", async () => {
  const shown = async (path) => {
    const { page } = await open(390, path);
    const v = await page.evaluate(() => [...document.querySelectorAll("[data-bundle]")].filter((c) => !c.hidden).map((c) => c.dataset.bundle));
    await page.close();
    return v;
  };
  assert.deepEqual(await shown("/checkout?bundle=better"), ["better"]);
  assert.deepEqual(await shown("/checkout?bundle=nope"), ["best"]);
});

test("no horizontal overflow at 390, 768, 1024 and 1440", async () => {
  for (const w of [390, 768, 1024, 1440]) {
    const { page } = await open(w);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `overflow at ${w}`);
    await page.close();
  }
});

test("axe finds no WCAG 2.2 AA violations on the landing and checkout", async () => {
  const axeSource = await readFile(join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");
  for (const [width, path] of [[390, "/"], [1440, "/"], [390, "/checkout"]]) {
    const { page } = await open(width, path);
    await page.evaluate(axeSource);
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
      return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
    });
    assert.deepEqual(violations, [], `axe at ${width}${path}`);
    await page.close();
  }
});
