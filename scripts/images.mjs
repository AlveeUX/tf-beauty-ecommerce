// Image sets for the template (TF5, D-067).
//   node scripts/images.mjs apply            read NEXT_PUBLIC_DEMO_IMAGES (placeholder | real | figma), default placeholder
//   node scripts/images.mjs use <mode>       put that set into public/images
//   node scripts/images.mjs scan <dir>       write assets/placeholders.json from the pictures found under <dir>
// placeholder: generated here, committed in public/images, shipped in the zip.
// real:        licensed preview photos from assets/preview-photos (CREDITS.md); live preview only.
// figma:       the design's own photos from assets/figma-reference; local fidelity checks only, never shipped.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const PUBLIC = "public/images";
const MANIFEST = "assets/placeholders.json";
const SOURCES = { real: "assets/preview-photos", figma: "assets/figma-reference" };
const TONES = ["#eee9e1", "#e4ddd2", "#f2ece4", "#d9d2c7"];
const RASTER = /\.(jpe?g|png|webp)$/i;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const rel = (root, file) => relative(root, file).split("\\").join("/");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

async function scan(dir) {
  const items = [];
  for (const file of walk(dir)
    .filter((f) => RASTER.test(f))
    .sort()) {
    const meta = await sharp(file).metadata();
    items.push({
      path: rel(dir, file),
      width: meta.width,
      height: meta.height,
      alpha: Boolean(meta.hasAlpha),
    });
  }
  writeFileSync(MANIFEST, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${items.length} pictures listed in ${MANIFEST}`);
}

function svgFor({ path, width, height, alpha }, tone) {
  const inset = alpha ? Math.round(Math.min(width, height) * 0.12) : 0;
  const w = width - inset * 2;
  const h = height - inset * 2;
  const size = Math.max(11, Math.round(Math.min(w, h) / 9));
  const name = path.split("/").slice(-1)[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect x="${inset}" y="${inset}" width="${w}" height="${h}" rx="${alpha ? Math.round(inset / 2) : 0}" fill="${tone}"/>
<g fill="#736f6d" font-family="sans-serif" text-anchor="middle">
<text x="${width / 2}" y="${height / 2}" font-size="${size}" font-weight="600">${width} × ${height}</text>
<text x="${width / 2}" y="${height / 2 + size * 1.4}" font-size="${Math.round(size * 0.55)}">${name}</text></g></svg>`;
}

async function makePlaceholder(item) {
  const tone = TONES[parseInt(sha(item.path).slice(0, 2), 16) % TONES.length];
  const image = sharp(Buffer.from(svgFor(item, tone)));
  return /\.png$/i.test(item.path)
    ? image.png({ compressionLevel: 9 }).toBuffer()
    : image.flatten({ background: tone }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
}

function put(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file) && sha(readFileSync(file)) === sha(data)) return false;
  writeFileSync(file, data);
  return true;
}

async function applyMode(mode) {
  let changed = 0;
  const items = JSON.parse(readFileSync(MANIFEST, "utf8"));
  if (mode !== "placeholder" && !SOURCES[mode]) {
    throw new Error(`Unknown mode "${mode}". Use placeholder, real or figma.`);
  }
  if (SOURCES[mode] && !walk(SOURCES[mode]).some((f) => RASTER.test(f))) {
    console.warn(`No pictures in ${SOURCES[mode]}; the placeholders stay.`);
  }
  for (const item of items) {
    const from = SOURCES[mode] && join(SOURCES[mode], item.path);
    const data = from && existsSync(from) ? readFileSync(from) : await makePlaceholder(item);
    changed += put(join(PUBLIC, item.path), data) ? 1 : 0;
  }
  console.log(`images: ${mode}, ${items.length} pictures, ${changed} written`);
}

const [command, arg] = process.argv.slice(2);
if (command === "scan") await scan(arg);
else if (command === "use") await applyMode(arg);
else if (command === "apply") await applyMode(process.env.NEXT_PUBLIC_DEMO_IMAGES || "placeholder");
else throw new Error("Usage: images.mjs apply | use <mode> | scan <dir>");
