/**
 * Одноразовый скрипт: OG 1200×630, favicon и apple-touch-icon из логотипа.
 * Источник: src/assets/logo.png (@/assets/logo.png).
 * Запуск: npx tsx scripts/make-og.ts
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Соответствует @/assets/logo.png */
const logoPath = path.join(root, "src/assets/logo.png");
const publicDir = path.join(root, "public");

/** Фирменный акцент --accent #c47a3a */
const brand = { r: 196, g: 122, b: 58, alpha: 1 };

async function makeOg() {
  const width = 1200;
  const height = 630;
  const logoSize = 360;

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const left = Math.round((width - logoSize) / 2);
  const top = Math.round((height - logoSize) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: brand,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(path.join(publicDir, "og.png"));

  console.log("Wrote public/og.png (1200×630)");
}

async function makeFavicon() {
  await sharp(logoPath)
    .resize(32, 32, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(publicDir, "favicon.png"));

  console.log("Wrote public/favicon.png (32×32)");
}

async function makeAppleTouchIcon() {
  const size = 180;
  const logoSize = 140;

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const offset = Math.round((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: brand,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  console.log("Wrote public/apple-touch-icon.png (180×180)");
}

async function main() {
  await makeOg();
  await makeFavicon();
  await makeAppleTouchIcon();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
