const CACHE = 'bukti-transfer-v1';
const ASSETS = ['/', '/index.html'];

// Install: cache asset utama
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// Fetch: cache-first untuk asset, network-first untuk yang lain
self.addEventListener('fetch', e => {
  // Tangkap POST share target (gambar di-share dari app lain)
  if (e.request.method === 'POST' && e.request.url.includes('/index.html')) {
    e.respondWith(
      (async () => {
        const formData = await e.request.formData();
        const image = formData.get('image');

        // Simpan file ke cache sementara pakai IndexedDB-style via client message
        const client = await self.clients.get(e.clientId) ||
                        (await self.clients.matchAll())[0];

        if (image && client) {
          const arrayBuffer = await image.arrayBuffer();
          client.postMessage({
            type: 'SHARED_IMAGE',
            name: image.name || 'bukti.jpg',
            mimeType: image.type || 'image/jpeg',
            data: arrayBuffer
          }, [arrayBuffer]);
        }

        // Redirect ke halaman utama
        return Response.redirect('/index.html', 303);
      })()
    );
    return;
  }

  // Cache-first untuk asset biasa
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
