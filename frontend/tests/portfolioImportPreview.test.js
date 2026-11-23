import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { buildPortfolioPreview } from "../scripts/preview-portfolio-import.js";
import { portfolioImages, portfolioTypes } from "../src/pages/Category/portfolioData.js";

const publicDirectory = new URL("../public/", import.meta.url);
const first = portfolioImages.publicity[0];

test("the preview preserves all 89 published photos and available assets", () => {
  const preview = buildPortfolioPreview(portfolioImages, portfolioTypes, publicDirectory);
  assert.deepEqual(preview.counts, { publicity: 6, "events-bts": 6, "editorial-artistic": 51, portraits: 26 });
  assert.equal(preview.total, 89);
  assert.equal(new Set(preview.photos.map(photo => photo.importSourcePath)).size, 89);
  for (const category of portfolioTypes) {
    const entries = preview.photos.filter(photo => photo.category === category);
    entries.forEach((photo, order) => {
      assert.equal(photo.displayOrder, order);
      assert.equal(photo.imageUrl, photo.importSourcePath);
      assert.equal(photo.published, true);
      assert.equal(photo.cloudinaryAssetId, null);
      const original = portfolioImages[category][order];
      assert.deepEqual([photo.originalFilename, photo.width, photo.height],
        [original.file, original.width, original.height]);
    });
  }
});

test("duplicate source paths are rejected", () => {
  assert.throws(() => buildPortfolioPreview({ publicity: [first, first] }, ["publicity"], publicDirectory),
    /duplicate import path/i);
});

test("a missing source file stops the preview", () => {
  assert.throws(() => buildPortfolioPreview({ publicity: [{ ...first, file: "unavailable.jpg" }] },
    ["publicity"], publicDirectory), /missing Portfolio asset: .*portfolio\/publicity\/unavailable\.jpg/i);
});

test("a missing thumbnail stops the preview even when the original exists", t => {
  const directory = mkdtempSync(tmpdir() + "/marina-portfolio-test-");
  t.after(() => rmSync(directory, { recursive: true }));
  const root = pathToFileURL(directory + "/");
  const relative = `assets/images/portfolio/publicity/${first.file}`;
  mkdirSync(new URL(".", new URL(relative, root)), { recursive: true });
  copyFileSync(new URL(relative, publicDirectory), new URL(relative, root));
  assert.throws(() => buildPortfolioPreview({ publicity: [first] }, ["publicity"], root),
    /missing Portfolio asset: .*portfolio-thumbnails\/publicity\//i);
});
