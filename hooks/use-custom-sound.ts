"use client"

import { useState, useEffect, useCallback } from "react"

export function useCustomSound() {
  const [customSoundUrl, setCustomSoundUrl] = useState<string | null>(null)

  // Load saved sound from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("water-reminder-custom-sound")
      if (savedSound) {
        setCustomSoundUrl(savedSound)
      }
    }
  }, [])

  // Listen for cross-window/component sound updates (dispatched when a sound is changed)
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (e: any) => {
      try {
        setCustomSoundUrl(e?.detail ?? null)
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("water-reminder-sound-changed", handler)
    return () => window.removeEventListener("water-reminder-sound-changed", handler)
  }, [])

  // Save sound to localStorage when it changes
  const updateCustomSound = useCallback((soundUrl: string | null) => {
    setCustomSoundUrl(soundUrl)
    if (typeof window !== "undefined") {
      if (soundUrl) {
        localStorage.setItem("water-reminder-custom-sound", soundUrl)
        try {
          window.dispatchEvent(new CustomEvent("water-reminder-sound-changed", { detail: soundUrl }))
        } catch (e) {
          // ignore
        }
      } else {
        localStorage.removeItem("water-reminder-custom-sound")
        try {
          window.dispatchEvent(new CustomEvent("water-reminder-sound-changed", { detail: null }))
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  // Play the custom sound or fallback to default
  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return

    if (customSoundUrl) {
      // Play custom uploaded sound
      const audio = new Audio(customSoundUrl)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.error("Error playing custom sound:", error)
        // Fallback to default sound if custom sound fails
        playDefaultSound()
      })
    } else {
      // Play default Web Audio API sound
      playDefaultSound()
    }
  }, [customSoundUrl])

  const playDefaultSound = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error("Error playing default sound:", error)
    }
  }, [])

  return {
    customSoundUrl,
    updateCustomSound,
    playNotificationSound,
  }
}
