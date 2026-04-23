// Fluxo · Service Worker
// Bumped CACHE_VERSION on each release will trigger an "update available" prompt.
const CACHE_VERSION = "fluxo-v1";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const PRECACHE = `${CACHE_VERSION}-precache`;

const PRECACHE_URLS = ["/", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined)),
  );
  // Do NOT skipWaiting — wait until the user accepts the update prompt.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Listen for the page asking us to activate the new SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Lovable internal or API routes
  if (url.pathname.startsWith("/~") || url.pathname.startsWith("/api/")) return;

  // HTML navigation: network-first, fall back to cached shell when offline
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (
    ["style", "script", "worker", "font", "image"].includes(req.destination) ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })(),
    );
  }
});
