// Tomo - Service Worker
const CACHE = 'tomo-v1'

// インストール時: すぐにアクティブ化
self.addEventListener('install', () => self.skipWaiting())

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// フェッチ: ネットワーク優先、失敗時はキャッシュから返す
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // chrome-extension や非HTTPリクエストは無視
  if (!e.request.url.startsWith('http')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
