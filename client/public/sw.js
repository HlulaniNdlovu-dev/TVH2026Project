// Minimal service worker: it exists so the browser offers "Install app".
// It deliberately caches nothing, so users always see live outage data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
