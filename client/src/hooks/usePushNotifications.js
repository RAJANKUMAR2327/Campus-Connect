import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(true)

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscribed(!!subscription)
    } catch {
      // subscription check failed — leave `subscribed` at its default
    }
  }

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false)
      return
    }
    checkSubscription()
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied')
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const { data } = await api.get('/push/vapid-key')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey) })

      const subJSON = subscription.toJSON()
      await api.post('/push/subscribe', {
        endpoint: subJSON.endpoint,
        keys: subJSON.keys,
        deviceInfo: navigator.userAgent })

      setSubscribed(true)
      toast.success('Push notifications enabled!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await api.post('/push/unsubscribe', { endpoint: subscription.endpoint })
        await subscription.unsubscribe()
      }

      setSubscribed(false)
      toast.success('Push notifications disabled')
    } catch {
      toast.error('Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  return { permission, subscribed, loading, supported, subscribe, unsubscribe }
}