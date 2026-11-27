import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { execPath } from "node:process";
import test from "node:test";

function loadConfig(overrides = {}) {
  const path = new URL("../vercel.js", import.meta.url).href;
  return JSON.parse(execFileSync(execPath, ["--input-type=module", "-e",
    `import { config } from ${JSON.stringify(path)}; console.log(JSON.stringify(config));`],
  { env: overrides, stdio: ["ignore", "pipe", "pipe"] }).toString());
}

test("preserves the SPA rewrite and excludes API and asset paths by default", () => {
  const { rewrites } = loadConfig();
  assert.deepEqual(rewrites, [{
    source: "/((?!api(?:/|$)|assets(?:/|$)).*)",
    destination: "/index.html",
  }]);
});

test("proxies only admin and public portfolio routes and disables caching", () => {
  const origin = "https://backend.example.test";
  const { rewrites, headers } = loadConfig({ RAILWAY_BACKEND_ORIGIN: origin, VITE_ADMIN_ENABLED: "true" });
  const paths = ["/api/admin/:path*", "/api/public/portfolio", "/api/public/portfolio/:id/media/:variant"];
  assert.deepEqual(rewrites.slice(0, -1), paths.map(source => ({ source, destination: origin + source })));
  for (const source of paths) {
    assert.ok(headers.find(entry => entry.source === source).headers
      .some(header => header.key === "Cache-Control" && header.value === "private, no-store"));
  }
  assert.ok(headers.find(entry => entry.source === "/admin/:path*").headers
    .some(header => header.value === "noindex, nofollow"));
});

test("rejects missing proxy origins when either production feature is enabled and rejects unsafe URLs", () => {
  assert.throws(() => loadConfig({ VITE_ADMIN_ENABLED: "true" }), /Set RAILWAY_BACKEND_ORIGIN/);
  assert.throws(() => loadConfig({ VITE_PUBLIC_PORTFOLIO_API: "true" }), /Set RAILWAY_BACKEND_ORIGIN/);
  assert.throws(() => loadConfig({ RAILWAY_BACKEND_ORIGIN: "http://backend.example.test" }), /bare HTTPS origin/);
  assert.throws(() => loadConfig({ RAILWAY_BACKEND_ORIGIN: "https://backend.example.test/api" }), /bare HTTPS origin/);
});

test("uses HTTPS when Vercel supplies a Railway public hostname without a scheme", () => {
  const host = "marinarodriiphoto-production.up.railway.app";
  assert.deepEqual(loadConfig({ RAILWAY_BACKEND_ORIGIN: host }), loadConfig({
    RAILWAY_BACKEND_ORIGIN: `https://${host}`,
  }));
  assert.throws(() => loadConfig({ RAILWAY_BACKEND_ORIGIN: "backend.example.test" }), /bare HTTPS origin/);
});
