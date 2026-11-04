import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { copyFile, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer-core";

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".avif": "image/avif", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };
const executablePath = process.env.CHROME_PATH;
let browser, base;
const extra = [];
const run = promisify(execFile);

const serve = async (roots) => {
  const instance = createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/") || path === "/checkout") path = join(path, "index.html");
    for (const root of roots) {
      try {
        const body = await readFile(join(root, path));
        res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" }).end(body);
        return;
      } catch {
        continue;
      }
    }
    res.writeHead(404).end();
  });
  await new Promise((r) => instance.listen(0, r));
  extra.push(instance);
  return { instance, url: `http://localhost:${instance.address().port}` };
};

const buildWith = async (env) => {
  const dir = await mkdtemp(join(tmpdir(), "fc-build-"));
  await mkdir(join(dir, "scripts"));
  await copyFile("scripts/images.manifest.json", join(dir, "scripts/images.manifest.json"));
  await run(process.execPath, [join(process.cwd(), "scripts/build.mjs")], { cwd: dir, env: { ...process.env, SITE_URL: "https://example.test", ...env } });
  return serve([dir, process.cwd()]);
};

before(async () => {
  const main = await serve([process.cwd()]);
  base = main.url;
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
});

after(async () => {
  await browser.close();
  extra.forEach((s) => s.close());
});

const open = async (width, path = "/", origin = base) => {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(origin + path, { waitUntil: "networkidle0" });
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
  assert.deepEqual(state.events, [{ event: "select_tier", variant: "control", tier: "good", price: 14 }]);
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

test("variants change only their own element and keep the base canonical", async () => {
  const read = async (path) => {
    const { page } = await open(1440, path);
    const state = await page.evaluate(() => ({
      variant: document.documentElement.dataset.variant,
      h1: document.querySelector("h1").textContent,
      hero: document.querySelector(".hero__media img").currentSrc,
      canonical: document.querySelector('link[rel="canonical"]').href,
      checked: document.querySelector('input[name="bundle"]:checked').value,
    }));
    await page.close();
    return state;
  };
  const [control, v1, v2] = [await read("/"), await read("/v1/"), await read("/v2/")];
  assert.deepEqual([control.variant, v1.variant, v2.variant], ["control", "v1", "v2"]);
  assert.ok(control.hero.includes("hero-bundle-kitchen") && v2.hero.includes("hero-bundle-kitchen"));
  assert.ok(v1.hero.includes("hero-duo-family"));
  assert.equal(v1.h1, control.h1);
  assert.match(v2.h1, /^Buy 4, get 6 free/);
  assert.notEqual(v2.h1, control.h1);
  assert.equal(new Set([control.canonical, v1.canonical, v2.canonical]).size, 1);
  assert.deepEqual([control.checked, v1.checked, v2.checked], ["best", "best", "best"]);
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.equal(sitemap.match(/<loc>/g).length, 1);
});

test("every event carries the variant, checkout events carry value and currency, scroll depth and phone clicks are tracked", async () => {
  const { page } = await open(390, "/v2/");
  await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault(), true));
  await page.click("#hero-cta");
  await page.evaluate(() => document.getElementById("buy").click());
  await page.evaluate(() => document.querySelector('a[href^="tel:"]').click());
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => window.dataLayer.some((e) => e.event === "scroll_depth" && e.percent === 100));
  const layer = await page.evaluate(() => window.dataLayer.filter((e) => e.event));
  assert.ok(layer.length >= 4 && layer.every((e) => e.variant === "v2"));
  assert.deepEqual(layer.find((e) => e.event === "begin_checkout"), { event: "begin_checkout", variant: "v2", tier: "best", price: 39, value: 39, currency: "USD", cta_location: "offer" });
  assert.ok(layer.some((e) => e.event === "click_phone"));
  assert.ok(layer.some((e) => e.event === "experiment_view"));
  await page.close();
});

test("a default build loads nothing third-party and renders no consent bar", async () => {
  const { page } = await open(390);
  const state = await page.evaluate(() => ({
    bar: Boolean(document.getElementById("consent")),
    external: performance.getEntriesByType("resource").filter((r) => !r.name.startsWith(location.origin)).map((r) => r.name),
  }));
  assert.deepEqual(state, { bar: false, external: [] });
  await page.close();
});

const openTracked = async (origin) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900 });
  const errors = [];
  const hits = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().startsWith(origin)) return req.continue();
    hits.push(req.url());
    req.respond({ status: 200, contentType: "text/javascript", body: "" });
  });
  await page.goto(`${origin}/`, { waitUntil: "networkidle0" });
  return { page, errors, hits };
};

