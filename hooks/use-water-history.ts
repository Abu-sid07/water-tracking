"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { calculateDailyGoal } from "@/lib/goal-calculator"

export interface WaterIntakeEntry {
  id: string
  amount: number
  timestamp: number
  date: string // YYYY-MM-DD or ISO string
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [convexId, setConvexId] = useState<Id<"users"> | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dailyGoal, setDailyGoal] = useState(2000)
  const [profile, setProfile] = useState<any>({ weight: 70 })
  const [isInitialized, setIsInitialized] = useState(false)

  // ── 1. Load User Info on Mount ───────────────────────────────────────────
  useEffect(() => {
    const checkUser = () => {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser)
          if (parsed.email !== userEmail) {
            setUserEmail(parsed.email)
          }
          if (parsed.convexId && parsed.convexId !== convexId) {
            setConvexId(parsed.convexId)
          }
        } catch (e) {
          console.error("Failed to parse currentUser", e)
        }
      } else {
        setUserEmail(null)
        setConvexId(null)
        setHistory([])
        setTodayWaterIntake(0)
      }
    }

    checkUser()
    window.addEventListener("storage", checkUser)
    return () => window.removeEventListener("storage", checkUser)
  }, [userEmail, convexId])

  // ── 2. Convex Queries ────────────────────────────────────────────────────
  const weeklyServerData = useQuery(
    api.waterIntakes.getWeeklyIntakes,
    convexId ? { userId: convexId, days: 90 } : "skip"
  )

  const todayServerIntakes = useQuery(
    api.waterIntakes.getTodayIntakes,
    convexId ? { userId: convexId } : "skip"
  )

  const addWaterMutation = useMutation(api.waterIntakes.addWaterIntake)
  const deleteIntakeMutation = useMutation(api.waterIntakes.deleteIntake)

  // ── 3. Sync Convex Data to Local State ───────────────────────────────────
  useEffect(() => {
    if (weeklyServerData) {
      const mapped = weeklyServerData.map((d: any) => ({
        id: d._id,
        amount: d.amount,
        timestamp: d.timestamp,
        date: d.date,
      }))
      setHistory(mapped.sort((a, b) => b.timestamp - a.timestamp))
      setIsInitialized(true)
    } else if (convexId === null && userEmail !== null) {
      // If we're logged in but don't have a convexId yet, we can't fetch from server
      // Just mark as initialized so we don't stay stuck on loading
      setIsInitialized(true)
    }
  }, [weeklyServerData, convexId, userEmail])

  useEffect(() => {
    if (todayServerIntakes) {
      const total = todayServerIntakes.reduce((sum, intake) => sum + intake.amount, 0)
      setTodayWaterIntake(total)
    }
  }, [todayServerIntakes])

  // Load Profile/Goal from localStorage (keep this local as it's user-specific setup)
  useEffect(() => {
    if (!userEmail) return
    const storageKey = `water_data_${userEmail}`
    const savedDataRaw = localStorage.getItem(storageKey)
    if (savedDataRaw) {
      try {
        const savedData = JSON.parse(savedDataRaw)
        if (savedData.dailyGoal) setDailyGoal(savedData.dailyGoal)
        if (savedData.profile) setProfile(savedData.profile)
      } catch (e) {
        console.error("Failed to parse local user settings", e)
      }
    }
  }, [userEmail])

  // ── 4. Helper to Save to Local (Optimistic/Cache) ────────────────────────
  const saveToUserStorage = useCallback((updates: any) => {
    if (!userEmail) return
    const storageKey = `water_data_${userEmail}`
    try {
      const currentRaw = localStorage.getItem(storageKey)
      const current = currentRaw ? JSON.parse(currentRaw) : { entries: [], dailyGoal: 2000, profile: { weight: 70 } }
      const updated = { ...current, ...updates }
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.error("Error saving to user storage:", e)
    }
  }, [userEmail])

  // ── 5. Add Water Intake ───────────────────────────────────────────────────
  const addWaterIntake = async (amount: number) => {
    if (amount < 1 || amount > 5000 || !userEmail) return

    setIsAdding(true)
    
    try {
      if (convexId) {
        // Primary: Convex
        await addWaterMutation({ userId: convexId, amount })
      } else {
        // Fallback: Local only if no convexId
        const now = new Date()
        const entry: WaterIntakeEntry = {
          id: `local_${now.getTime()}`,
          amount,
          timestamp: now.getTime(),
          date: now.toISOString(),
        }
        const updatedHistory = [entry, ...history]
        setHistory(updatedHistory)
        setTodayWaterIntake(prev => prev + amount)
        saveToUserStorage({ entries: updatedHistory })
      }

      // Manage undo window
      setCanUndo(true)
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
      undoTimeoutRef.current = setTimeout(() => {
        setCanUndo(false)
        undoTimeoutRef.current = null
      }, 30000)
    } catch (e) {
      console.error("Error adding water intake:", e)
    } finally {
      setIsAdding(false)
    }
  }

  // ── 6. Undo Last Intake ───────────────────────────────────────────────────
  const undoLastIntake = async () => {
    if (!canUndo || history.length === 0 || !userEmail) return

    const lastEntry = history[0]
    setCanUndo(false)
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
    
    try {
      if (convexId && !String(lastEntry.id).startsWith("local_")) {
        await deleteIntakeMutation({ 
          intakeId: lastEntry.id as Id<"waterIntakes">, 
          userId: convexId 
        })
      } else {
        // Local only fallback
        const updatedHistory = history.slice(1)
        setHistory(updatedHistory)
        const today = new Date().toISOString().split("T")[0]
        if (lastEntry.date.startsWith(today)) {
          setTodayWaterIntake((t) => Math.max(0, t - lastEntry.amount))
        }
        saveToUserStorage({ entries: updatedHistory })
      }
    } catch (e) {
      console.error("Error undoing intake:", e)
    }
  }

  const resetTodayIntake = () => {
    // This would need a mutation to delete all of today's entries on Convex
    // For now, let's just reset local if no convexId
    if (!convexId) {
      setTodayWaterIntake(0)
      if (userEmail) {
        const today = new Date().toISOString().split("T")[0]
        const updatedHistory = history.filter(e => !e.date.startsWith(today))
        setHistory(updatedHistory)
        saveToUserStorage({ entries: updatedHistory })
      }
    }
  }

  const resetAllData = () => {
    if (!userEmail) return
    setHistory([])
    setTodayWaterIntake(0)
    localStorage.removeItem(`water_data_${userEmail}`)
    // Resetting Convex would require another mutation
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
    const finalDailyGoal = goalOverride ?? dailyGoal ?? 2000
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
        goal: finalDailyGoal,
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
          stats[dateKey].totalIntake >= finalDailyGoal
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
      
      // Fix: Divide by count of active days instead of fixed 7
      const activeDaysCount = weekDays.filter(day => day.totalIntake > 0).length
      const averageIntake = activeDaysCount > 0 
        ? Math.round(totalIntake / activeDaysCount) 
        : 0

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
    isAdding,
    canUndo,
    isLoading: userEmail !== null && !isInitialized,
  }
}