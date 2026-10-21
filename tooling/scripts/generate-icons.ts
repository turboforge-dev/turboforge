import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { atomicWrite, existsAsync } from "./utils.ts";

/**
 * Packs multiple PNG image buffers into a standard ICO binary format.
 * Compatible with all modern browsers and operating systems.
 */
function createIco(pngBuffers: Buffer[], sizes: number[]): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + dirEntrySize * count;

  let totalSize = totalDirSize;
  for (const buf of pngBuffers) {
    totalSize += buf.length;
  }

  const ico = Buffer.alloc(totalSize);

  // ICO Header
  ico.writeUInt16LE(0, 0); // Reserved. Must always be 0.
  ico.writeUInt16LE(1, 2); // Specifies image type: 1 for icon (.ICO)
  ico.writeUInt16LE(count, 4); // Number of images in file

  let offset = totalDirSize;

  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const size = sizes[i];
    const entryOffset = headerSize + i * dirEntrySize;

    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset); // Width
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1); // Height
    ico.writeUInt8(0, entryOffset + 2); // Color palette (0 = no palette)
    ico.writeUInt8(0, entryOffset + 3); // Reserved
    ico.writeUInt16LE(1, entryOffset + 4); // Color planes
    ico.writeUInt16LE(32, entryOffset + 6); // Bits per pixel (32 for RGBA)
    ico.writeUInt32LE(png.length, entryOffset + 8); // Size of image data in bytes
    ico.writeUInt32LE(offset, entryOffset + 12); // Offset of image data from beginning of ICO

    png.copy(ico, offset);
    offset += png.length;
  }

  return ico;
}

async function generateIcons() {
  const inputArg = process.argv[2];

  let inputPath = inputArg ? resolve(inputArg) : "";

  if (!inputPath || !(await existsAsync(inputPath))) {
    // Check fallback candidates
    const candidates = [
      resolve("logo.svg"),
      resolve("logo.png"),
      resolve("apps/web/src/app/icon.png"),
    ];

    for (const candidate of candidates) {
      if (await existsAsync(candidate)) {
        inputPath = candidate;
        break;
      }
    }
  }

  if (!inputPath || !(await existsAsync(inputPath))) {
    console.error("Usage: pnpm gen:icons <path-to-square-logo.png|svg>");
    process.exitCode = 1;
    return;
  }

  console.log(`Generating icons from ${inputPath}...`);

  const iconPngPath = resolve("apps/web/src/app/icon.png");
  const appleIconJpgPath = resolve("apps/web/src/app/apple-icon.jpg");
  const faviconIcoPath = resolve("apps/web/public/favicon.ico");

  await Promise.all([
    mkdir(dirname(iconPngPath), { recursive: true }),
    mkdir(dirname(faviconIcoPath), { recursive: true }),
  ]);

  // 1. apps/web/src/app/icon.png (512x512 transparent alpha)
  const iconPngBuffer = await sharp(inputPath)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await writeFile(iconPngPath, iconPngBuffer);
  console.log(`Generated ${iconPngPath} (512x512 transparent PNG)`);

  // 2. apps/web/src/app/apple-icon.jpg (1024x1024 on white #ffffff)
  const appleIconJpgBuffer = await sharp(inputPath)
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 95 })
    .toBuffer();
  await writeFile(appleIconJpgPath, appleIconJpgBuffer);
  console.log(`Generated ${appleIconJpgPath} (1024x1024 white-bg JPEG)`);

  // 3. apps/web/public/favicon.ico (16x16, 32x32, 48x48 ICO)
  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(inputPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer(),
    ),
  );
  const icoBuffer = createIco(pngBuffers, icoSizes);
  await writeFile(faviconIcoPath, icoBuffer);
  console.log(`Generated ${faviconIcoPath} (multi-res ICO: 16, 32, 48)`);

  // 4. Update logo alt in apps/web/src/lib/layout.shared.tsx
  const layoutSharedPath = resolve("apps/web/src/lib/layout.shared.tsx");
  if (await existsAsync(layoutSharedPath)) {
    const content = await readFile(layoutSharedPath, "utf-8");
    const updated = content.replace(
      /alt=["'][^"']*logo["']/i,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: target is JSX template literal
      "alt={`${name} logo`}",
    );
    await atomicWrite(layoutSharedPath, updated);
    console.log(`Updated logo alt attribute in ${layoutSharedPath}`);
  }

  console.log("Icon pipeline completed successfully.");
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exitCode = 1;
});