test("GA4 and Clarity load on arrival with analytics granted and ads denied, and no consent bar is rendered", async () => {
  const { url } = await buildWith({ GA4_ID: "G-TEST12345", CLARITY_ID: "test12345a" });
  const { page, errors, hits } = await openTracked(url);
  assert.equal(await page.evaluate(() => Boolean(document.getElementById("consent"))), false);
  assert.ok(hits.includes("https://www.googletagmanager.com/gtag/js?id=G-TEST12345"));
  assert.ok(hits.includes("https://www.clarity.ms/tag/test12345a"));
  const layer = await page.evaluate(() => [...window.dataLayer].filter((x) => x.length).map((x) => [...x]));
  assert.deepEqual(layer[0], ["consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  const queued = await page.evaluate(() => window.clarity.q.map((a) => [...a]).find((a) => a[0] === "consentv2"));
  assert.deepEqual(queued[1], { ad_Storage: "denied", analytics_Storage: "granted" });
  assert.deepEqual(errors, []);
  await page.close();
});

test("a malformed tracking id fails the build instead of silently disabling tracking", async () => {
  for (const env of [{ GA4_ID: "G-TEST12345 " }, { CLARITY_ID: "Test12345a" }, { GTM_ID: "gtm-test123" }]) {
    await assert.rejects(buildWith(env), (error) => error.stderr.includes("does not match"), JSON.stringify(env));
  }
});

test("GTM takes over and GA4 and Clarity ids are ignored", async () => {
  const { url } = await buildWith({ GTM_ID: "GTM-TEST123", GA4_ID: "G-TEST12345", CLARITY_ID: "test12345a" });
  const { page, errors, hits } = await openTracked(url);
  assert.deepEqual(hits, ["https://www.googletagmanager.com/gtm.js?id=GTM-TEST123"]);
  assert.deepEqual(errors, []);
  const csp = await page.$eval('meta[http-equiv="Content-Security-Policy"]', (m) => m.content);
  assert.ok(csp.includes("https://scripts.clarity.ms") && csp.includes("https://*.clarity.ms") && csp.includes("https://c.bing.com"));
  await page.close();
});

test("axe finds no violations on the landing, the checkout and the variant pages", async () => {
  const axeSource = await readFile(join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");
  const audit = async (page) => {
    await page.evaluate(axeSource);
    return page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
      return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
    });
  };
  const { url } = await buildWith({ GA4_ID: "G-TEST12345" });
  const { page } = await openTracked(url);
  assert.deepEqual(await audit(page), []);
  await page.close();
  for (const path of ["/v1/", "/v2/"]) {
    const variantPage = (await open(390, path)).page;
    assert.deepEqual(await audit(variantPage), [], path);
    await variantPage.close();
  }
});

test("the hero CTA lands on the bundle cards with their prices inside the viewport", async () => {
  for (const [width, height] of [[1440, 733], [390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(base + "/", { waitUntil: "networkidle0" });
    await page.click("#hero-cta");
    await page.waitForFunction(() => scrollY > 0);
    await new Promise((r) => setTimeout(r, 700));
    const state = await page.evaluate(() => {
      const header = document.querySelector(".site-header").getBoundingClientRect();
      const grid = document.getElementById("bundles").getBoundingClientRect();
      const prices = [...document.querySelectorAll(".fc-tier__price")].filter((el) => el.offsetParent).map((el) => el.getBoundingClientRect());
      return {
        belowHeader: grid.top >= header.height,
        pricesVisible: prices.every((p) => p.top >= 0 && p.bottom <= innerHeight),
        priceBelowMedia: [...document.querySelectorAll(".fc-tier")].filter((el) => el.offsetParent).every((el) => {
          const media = el.querySelector(".fc-tier__media");
          const price = el.querySelector(".fc-tier__price");
          if (!media || media.offsetParent === null) return true;
          return price.getBoundingClientRect().top >= media.getBoundingClientRect().bottom - 1;
        }),
      };
    });
    assert.deepEqual(state, { belowHeader: true, pricesVisible: true, priceBelowMedia: true }, `${width}x${height}`);
    await page.close();
  }
});

test("the phone number copies on a pointer device and confirms it", async () => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await page.goto(base + "/", { waitUntil: "networkidle0" });
  await page.click('a[href^="tel:"]');
  await page.waitForSelector(".phone-copy");
  assert.equal(await page.$eval(".phone-copy", (el) => el.textContent), "Number copied");
  assert.equal(await page.evaluate(() => window.__copied), "231-944-1716");
  assert.equal(new URL(page.url()).pathname, "/");
  await page.close();
});

test("paying on the demo checkout shows progress and then explains the demo", async () => {
  const { page } = await open(1024, "/checkout?bundle=better");
  await page.click("#pay");
  assert.equal(await page.$eval("#pay", (el) => el.getAttribute("aria-busy")), "true");
  assert.equal(await page.$eval("#pay", (el) => el.textContent), "Processing…");
  await page.waitForFunction(() => document.getElementById("pay-status").textContent.length > 0);
  assert.equal(await page.$eval("#pay", (el) => el.hasAttribute("aria-busy")), false);
  assert.match(await page.$eval("#pay-status", (el) => el.textContent), /Demo only/);
  await page.close();
});

test("no placeholder markers reach the rendered page", async () => {
  for (const path of ["/", "/v1/", "/v2/", "/checkout"]) {
    const html = await (await fetch(base + path)).text();
    assert.doesNotMatch(html, /VERIFICAR|fc-todo/, path);
  }
});
