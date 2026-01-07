"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export interface WaterIntakeEntry {
  id: string
  amount: number
  timestamp: number
  date: string // YYYY-MM-DD
}

export interface DailyStats {
  date: string
  totalIntake: number
  goalReached: boolean
  intakeCount: number
  goal: number
}

export interface WeeklyStats {
  week: string
  averageIntake: number
  daysGoalReached: number
  totalDays: number
  totalIntake: number
}

export function useWaterHistory() {
  const [history, setHistory] = useState<WaterIntakeEntry[]>([])
  const [todayWaterIntake, setTodayWaterIntake] = useState(0)
  

  // Convex query for weekly intakes — we need a convex user id to run it
  const [convexId, setConvexId] = useState<string | null>(null)
  const weeklyQueryRef = convexId ? (api as any)?.waterIntakes?.getWeeklyIntakes ?? null : null
  const weeklyServerData = weeklyQueryRef ? useQuery(weeklyQueryRef as any, { userId: convexId }) : null

  // Subscribe specifically to today's intakes on the server so we use authoritative daily totals
  const todayQueryRef = convexId ? (api as any)?.waterIntakes?.getTodayIntakes ?? null : null
  const todayServerIntakes = todayQueryRef ? useQuery(todayQueryRef as any, { userId: convexId }) : null

  // Mutations for server add and delete
  const addWaterRef = (api as any)?.waterIntakes?.addWaterIntake ?? null
  const addWaterMutation = useMutation(addWaterRef as any)
  const deleteIntakeRef = (api as any)?.waterIntakes?.deleteIntake ?? null
  const deleteIntakeMutation = useMutation(deleteIntakeRef as any)
  // Load data from localStorage on mount
  useEffect(() => {
  const loadPersistedData = () => {
      try {
        // Load history from localStorage
        const savedHistory = localStorage.getItem("waterHistory")
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory)
          setHistory(parsedHistory)
        }

        // Load today's water intake from localStorage as fallback until server data arrives
        const savedTodayIntake = localStorage.getItem("todayWaterIntake")
        if (savedTodayIntake) {
          const parsedIntake = JSON.parse(savedTodayIntake)
          const today = new Date().toISOString().split("T")[0]

          // Check if the saved data is from today
          if (parsedIntake.date === today) {
            setTodayWaterIntake(parsedIntake.amount)
          } else {
            // Reset to 0 for new day locally; server data will correct if available
            setTodayWaterIntake(0)
            localStorage.setItem("todayWaterIntake", JSON.stringify({ date: today, amount: 0 }))
          }
        }
      } catch (error) {
        console.error("Error loading water history:", error)
      }
    }

    loadPersistedData()
  }, [])

  // Read currentUser convexId on mount and subscribe to server data
  useEffect(() => {
    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          setConvexId(parsed.convexId)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // When server weekly data arrives, merge it into local history (keep historical)
  useEffect(() => {
    try {
      const serverArray = Array.isArray(weeklyServerData) ? weeklyServerData : []
      if (serverArray.length > 0) {
        const mapped = serverArray.map((d: any) => ({
          id: d._id || `${d.timestamp}`,
          amount: d.amount,
          timestamp: d.timestamp,
          date: d.date,
        }))

        setHistory((prev) => {
          const existingTs = new Set(prev.map((p) => p.timestamp))
          const merged = [...mapped.filter((m) => !existingTs.has(m.timestamp)), ...prev]
          return merged.sort((a, b) => b.timestamp - a.timestamp)
        })
      }
    } catch (e) {
      // ignore
    }
  }, [weeklyServerData])

  // When today's server intakes arrive, overwrite today's portion of history and authoritative today total
  useEffect(() => {
    try {
      const serverToday = Array.isArray(todayServerIntakes) ? todayServerIntakes : []
      const mapped = serverToday.map((d: any) => ({
        id: d._id || `${d.timestamp}`,
        amount: d.amount,
        timestamp: d.timestamp,
        date: d.date,
      }))

      const today = new Date().toISOString().split("T")[0]
      // Build a set of server timestamps to avoid duplicates
      const serverTs = new Set(mapped.map((m) => m.timestamp))

      setHistory((prev) => {
        // Keep local entries that are not represented on server (pending/offline local entries)
        const pendingLocal = prev.filter((p) => p.date === today && !serverTs.has(p.timestamp))

        // Remove any local entries that the server already has for today
        const preservedOld = prev.filter((p) => p.date !== today)

        const merged = [...mapped, ...pendingLocal, ...preservedOld].sort((a, b) => b.timestamp - a.timestamp)

        // Now that we have merged entries, compute totals
        const serverTotal = mapped.filter((m) => m.date === today).reduce((s, e) => s + e.amount, 0)
        const pendingTotal = pendingLocal.reduce((s, e) => s + e.amount, 0)
        const todayTotal = serverTotal + pendingTotal

        // Persist authoritative today to localStorage (server + pending)
        try {
          localStorage.setItem("todayWaterIntake", JSON.stringify({ date: today, amount: todayTotal }))
        } catch (e) {
          // ignore
        }

        // Update the todayWaterIntake state after merging
        setTodayWaterIntake(todayTotal)

        return merged
      })
    } catch (e) {
      // ignore
    }
  }, [todayServerIntakes])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("waterHistory", JSON.stringify(history))
    } catch (error) {
      console.error("Error saving water history:", error)
    }
  }, [history])

  useEffect(() => {
    try {
      const today = new Date().toISOString().split("T")[0]
      localStorage.setItem("todayWaterIntake", JSON.stringify({ date: today, amount: todayWaterIntake }))
    } catch (error) {
      console.error("Error saving today's water intake:", error)
    }
  }, [todayWaterIntake])

  const addWaterIntake = (amount: number) => {
    const now = new Date()
    const entry: WaterIntakeEntry = {
  id: `local_${now.getTime()}`,
      amount,
      timestamp: now.getTime(),
      date: now.toISOString().split("T")[0],
    }

    // If a Convex user id is available in currentUser, persist server-side and use server id
    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId && addWaterMutation) {
          // Call convex mutation and, if it returns an id, reconcile the local entry id
          addWaterMutation({ userId: parsed.convexId, amount }).then((serverId: any) => {
            if (serverId) {
              setHistory((prev) => prev.map((e) => (e.id === entry.id ? { ...e, id: serverId } : e)))
            }
          }).catch((err: any) => {
            // ignore network errors; local state remains until server syncs later
            console.warn("addWaterMutation failed:", err)
          })
        }
      }
    } catch (e) {
      console.warn("Failed to call convex addWaterIntake:", e)
    }

    // Update today's total locally
    setTodayWaterIntake(prev => prev + amount)
    // Add to history
    setHistory((prev) => [entry, ...prev])
  }

  const undoLastIntake = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const [last, ...rest] = prev
      // Adjust today's intake if the last entry was today
      const today = new Date().toISOString().split("T")[0]
      if (last.date === today) {
        setTodayWaterIntake((t) => Math.max(0, t - last.amount))
      }

      // If the last entry is persisted on the server (non-local id), try to delete it
      try {
        const currentUser = localStorage.getItem("currentUser")
        if (currentUser) {
          const parsed = JSON.parse(currentUser) as any
          if (parsed.convexId && deleteIntakeMutation && !String(last.id).startsWith("local_")) {
            deleteIntakeMutation({ intakeId: last.id, userId: parsed.convexId })
          }
        }
      } catch (e) {
        // ignore
      }

      return rest
    })
  }

  const resetTodayIntake = () => {
    setTodayWaterIntake(0)
  }

  const resetAllData = () => {
    try {
      // Clear in-memory state
      setHistory([])
      setTodayWaterIntake(0)

      // Remove known app keys but preserve user profile and auth info
      const keysToRemove = [
        "waterHistory",
        "todayWaterIntake",
  "achievements",
        "userStats",
        "analyticsEvents",
        "recentActivity",
  "water-reminder-custom-sound",
      ]

      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k)
        } catch (e) {
          // ignore
        }
      })

      // Also remove any legacy keys that start with known prefixes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        if (["waterHistory", "todayWaterIntake"].includes(key)) continue
        // don't remove userProfile_ or currentUser
        if (key.startsWith("userProfile_") || key === "currentUser" || key === "registeredUsers") continue
        // remove keys that look like app runtime tracking
        if (key.includes("water-") || key.includes("waterHistory") || key.includes("analytics")) {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn("Failed to reset all data:", e)
    }
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0]
    const todayEntries = history.filter(entry => entry.date === today)
    
    return {
      totalToday: todayWaterIntake,
      lastIntake: todayEntries.length > 0 ? Math.max(...todayEntries.map(e => e.timestamp)) : null,
      intakeCount: todayEntries.length
    }
  }

  const getDailyStats = (days = 30): DailyStats[] => {
    const dailyGoal = 3000 // This should come from user profile
    const stats: { [date: string]: DailyStats } = {}

    // Initialize with empty days
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      stats[dateStr] = {
        date: dateStr,
        totalIntake: 0,
        goalReached: false,
        intakeCount: 0,
        goal: dailyGoal,
      }
    }

    // Aggregate history data
    history.forEach((entry) => {
      if (stats[entry.date]) {
        stats[entry.date].totalIntake += entry.amount
        stats[entry.date].intakeCount += 1
        stats[entry.date].goalReached = stats[entry.date].totalIntake >= dailyGoal
      }
    })

    return Object.values(stats).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getWeeklyStats = (weeks = 4): WeeklyStats[] => {
    const dailyStats = getDailyStats(weeks * 7)
    const weeklyStats: WeeklyStats[] = []

    for (let week = 0; week < weeks; week++) {
      const weekStart = week * 7
      const weekDays = dailyStats.slice(weekStart, weekStart + 7)
      
      const totalIntake = weekDays.reduce((sum, day) => sum + day.totalIntake, 0)
      const daysGoalReached = weekDays.filter(day => day.goalReached).length
      const averageIntake = Math.round(totalIntake / weekDays.length)

      weeklyStats.push({
        week: `Week ${week + 1}`,
        averageIntake,
        daysGoalReached,
        totalDays: weekDays.length,
        totalIntake,
      })
    }

    return weeklyStats
  }

  const getCurrentStreak = (): number => {
    const dailyStats = getDailyStats(30)
    let streak = 0

    for (const day of dailyStats) {
      if (day.goalReached) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  return {
    history,
    todayWaterIntake,
    addWaterIntake,
  undoLastIntake,
    resetTodayIntake,
    getTodayStats,
    getDailyStats,
    getWeeklyStats,
    getCurrentStreak,
  resetAllData,
  }
}
