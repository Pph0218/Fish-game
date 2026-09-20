const CACHE_NAME = "tide-fishery-v20260920-21";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260920-21",
  "./assets/fish/sprites-data.js?v=20260920-21",
  "./assets/fish/custom-manifest.js?v=20260920-21",
  "./fish-art.js?v=20260920-21",
  "./spriteFish.js?v=20260920-21",
  "./leaderboard-config.js?v=20260920-21",
  "./leaderboard.js?v=20260920-21",
  "./audio.js?v=20260920-21",
  "./app.js?v=20260920-21",
  "./ocean3d.js?v=20260920-21",
  "./vendor/three/three.global.js",
  "./vendor/three/GLTFLoader.global.js",
  "./manifest.webmanifest",
  "./version.json"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});