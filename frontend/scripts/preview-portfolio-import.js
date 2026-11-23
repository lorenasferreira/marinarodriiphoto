import assert from "node:assert/strict";
import { accessSync, constants, readdirSync, statSync } from "node:fs";
import { argv, stdout } from "node:process";
import { pathToFileURL } from "node:url";
import { portfolioImages, portfolioTypes } from "../src/pages/Category/portfolioData.js";

export function buildPortfolioPreview(images, categories, publicDirectory) {
  const seen = new Set();
  const photos = categories.flatMap(category =>
    images[category].map(({ file, width, height }, displayOrder) => {
      assert.ok(file && file !== "." && file !== ".." && !/[/\\\\?#]/.test(file) && file.length <= 255,
        "Invalid filename in the Portfolio manifest");
      assert.ok(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0,
        `Invalid dimensions for ${category}/${file}`);

      const imageUrl = `/assets/images/portfolio/${category}/${file}`;
      const thumbnailUrl = `/assets/images/portfolio-thumbnails/${category}/${file}.jpg`;
      assert.ok(!seen.has(imageUrl) && imageUrl.length <= 512, `Invalid or duplicate import path: ${imageUrl}`);
      seen.add(imageUrl);
      for (const url of [imageUrl, thumbnailUrl]) {
        const path = new URL("." + url, publicDirectory);
        const stats = statSync(path, { throwIfNoEntry: false });
        assert.ok(stats?.isFile() && readdirSync(new URL(".", path)).includes(url.split("/").at(-1)),
          `Missing Portfolio asset: ${url}`);
        assert.ok(stats.size > 0, `Empty Portfolio asset: ${url}`);
        accessSync(path, constants.R_OK);
      }

      return {
        category,
        displayOrder,
        published: true,
        originalFilename: file,
        width,
        height,
        altText: null,
        imageUrl,
        thumbnailUrl,
        cloudinaryAssetId: null,
        cloudinaryPublicId: null,
        importSourcePath: imageUrl,
      };
    }),
  );

  const counts = Object.fromEntries(categories.map(category => [category, images[category].length]));
  return { total: photos.length, counts, photos };
}

if (argv[1] && pathToFileURL(argv[1]).href === import.meta.url) {
  const preview = buildPortfolioPreview(portfolioImages, portfolioTypes, new URL("../public/", import.meta.url));
  stdout.write(JSON.stringify(preview, null, 2) + "\n");
}
