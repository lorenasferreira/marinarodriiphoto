import assert from "node:assert/strict";
import test from "node:test";
import { currentSession, signIn, signOut } from "../src/dev/adminSession.js";

function stubRequests(t, steps) {
  let index = 0;
  t.mock.method(globalThis, "fetch", async (path, options) => {
    const step = steps[index++];
    assert.ok(step, `Unexpected request to ${path}`);
    const [expectedPath, status, payload, inspect] = step;
    assert.equal(path, `/api/admin/${expectedPath}`);
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    inspect?.(options);
    return new Response(payload === undefined ? null : JSON.stringify(payload), { status });
  });
  t.after(() => assert.equal(index, steps.length));
}

const csrf = token => ({ headerName: "X-CSRF-TOKEN", token });
const session = { email: "admin@example.test" };

test("sign-in sends a session-bound CSRF token and verifies the server session", async t => {
  stubRequests(t, [
    ["csrf", 200, csrf("login-token")],
    ["login", 204, undefined, ({ method, headers, body }) => {
      assert.equal(method, "POST");
      assert.equal(headers["X-CSRF-TOKEN"], "login-token");
      assert.equal(body.get("email"), session.email);
      assert.equal(body.get("password"), "test-only-password");
    }],
    ["session", 200, session],
  ]);
  assert.deepEqual(await signIn(session.email, "test-only-password"), session);
});

test("session restoration distinguishes an expired session from an unavailable backend", async t => {
  stubRequests(t, [
    ["session", 200, session],
    ["session", 401],
    ["session", 503],
  ]);
  assert.deepEqual(await currentSession(), session);
  assert.equal(await currentSession(), null);
  await assert.rejects(currentSession(), { status: 503 });
});

test("sign-in explains invalid credentials, CSRF rejection and rate limiting", async t => {
  stubRequests(t, [401, 403, 429].flatMap(status => [
    ["csrf", 200, csrf("login-token")],
    ["login", status],
  ]));
  await assert.rejects(signIn(session.email, "invalid"), /e-mail ou senha incorretos/i);
  await assert.rejects(signIn(session.email, "invalid"), /não foi possível verificar/i);
  await assert.rejects(signIn(session.email, "invalid"), /muitas tentativas/i);
});

test("missing browser session after accepted login is reported", async t => {
  stubRequests(t, [
    ["csrf", 200, csrf("login-token")],
    ["login", 204],
    ["session", 401],
  ]);
  await assert.rejects(signIn(session.email, "test-only-password"), /configurações de cookies/i);
});

test("sign-out requests a fresh CSRF token and posts it without credentials in the body", async t => {
  stubRequests(t, [
    ["csrf", 200, csrf("logout-token")],
    ["logout", 204, undefined, ({ method, headers, body }) => {
      assert.equal(method, "POST");
      assert.equal(headers["X-CSRF-TOKEN"], "logout-token");
      assert.equal(body, undefined);
    }],
    ["session", 401],
  ]);
  await signOut();
  assert.equal(await currentSession(), null);
});
