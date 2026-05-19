"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

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

// ─────────────────────────────────────────────────────────────────────────────
// FIX #3 — Accept period param so the hook fetches the right range from server
// ─────────────────────────────────────────────────────────────────────────────
export function useWaterHistory(period: number = 7) {
  const [history, setHistory] = useState<WaterIntakeEntry[]>([])
  const [todayWaterIntake, setTodayWaterIntake] = useState(0)
  const [convexId, setConvexId] = useState<Id<"users"> | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #2 — useQuery always called unconditionally; "skip" handles no-user
  // ─────────────────────────────────────────────────────────────────────────
  const weeklyServerData = useQuery(
    api.waterIntakes.getWeeklyIntakes,
    convexId ? { userId: convexId, days: period } : "skip"
  )

  const todayServerIntakes = useQuery(
    api.waterIntakes.getTodayIntakes,
    convexId ? { userId: convexId } : "skip"
  )

  // Mutations — always at top level (no conditional calls)
  const addWaterMutation    = useMutation(api.waterIntakes.addWaterIntake)
  const deleteIntakeMutation = useMutation(api.waterIntakes.deleteIntake)


  // ── Read convexId from localStorage on mount ─────────────────────────────
  useEffect(() => {
    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          setConvexId(parsed.convexId as Id<"users">)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // ── Merge weekly server data into local history ───────────────────────────
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
          const merged = [
            ...mapped.filter((m) => !existingTs.has(m.timestamp)),
            ...prev,
          ]
          return merged.sort((a, b) => b.timestamp - a.timestamp)
        })
      }
    } catch (e) {
      // ignore
    }
  }, [weeklyServerData])

  // ── Sync today's server intakes & compute authoritative total ────────────
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
    const serverTs = new Set(mapped.map((m) => m.timestamp))

    setHistory((prev) => {
      const pendingLocal = prev.filter(
        (p) => p.date.startsWith(today) && !serverTs.has(p.timestamp)
      )
      const preservedOld = prev.filter((p) => !p.date.startsWith(today))
      const merged = [...mapped, ...pendingLocal, ...preservedOld].sort(
        (a, b) => b.timestamp - a.timestamp
      )

      const serverTotal = mapped
        .filter((m) => m.date.startsWith(today))
        .reduce((s, e) => s + e.amount, 0)
        const pendingTotal = pendingLocal.reduce((s, e) => s + e.amount, 0)
        const todayTotal = serverTotal + pendingTotal

        try {
          localStorage.setItem(
            "todayWaterIntake",
            JSON.stringify({ date: today, amount: todayTotal })
          )
        } catch (e) {
          // ignore
        }

        setTodayWaterIntake(todayTotal)
        return merged
      })
    } catch (e) {
      // ignore
    }
  }, [todayServerIntakes])

  // ── Add water intake ──────────────────────────────────────────────────────
  const addWaterIntake = (amount: number) => {
    const now = new Date()
    const isoDate = now.toISOString()
    const entry: WaterIntakeEntry = {
      id: `local_${now.getTime()}`,
      amount,
      timestamp: now.getTime(),
      date: isoDate,
    }

    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          addWaterMutation({ userId: parsed.convexId as Id<"users">, amount })
            .then((serverId: any) => {
              if (serverId) {
                setHistory((prev) =>
                  prev.map((e) =>
                    e.id === entry.id ? { ...e, id: serverId } : e
                  )
                )
              }
            })
            .catch((err: any) => {
              console.warn("addWaterMutation failed:", err)
            })
        }
      }
    } catch (e) {
      console.warn("Failed to call convex addWaterIntake:", e)
    }

    setTodayWaterIntake((prev) => prev + amount)
    setHistory((prev) => [entry, ...prev])
  }

  // ── Undo last intake ──────────────────────────────────────────────────────
  const undoLastIntake = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const [last, ...rest] = prev
      const today = new Date().toISOString().split("T")[0]
      if (last.date === today) {
        setTodayWaterIntake((t) => Math.max(0, t - last.amount))
      }

      try {
        const currentUser = localStorage.getItem("currentUser")
        if (currentUser) {
          const parsed = JSON.parse(currentUser) as any
          if (
            parsed.convexId &&
            !String(last.id).startsWith("local_")
          ) {
            deleteIntakeMutation({
              intakeId: last.id as Id<"waterIntakes">,
              userId: parsed.convexId as Id<"users">,
            })
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
      setHistory([])
      setTodayWaterIntake(0)

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

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key.startsWith("userProfile_") || key === "currentUser" || key === "registeredUsers")
          continue
        if (
          key.includes("water-") ||
          key.includes("waterHistory") ||
          key.includes("analytics")
        ) {
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
    const todayEntries = history.filter((entry) => entry.date.startsWith(today))
    return {
      totalToday: todayWaterIntake,
      lastIntake:
        todayEntries.length > 0
          ? Math.max(...todayEntries.map((e) => e.timestamp))
          : null,
      intakeCount: todayEntries.length,
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #4 — Accept goalOverride so the dashboard's dailyGoal prop is used
  // ─────────────────────────────────────────────────────────────────────────
  const getDailyStats = (days = 30, goalOverride?: number): DailyStats[] => {
    const dailyGoal = goalOverride ?? 3000
    const stats: { [date: string]: DailyStats } = {}

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

    history.forEach((entry) => {
      // Extract just the date part (YYYY-MM-DD) from entry.date
      // This handles both old "YYYY-MM-DD" format and new ISO strings
      const dateKey = entry.date.split("T")[0]
      if (stats[dateKey]) {
        stats[dateKey].totalIntake += entry.amount
        stats[dateKey].intakeCount += 1
        stats[dateKey].goalReached =
          stats[dateKey].totalIntake >= dailyGoal
      }
    })

    return Object.values(stats).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const getWeeklyStats = (weeks = 4, goalOverride?: number): WeeklyStats[] => {
    const dailyStats = getDailyStats(weeks * 7, goalOverride)
    const weeklyStats: WeeklyStats[] = []

    for (let week = 0; week < weeks; week++) {
      const weekStart = week * 7
      const weekDays = dailyStats.slice(weekStart, weekStart + 7)
      const totalIntake = weekDays.reduce((sum, day) => sum + day.totalIntake, 0)
      const daysGoalReached = weekDays.filter((day) => day.goalReached).length
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

  const getCurrentStreak = (goalOverride?: number): number => {
    const dailyStats = getDailyStats(90, goalOverride)
    if (dailyStats.length === 0) return 0

    let streak = 0
    const today = new Date().toISOString().split("T")[0]
    
    // Check if we should start counting from today or yesterday
    // If today's goal is reached, start from today.
    // If not, but yesterday's goal was reached, start from yesterday (streak is still alive).
    let startIndex = 0
    if (!dailyStats[0].goalReached) {
      if (dailyStats.length > 1 && dailyStats[1].goalReached) {
        startIndex = 1
      } else {
        return 0
      }
    }

    for (let i = startIndex; i < dailyStats.length; i++) {
      if (dailyStats[i].goalReached) {
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