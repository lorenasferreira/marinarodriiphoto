import { currentSession, request, writeWithCsrf } from "./adminSession.js";

export async function loadPortfolioPhotos(signal) {
  const response = await request("photos", { signal });
  const photos = await response.json();
  if (!Array.isArray(photos)) throw new Error("O servidor retornou uma lista de fotos inválida.");
  return photos;
}

async function save(path, method, options, signal) {
  try {
    return await writeWithCsrf(path, method, { ...options, signal });
  } catch (error) {
    // An expired session can invalidate its CSRF token before authorization runs.
    if (error.status === 403 && !await currentSession(signal)) {
      throw Object.assign(new Error("Sua sessão terminou.", { cause: error }), { status: 401 });
    }
    throw error;
  }
}

function putJson(path, data, signal) {
  return save(path, "PUT", {
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  }, signal);
}

export function updatePortfolioPhoto(id, metadata, signal) {
  return putJson(`photos/${id}`, metadata, signal);
}

export function reorderPortfolioPhotos(category, photoIds, signal) {
  return putJson(`photo-categories/${encodeURIComponent(category)}/order`, { photoIds }, signal);
}

export function uploadPortfolioPhoto(file, { category, title, altText }, signal) {
  const body = new FormData();
  body.append("file", file);
  body.append("category", category);
  if (altText) body.append("altText", altText);
  if (title?.trim()) body.append("title", title.trim());
  return save("photos", "POST", { body }, signal);
}

export function categoryPhotos(photos, category) {
  return photos.filter(photo => photo.category === category)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

export function metadataForSave(photos, photo, draft) {
  const destination = categoryPhotos(photos, draft.category);
  return {
    category: draft.category,
    title: draft.title.trim() || null,
    altText: draft.altText || null,
    published: draft.published,
    displayOrder: draft.category === photo.category
      ? destination.findIndex(item => item.id === photo.id)
      : destination.length,
  };
}

export function movePhotoIds(photos, photo, direction) {
  const ids = categoryPhotos(photos, photo.category).map(item => item.id);
  const index = ids.indexOf(photo.id);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= ids.length) return null;
  [ids[index], ids[destination]] = [ids[destination], ids[index]];
  return ids;
}
