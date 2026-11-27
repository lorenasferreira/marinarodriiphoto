import { env } from "node:process";
import { URL } from "node:url";

const rawOrigin = env.RAILWAY_BACKEND_ORIGIN;
const railwayHostname = /^[a-z0-9][a-z0-9-]*\.up\.railway\.app$/i;
let backend = null;
if (rawOrigin) {
  try {
    backend = new URL(railwayHostname.test(rawOrigin) ? `https://${rawOrigin}` : rawOrigin);
  } catch {
    throw new Error("RAILWAY_BACKEND_ORIGIN must be a bare HTTPS origin or a Railway public hostname.");
  }
}
if (backend && (backend.protocol !== "https:" || backend.username || backend.password
    || backend.pathname !== "/" || backend.search || backend.hash || backend.port)) {
  throw new Error("RAILWAY_BACKEND_ORIGIN must be a bare HTTPS origin.");
}
if (!backend && (env.VITE_ADMIN_ENABLED === "true" || env.VITE_PUBLIC_PORTFOLIO_API === "true")) {
  throw new Error("Set RAILWAY_BACKEND_ORIGIN when enabling Admin or the public Portfolio API on Vercel.");
}

const apiPaths = [
  "/api/admin/:path*",
  "/api/public/portfolio",
  "/api/public/portfolio/:id/media/:variant",
];

export const config = {
  rewrites: [
    ...(backend ? apiPaths.map(source => ({ source, destination: backend.origin + source })) : []),
    { source: "/((?!api(?:/|$)|assets(?:/|$)).*)", destination: "/index.html" },
  ],
  headers: [
    { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ...apiPaths.map(source => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "x-vercel-enable-rewrite-caching", value: "0" },
      ],
    })),
  ],
};
