"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface ReminderTimerOptions {
  interval: number // minutes
  onReminder: () => void
  enabled: boolean
}

export function useReminderTimer({ interval, onReminder, enabled }: ReminderTimerOptions) {
  const [timeUntilNext, setTimeUntilNext] = useState<number>(interval * 60) // seconds
  const [isActive, setIsActive] = useState(enabled)
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setTimeUntilNext(interval * 60)
  }, [interval])

  const snooze = useCallback((minutes: number) => {
    setTimeUntilNext(minutes * 60)
    lastActivityRef.current = Date.now()
  }, [])

  const pause = useCallback(() => {
    setIsActive(false)
  }, [])

  const resume = useCallback(() => {
    setIsActive(true)
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    setIsActive(enabled)
  }, [enabled])

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeUntilNext((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          onReminder()
          return interval * 60 // Reset timer
        }
        return newTime
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, interval, onReminder])

  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeUntilNext / 60)
    const seconds = timeUntilNext % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [timeUntilNext])

  return {
    timeUntilNext,
    isActive,
    resetTimer,
    snooze,
    pause,
    resume,
    formatTimeRemaining,
  }
}
