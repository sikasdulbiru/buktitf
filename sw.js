const CACHE = 'bukti-transfer-v2';
const ASSETS = ['/buktitf/', '/buktitf/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Tangkap POST dari Web Share Target (gambar di-share dari app lain)
  if (e.request.method === 'POST') {
    e.respondWith(
      (async () => {
        const formData = await e.request.formData();
        const image = formData.get('image');

        if (image) {
          const arrayBuffer = await image.arrayBuffer();
          // Kirim ke semua client yang aktif
          const clients = await self.clients.matchAll({ type: 'window' });
          for (const client of clients) {
            client.postMessage({
              type: 'SHARED_IMAGE',
              name: image.name || 'bukti.jpg',
              mimeType: image.type || 'image/jpeg',
              data: arrayBuffer
            }, [arrayBuffer]);
          }
        }

        return Response.redirect('/buktitf/index.html', 303);
      })()
    );
    return;
  }

  // Cache-first untuk GET
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
