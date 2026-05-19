"use client"

import { useEffect, useCallback } from "react"
import { useNotifications } from "./use-notifications"

export function useReminder(intervalMinutes: number, enabled: boolean, dailyGoal: number) {
  const { permission, requestPermission, showNotification } = useNotifications()

  const triggerNotification = useCallback(() => {
    if (permission.granted) {
      showNotification("💧 Time to drink water!", {
        body: `Stay hydrated! Your daily goal is ${dailyGoal}ml.`,
        icon: "/icon.png",
      })
      
      // Also try to send message to Service Worker for background handling if tab is hidden
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: "💧 Time to drink water!",
          body: `Stay hydrated! Your daily goal is ${dailyGoal}ml.`
        })
      }
    }
  }, [permission.granted, showNotification, dailyGoal])

  useEffect(() => {
    if (enabled && !permission.granted) {
      requestPermission()
    }
  }, [enabled, permission.granted, requestPermission])

  useEffect(() => {
    if (!enabled) return

    // Initial check
    const intervalId = setInterval(() => {
      triggerNotification()
    }, intervalMinutes * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [enabled, intervalMinutes, triggerNotification])

  return { triggerNotification }
}
