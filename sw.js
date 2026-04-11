// 90TC Service Worker — Offline Splash + Cache
const CACHE_NAME = '90tc-v4'
const STATIC = [
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/css/style.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/gamification.js',
  '/js/quotes.js',
  '/manifest.json',
  '/icon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Nur GET, keine Supabase-Requests cachen
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('supabase.co')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Erfolgreiche Response auch in Cache legen
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
