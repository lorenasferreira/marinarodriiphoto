import { portfolioImages, portfolioTypes } from "../Category/portfolioData.js";

const assetPrefix = "/assets/images/portfolio/";
const thumbnailPrefix = "/assets/images/portfolio-thumbnails/";
const assetPattern = /^\/assets\/images\/portfolio\/(publicity|events-bts|editorial-artistic|portraits)\/[\w-]+\.[A-Za-z0-9]+$/;
const widths = [320, 640, 960, 1440, 1920];

export const bundledPhotos = portfolioTypes.flatMap(category => portfolioImages[category].map(image => {
  const path = category + "/" + image.file;
  const src = assetPrefix + path;
  return { ...image, category, id: src, src, thumbnail: thumbnailPrefix + path + ".jpg" };
}));

export function selectPortfolioPhotos(photos, category) {
  return category === "all" ? photos : photos.filter(photo => photo.category === category);
}

export function portfolioPhotoIndex(photos, id) {
  return photos.findIndex(photo => photo.id === id);
}

export async function fetchPublicPortfolio(signal) {
  const response = await fetch("/api/public/portfolio", { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error("Could not load the public Portfolio.");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid public Portfolio response.");
  const ids = new Set();
  return rows.map(row => {
    if (!row || !positiveInteger(row.id) || !positiveInteger(row.width) || !positiveInteger(row.height)
      || ids.has(row.id) || !portfolioTypes.includes(row.category)
      || !Array.isArray(row.sources) || !safeUrls(row)) {
      throw new Error("Invalid public Portfolio photograph.");
    }
    ids.add(row.id);
    return {
      id: row.id,
      category: row.category,
      width: row.width,
      height: row.height,
      title: typeof row.title === "string" ? row.title : null,
      altText: typeof row.altText === "string" ? row.altText : null,
      src: row.imageUrl,
      thumbnail: row.thumbnailUrl,
      srcSet: row.sources.length ? row.sources.map(source => `${source.url} ${source.width}w`).join(", ") : undefined,
    };
  });
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function safeUrls(row) {
  if (typeof row.imageUrl !== "string" || typeof row.thumbnailUrl !== "string") return false;
  if (assetPattern.test(row.imageUrl)) {
    return row.thumbnailUrl === thumbnailPrefix + row.imageUrl.slice(assetPrefix.length) + ".jpg"
      && row.sources.length === 0;
  }
  const base = `/api/public/portfolio/${row.id}/media/`;
  return row.imageUrl === base + "1920" && row.thumbnailUrl === base + "320"
    && row.sources.every(source => source && positiveInteger(source.width)
      && widths.some(variant => source.width === Math.min(row.width, variant) && source.url === base + variant));
}
