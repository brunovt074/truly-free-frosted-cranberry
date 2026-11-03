import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.TF_ASSETS ?? "/home/br1/Downloads/truly-free";
const EDC = path.join(ROOT, "drive-download-20261103T023356Z-1-001");
const AHS = path.join(ROOT, "drive-download-20261103T023154Z-1-001");
const OUT = path.resolve("assets/img");

const FULL = [640, 960, 1280, 1600];
const SMALL = [640, 960];

const images = [
  { name: "frosted-cranberry-hero-bundle-kitchen", src: path.join(EDC, "Hero/1x1/EDC_FRC_Hero_Bundle_1x1_4.jpg"), widths: FULL },
  { name: "frosted-cranberry-duo-water-flatlay", src: path.join(EDC, "Water Flatlay/Cranberry Splash Cleaning Collection.png"), widths: [640, 960, 1254] },
  { name: "frosted-cranberry-everyday-cleaner-flatlay", src: path.join(EDC, "Water Flatlay/EDC_FRC_Flatlay_1x1_2.jpg"), widths: FULL },
  { name: "frosted-cranberry-everyday-cleaner-refill-white", src: path.join(EDC, "White BG/EDC_FRC_Whitebackdrop_2.jpg"), widths: SMALL },
  { name: "frosted-cranberry-bundle-white", src: path.join(EDC, "White BG/EDC_FRC_Whitebackdrop_Bundle_1.jpg"), widths: SMALL },
  { name: "frosted-cranberry-table-paint-before", src: path.join(EDC, "Before & After/1x1/EDC_FRC_Before_Paint_1x1_1.jpg"), widths: SMALL },
  { name: "frosted-cranberry-table-paint-after", src: path.join(EDC, "Before & After/1x1/EDC_FRC_After_Paint_1x1_2.jpg"), widths: SMALL },
  { name: "frosted-cranberry-counter-pizza-before", src: path.join(EDC, "Before & After/1x1/EDC_FRC_Before_Pizza_1x1_1.jpg"), widths: SMALL },
  { name: "frosted-cranberry-counter-pizza-after", src: path.join(EDC, "Before & After/1x1/EDC_FRC_Process_Pizza_1x1_2.jpg"), widths: SMALL },
  { name: "frosted-cranberry-hands-paint-before", src: path.join(AHS, "Before & After/1x1/AHS_FRC_Before_Paint_1x1_1.jpg"), widths: SMALL },
  { name: "frosted-cranberry-hands-paint-after", src: path.join(AHS, "Before & After/1x1/AHS_FRC_After_Paint_1x1_1.jpg"), widths: SMALL },
  { name: "frosted-cranberry-refill-step-1-fill", src: path.join(EDC, "Refilling/1x1/EDC_FRC_Refill_1x1_7.jpg"), widths: SMALL },
  { name: "frosted-cranberry-refill-step-2-pouch", src: path.join(EDC, "Refilling/1x1/EDC_FRC_Refill_1x1_4.jpg"), widths: SMALL },
  { name: "frosted-cranberry-refill-step-3-cap", src: path.join(EDC, "Refilling/1x1/EDC_FRC_Refill_1x1_2.jpg"), widths: SMALL },
  { name: "frosted-cranberry-made-without-little-hands", src: path.join(AHS, "Site Images/LS2.webp"), widths: [640, 960, 1080] },
  { name: "frosted-cranberry-ugc-pizza-night", src: path.join(EDC, "Iphone B&A/EDC_FRC_IphoneB&A_4.jpg"), widths: SMALL },
  { name: "frosted-cranberry-ugc-handwashing", src: path.join(AHS, "Iphone B&A/AHS_FRC_IphoneB&A_5.jpg"), widths: SMALL },
];

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const img of images) {
  const meta = await sharp(img.src).rotate().metadata();
  const ratio = meta.height / meta.width;
  manifest[img.name] = { widths: img.widths, ratio: Number(ratio.toFixed(4)) };
  for (const w of img.widths) {
    const base = sharp(img.src).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(path.join(OUT, `${img.name}-${w}.avif`));
    await base.clone().webp({ quality: 78, effort: 5 }).toFile(path.join(OUT, `${img.name}-${w}.webp`));
  }
  console.log(img.name, meta.width, meta.height);
}

await sharp(path.join(AHS, "Hero/16x9/AHS_FRC_Hero_Bundle_16x9_5.jpg"))
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(OUT, "frosted-cranberry-og-image-1200x630.jpg"));

await writeFile("scripts/images.manifest.json", JSON.stringify(manifest, null, 2));
