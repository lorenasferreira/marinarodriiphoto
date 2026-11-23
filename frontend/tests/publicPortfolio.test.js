import assert from "node:assert/strict";
import { statSync } from "node:fs";
import test from "node:test";
import { portfolioImages, portfolioTypes } from "../src/pages/Category/portfolioData.js";
import { bundledPhotos, fetchPublicPortfolio, portfolioPhotoIndex, selectPortfolioPhotos } from "../src/pages/Portfolio/portfolioSource.js";

const apiPath = "/api/public/portfolio";
const bundled = bundledPhotos[0];
const fromBundle = { id: 1, category: bundled.category, width: bundled.width, height: bundled.height,
  imageUrl: bundled.src, thumbnailUrl: bundled.thumbnail, sources: [], title: null, altText: null };
const fromCloud = { id: 2, category: "portraits", width: 600, height: 400,
  imageUrl: apiPath + "/2/media/1920", thumbnailUrl: apiPath + "/2/media/320",
  sources: [{ width: 320, url: apiPath + "/2/media/320" }, { width: 600, url: apiPath + "/2/media/640" }],
  title: "Window Light", altText: "A portrait beside a window" };

function respond(t, response) {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, apiPath);
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    return response;
  });
}

test("all 89 bundled photos preserve exact order, dimensions, URLs and case", () => {
  const publicRoot = new URL("../public/", import.meta.url);
  assert.equal(bundledPhotos.length, 89);
  let offset = 0;
  for (const category of portfolioTypes) {
    for (const [index, { file, width, height }] of portfolioImages[category].entries()) {
      const photo = bundledPhotos[offset + index];
      assert.equal(photo.category, category);
      assert.equal(photo.src, `/assets/images/portfolio/${category}/${file}`);
      assert.equal(photo.thumbnail, `/assets/images/portfolio-thumbnails/${category}/${file}.jpg`);
      assert.equal(photo.width, width);
      assert.equal(photo.height, height);
      for (const url of [photo.src, photo.thumbnail]) {
        assert.ok(statSync(new URL("." + url, publicRoot)).isFile());
      }
    }
    offset += portfolioImages[category].length;
  }
});

test("normalizes public metadata and image variants while keeping gallery order and selection by ID", async t => {
  respond(t, Response.json([fromCloud, fromBundle]));
  const photos = await fetchPublicPortfolio();
  assert.deepEqual(photos.map(photo => photo.id), [2, 1]);
  assert.equal(photos[0].title, "Window Light");
  assert.equal(photos[0].altText, "A portrait beside a window");
  assert.equal(photos[0].srcSet, apiPath + "/2/media/320 320w, " + apiPath + "/2/media/640 600w");
  assert.equal(photos[1].altText, null);
  assert.deepEqual(selectPortfolioPhotos(photos, "portraits"), [photos[0]]);
  assert.equal(portfolioPhotoIndex(photos.toReversed(), 2), 1);
  assert.equal(portfolioPhotoIndex([photos[1]], 2), -1);
});

test("an empty published feed is returned as empty", async t => {
  respond(t, Response.json([]));
  assert.deepEqual(await fetchPublicPortfolio(), []);
});

test("API outages are rejected without falling back to bundled photos", async t => {
  respond(t, new Response(null, { status: 503 }));
  await assert.rejects(fetchPublicPortfolio(), /could not load/i);
});

test("admin or signed Cloudinary URLs from a misconfigured endpoint are rejected", async t => {
  respond(t, Response.json([{ ...fromCloud, imageUrl: "https://res.cloudinary.com/s--private--/original" }]));
  await assert.rejects(fetchPublicPortfolio(), /invalid public portfolio photograph/i);
});
