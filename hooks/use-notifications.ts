"use client"

import { useState, useEffect, useCallback } from "react"

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  })

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const currentPermission = Notification.permission
      setPermission({
        granted: currentPermission === "granted",
        denied: currentPermission === "denied",
        default: currentPermission === "default",
      })
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission({
        granted: result === "granted",
        denied: result === "denied",
        default: result === "default",
      })
      return result === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }, [])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission.granted && typeof window !== "undefined") {
        return new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        })
      }
      return null
    },
    [permission.granted],
  )

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  }
}
