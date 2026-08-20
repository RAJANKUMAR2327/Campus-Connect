self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'CampusConnect', body: event.data?.text() || '' }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/notifications' },
    tag: data.tag || 'campus-connect',
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CampusConnect', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/notifications'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})