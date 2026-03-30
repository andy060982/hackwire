const CACHE_NAME = 'hackwire-v1'
const OFFLINE_URL = '/offline'

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install — precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return

  // Skip API/analytics calls
  if (
    request.url.includes('google') ||
    request.url.includes('pagead') ||
    request.url.includes('vercel') ||
    request.url.includes('analytics')
  ) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for articles and static assets
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            // Cache article pages and static assets
            if (
              request.url.includes('/news/') ||
              request.url.includes('/podcast') ||
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'image'
            ) {
              cache.put(request, clone)
            }
          })
        }
        return response
      })
      .catch(() => {
        // Offline — try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // If it's a navigation request, show offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('', { status: 503 })
        })
      })
  )
})
