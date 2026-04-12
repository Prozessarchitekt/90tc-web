// 90TC Service Worker — Offline Splash + Cache
const CACHE_NAME = '90tc-v15'
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
  '/og-image.svg',
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

// Domains that must never be cached (APIs, auth, external services)
const BYPASS = ['supabase.co','fatsecret.com','openfoodfacts.org','edamam.com','googleapis.com','gstatic.com','jsdelivr.net','cdn.tailwindcss.com','fonts.','unpkg.com','html5-qrcode']

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (BYPASS.some(d => e.request.url.includes(d))) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
