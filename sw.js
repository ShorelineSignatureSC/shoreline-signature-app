/* Shoreline PWA: network-first, privacy-conscious service worker.
   Never store portal screens, account data, payment pages, or API responses. */
const CACHE = "shoreline-public-shell-v1";
const PUBLIC_OFFLINE = "/offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([PUBLIC_OFFLINE, "/icons/icon-192.png"])));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("shoreline-") && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/portal") || url.pathname.startsWith("/.netlify") || url.pathname.startsWith("/api")) return;
  event.respondWith(fetch(req).catch(() => caches.match(PUBLIC_OFFLINE)));
});
