import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

// Ensure the TypeScript compiler understands the service worker scope
declare const self: ServiceWorkerGlobalScope;

type ResolveApiUrl = () => URL;

const resolveApiUrl: ResolveApiUrl = () => {
  const defaultOrigin = self.location.origin;
  const fallback = `${defaultOrigin}/api`;
  const raw = (import.meta.env.VITE_API_URL as string | undefined) || fallback;

  try {
    return new URL(raw);
  } catch {
    return new URL(raw, defaultOrigin);
  }
};

const apiUrl = resolveApiUrl();
const apiOrigin = apiUrl.origin;
const apiPathname = apiUrl.pathname.replace(/\/$/, "");
const apiPrefix = apiPathname === "" ? "/api/" : `${apiPathname}/`;

clientsClaim();
self.skipWaiting();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request, url }) => {
    return (
      request.method === "GET" &&
      url.origin === apiOrigin &&
      (url.pathname === apiPathname || url.pathname.startsWith(apiPrefix))
    );
  },
  new NetworkFirst({
    cacheName: "ledger-api-cache-v1",
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "ledger-image-cache-v1",
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => {
    const isStaticDestination = ["style", "script", "font"].includes(
      request.destination,
    );

    return request.method === "GET" && isStaticDestination && url.origin === self.location.origin;
  },
  new CacheFirst({
    cacheName: "ledger-static-assets-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

export {};
