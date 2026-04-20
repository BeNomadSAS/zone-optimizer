/**
 * Service Worker — cache-first pour les tuiles PMTiles.
 *
 * PMTiles fait des fetch() avec Range headers sur la meme URL.
 * Le cache navigateur ne gere pas bien les 206 (surtout Chrome/Windows).
 * Ce SW intercepte les requetes, cree une cle de cache unique par range,
 * et sert depuis le Cache API avec une strategie cache-first.
 *
 * Gotchas geres :
 * - Cache API ne matche que par URL → on encode le Range en query param
 * - Chrome peut rejeter cache.put() sur des 206 → on stocke en 200
 * - PMTiles utilise cache:"reload" quand l'ETag change → on bypass le cache
 * - Les reponses 416 (range invalide) ne doivent pas etre cachees
 * - Content-Length doit correspondre au body reel (pas la taille totale du fichier)
 */

const CACHE_NAME = 'bemap-tiles-v1';
const MAX_CACHE_SIZE = 2000; // max entries avant eviction LRU
const TILE_URL_PATTERN = /chatalone\.fr\/.+\.pmtiles/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n.startsWith('bemap-tiles-') && n !== CACHE_NAME)
          .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Build a cache key that includes the Range.
 * Cache API matches by URL only, so we encode the range as a query param.
 */
function cacheKeyFor(request) {
  const range = request.headers.get('Range') || '';
  const url = new URL(request.url);
  if (range) url.searchParams.set('_range', range);
  return new Request(url.toString(), { method: 'GET' });
}

/**
 * Evict oldest entries when cache gets too large.
 */
async function evictIfNeeded(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_SIZE) {
    const toDelete = keys.length - MAX_CACHE_SIZE + 200;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept PMTiles range requests
  if (!TILE_URL_PATTERN.test(request.url)) return;
  if (!request.headers.has('Range')) return;

  // PMTiles uses cache:"reload" when ETag changes → bypass our cache
  if (request.cache === 'reload') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = cacheKeyFor(request);

    // Cache-first: check cache
    const cached = await cache.match(key);
    if (cached) {
      // Restore 206 status — pmtiles.js needs it
      const body = await cached.arrayBuffer();
      const headers = new Headers(cached.headers);
      // Ensure Content-Length matches actual body size
      headers.set('Content-Length', String(body.byteLength));
      return new Response(body, { status: 206, headers });
    }

    // Cache miss: fetch from network
    const response = await fetch(request);

    // Only cache 206 responses (skip 416, 4xx, 5xx)
    if (response.status === 206) {
      const body = await response.arrayBuffer();

      const cacheHeaders = new Headers(response.headers);
      cacheHeaders.set('X-SW-Cached', 'true');
      cacheHeaders.set('X-SW-Original-Status', '206');
      // Ensure Content-Length matches the slice, not the total file
      cacheHeaders.set('Content-Length', String(body.byteLength));

      // Store as 200 — Cache API can reject 206 on some browsers
      const toStore = new Response(body.slice(0), {
        status: 200,
        headers: cacheHeaders
      });
      cache.put(key, toStore); // fire-and-forget

      // Evict in background (non-blocking)
      evictIfNeeded(cache);

      // Return 206 to the client with original headers
      return new Response(body, {
        status: 206,
        headers: response.headers
      });
    }

    return response;
  })());
});

// ── API for the main page ──

self.addEventListener('message', async (event) => {
  if (event.data?.type === 'CACHE_STATS') {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalSize = 0;
    for (const key of keys) {
      const resp = await cache.match(key);
      const cl = resp?.headers.get('Content-Length');
      if (cl) totalSize += parseInt(cl);
    }
    event.source.postMessage({
      type: 'CACHE_STATS_RESULT',
      entries: keys.length,
      bytes: totalSize
    });
  }

  if (event.data?.type === 'CACHE_CLEAR') {
    await caches.delete(CACHE_NAME);
    event.source.postMessage({ type: 'CACHE_CLEARED' });
  }
});
