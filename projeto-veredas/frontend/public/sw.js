const CACHE_NAME = 'veredas-v1'
const STATIC_ASSETS = [
  '/_next/static/',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([])
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    })
  )
  self.clients.claim()
})

// Fetch: network-first for data, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Static assets: cache-first
  if (STATIC_ASSETS.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return response
        })
      }).catch(() => new Response('Conteúdo indisponível.', { status: 503 }))
    )
    return
  }

  // API/supabase requests: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((response) => {
        const cloned = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        return response
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response(JSON.stringify({ error: 'Sem conexão.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        })
      })
    )
    return
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
