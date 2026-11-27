import assert from "node:assert/strict";
import test from "node:test";
import { loadPortfolioPhotos, metadataForSave, movePhotoIds, reorderPortfolioPhotos, updatePortfolioPhoto, uploadPortfolioPhoto } from "../src/dev/portfolioPhotoApi.js";

const photo = { id: 1, category: "publicity", displayOrder: 0, published: true };
const hidden = { id: 2, category: "publicity", displayOrder: 1, published: false };
const portrait = { id: 3, category: "portraits", displayOrder: 0, published: true };
const photos = [portrait, photo, hidden];
const token = ["csrf", 200, { headerName: "X-CSRF-TOKEN", token: "test-token" }];

function requests(t, steps) {
  let sent = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const [path, status, result, inspect] = steps[sent++];
    assert.equal(url, "/api/admin/" + path);
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    inspect?.(options);
    return new Response(result === undefined ? null : JSON.stringify(result), { status });
  });
  t.after(() => assert.equal(sent, steps.length));
}

function verifyPut(expected) {
  return ({ method, headers, body }) => {
    assert.equal(method, "PUT");
    assert.equal(headers["X-CSRF-TOKEN"], "test-token");
    assert.equal(headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(body), expected);
  };
}

test("authenticated photo loading returns saved rows, including hidden photos", async t => {
  requests(t, [["photos", 200, photos], ["photos", 200, []]]);
  assert.deepEqual(await loadPortfolioPhotos(), photos);
  assert.deepEqual(await loadPortfolioPhotos(), []);
});

test("editing sends only writable fields and appends category moves", async t => {
  const payload = { category: "portraits", title: "Window Light", altText: null, published: false, displayOrder: 1 };
  requests(t, [token, ["photos/1", 200, { ...photo, ...payload }, verifyPut(payload)]]);
  const draft = { category: "portraits", title: " Window Light ", altText: "", published: false };
  const result = await updatePortfolioPhoto(photo.id, metadataForSave(photos, photo, draft));
  assert.deepEqual(await result.json(), { ...photo, ...payload });
});

test("reorder sends every ID in the category, including the hidden row", async t => {
  const ids = movePhotoIds(photos, photo, 1);
  assert.deepEqual(ids, [2, 1]);
  assert.equal(movePhotoIds(photos, photo, -1), null);
  requests(t, [token, ["photo-categories/publicity/order", 200, [], verifyPut({ photoIds: ids })]]);
  await reorderPortfolioPhotos("publicity", ids);
});

test("conflicts and server failures are returned without retrying a write", async t => {
  requests(t, [token, ["photo-categories/publicity/order", 409], ["photos", 503]]);
  await assert.rejects(reorderPortfolioPhotos("publicity", [2, 1]), { status: 409 });
  await assert.rejects(loadPortfolioPhotos(), { status: 503 });
});

test("expired sessions are recognized on reads and when expiry rejects CSRF", async t => {
  requests(t, [["photos", 401], token, ["photos/1", 403], ["session", 401]]);
  await assert.rejects(loadPortfolioPhotos(), { status: 401 });
  await assert.rejects(updatePortfolioPhoto(1, {}), { status: 401 });
});

test("CSRF rejection on a valid session remains forbidden", async t => {
  requests(t, [token, ["photos/1", 403], ["session", 200, { email: "admin@example.test", passwordChangeRequired: false }]]);
  await assert.rejects(updatePortfolioPhoto(1, {}), { status: 403 });
});

test("upload sends the file, category and alt text with session-bound CSRF", async t => {
  const file = new File(["fixture"], "photo.png", { type: "image/png" });
  const created = { id: 4, category: "portraits", published: false, cloudinaryAssetId: "mock-asset" };
  requests(t, [token, ["photos", 201, created, ({ method, headers, body }) => {
    assert.equal(method, "POST");
    assert.equal(headers["X-CSRF-TOKEN"], "test-token");
    assert.equal(headers["Content-Type"], undefined); // fetch adds the multipart boundary.
    assert.equal(body.get("file"), file);
    assert.equal(body.get("category"), "portraits");
    assert.equal(body.get("altText"), "A portrait");
    assert.equal(body.get("title"), "Window Light");
    assert.equal(body.has("published"), false);
  }]]);
  assert.deepEqual(await (await uploadPortfolioPhoto(file, { category: "portraits", title: " Window Light ", altText: "A portrait" })).json(), created);
});

test("upload preserves provider and database errors without retrying", async t => {
  const file = new File(["fixture"], "photo.png", { type: "image/png" });
  const responses = [
    [502, "Could not confirm the Cloudinary upload. Reference: mock-upload"],
    [503, "Could not confirm the database save. Reference: mock-save"],
    [413, "The upload exceeds the configured file or request size limit."],
  ];
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (++requestCount % 2 === 1) {
      assert.equal(url, "/api/admin/csrf");
      return Response.json(token[2]);
    }
    assert.equal(url, "/api/admin/photos");
    assert.equal(options.method, "POST");
    const [status, detail] = responses[requestCount / 2 - 1];
    return Response.json({ status, detail }, { status, headers: { "Content-Type": "application/problem+json" } });
  });
  for (const [status, message] of responses) {
    await assert.rejects(uploadPortfolioPhoto(file, { category: "portraits" }), { status, message });
  }
  assert.equal(requestCount, 6);
});

test("upload identifies a session lost between CSRF and multipart submission", async t => {
  requests(t, [token, ["photos", 403], ["session", 401]]);
  await assert.rejects(uploadPortfolioPhoto(new File(["fixture"], "photo.png"), { category: "portraits" }), { status: 401 });
});

test("clearing the title sends null, and untitled uploads omit the title field", async t => {
  const metadata = metadataForSave(photos, photo, { category: "publicity", title: "  ", altText: "A dancer by a window", published: true });
  assert.equal(metadata.title, null);
  assert.equal(metadata.altText, "A dancer by a window");
  requests(t, [token, ["photos", 201, { id: 4, title: null }, ({ body }) => {
    assert.equal(body.has("title"), false);
  }]]);
  await uploadPortfolioPhoto(new File(["fixture"], "DSC_0042.jpg"), { category: "publicity", title: "  " });
});
