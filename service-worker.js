const CACHE_NAME = "editor-taurus-v12";
const ASSETS = [
  "./index.html",
  "./css/main.css",
  "./js/app.js",
  "./js/db.js",
  "./js/ui.js",
  "./js/utils.js",
  "./js/editorCore.js",
  "./js/documents.js",
  "./js/tabs.js",
  "./js/autocomplete.js",
  "./js/tasks.js",
  "./js/shortcuts.js",
  "./js/theme.js",
  "./icon.png",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
