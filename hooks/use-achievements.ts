"use client"

import { useState, useEffect, useCallback } from "react"

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "streak" | "daily" | "volume" | "consistency" | "milestone"
  requirement: number
  progress: number
  unlocked: boolean
  unlockedAt?: number
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
}

export interface UserStats {
  totalWaterIntake: number
  daysTracked: number
  currentStreak: number
  longestStreak: number
  dailyGoalsReached: number
  totalPoints: number
  level: number
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalWaterIntake: 0,
    daysTracked: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyGoalsReached: 0,
    totalPoints: 0,
    level: 1,
  })
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const initialAchievements: Achievement[] = [
    // Streak Achievements
    {
      id: "first-day",
      title: "First Drop",
      description: "Complete your first day of tracking",
      icon: "droplet",
      category: "streak",
      requirement: 1,
      progress: 0,
      unlocked: false,
      rarity: "common",
      points: 10,
    },
    {
      id: "streak-3",
      title: "Getting Started",
      description: "Maintain a 3-day hydration streak",
      icon: "flame",
      category: "streak",
      requirement: 3,
      progress: 0,
      unlocked: false,
      rarity: "common",
      points: 25,
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a 7-day hydration streak",
      icon: "calendar",
      category: "streak",
      requirement: 7,
      progress: 0,
      unlocked: false,
      rarity: "rare",
      points: 50,
    },
    {
      id: "streak-30",
      title: "Hydration Hero",
      description: "Maintain a 30-day hydration streak",
      icon: "crown",
      category: "streak",
      requirement: 30,
      progress: 0,
      unlocked: false,
      rarity: "epic",
      points: 200,
    },
    {
      id: "streak-100",
      title: "Legendary Hydrator",
      description: "Maintain a 100-day hydration streak",
      icon: "star",
      category: "streak",
      requirement: 100,
      progress: 0,
      unlocked: false,
      rarity: "legendary",
      points: 500,
    },

    // Daily Achievements
    {
      id: "daily-goal-1",
      title: "Goal Crusher",
      description: "Reach your daily goal for the first time",
      icon: "target",
      category: "daily",
      requirement: 1,
      progress: 0,
      unlocked: false,
      rarity: "common",
      points: 15,
    },
    {
      id: "daily-goals-10",
      title: "Consistent Achiever",
      description: "Reach your daily goal 10 times",
      icon: "check-circle",
      category: "daily",
      requirement: 10,
      progress: 0,
      unlocked: false,
      rarity: "rare",
      points: 75,
    },
    {
      id: "daily-goals-50",
      title: "Goal Master",
      description: "Reach your daily goal 50 times",
      icon: "trophy",
      category: "daily",
      requirement: 50,
      progress: 0,
      unlocked: false,
      rarity: "epic",
      points: 250,
    },

    // Volume Achievements
    {
      id: "volume-1l",
      title: "First Liter",
      description: "Drink 1 liter in a single day",
      icon: "glass-water",
      category: "volume",
      requirement: 1000,
      progress: 0,
      unlocked: false,
      rarity: "common",
      points: 20,
    },
    {
      id: "volume-3l",
      title: "Hydration Champion",
      description: "Drink 3 liters in a single day",
      icon: "waves",
      category: "volume",
      requirement: 3000,
      progress: 0,
      unlocked: false,
      rarity: "rare",
      points: 60,
    },
    {
      id: "volume-5l",
      title: "Water Warrior",
      description: "Drink 5 liters in a single day",
      icon: "zap",
      category: "volume",
      requirement: 5000,
      progress: 0,
      unlocked: false,
      rarity: "epic",
      points: 150,
    },

    // Milestone Achievements
    {
      id: "total-10l",
      title: "10 Liter Club",
      description: "Drink a total of 10 liters",
      icon: "award",
      category: "milestone",
      requirement: 10000,
      progress: 0,
      unlocked: false,
      rarity: "common",
      points: 30,
    },
    {
      id: "total-100l",
      title: "Century Hydrator",
      description: "Drink a total of 100 liters",
      icon: "medal",
      category: "milestone",
      requirement: 100000,
      progress: 0,
      unlocked: false,
      rarity: "rare",
      points: 100,
    },
    {
      id: "total-1000l",
      title: "Hydration Legend",
      description: "Drink a total of 1000 liters",
      icon: "gem",
      category: "milestone",
      requirement: 1000000,
      progress: 0,
      unlocked: false,
      rarity: "legendary",
      points: 1000,
    },
  ]

  // ── 1. Load User Email on Mount ───────────────────────────────────────────
  useEffect(() => {
    const checkUser = () => {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser)
          if (parsed.email !== userEmail) {
            setUserEmail(parsed.email)
          }
        } catch (e) {
          console.error("Failed to parse currentUser", e)
        }
      } else {
        setUserEmail(null)
      }
    }

    checkUser()
    window.addEventListener("storage", checkUser)
    return () => window.removeEventListener("storage", checkUser)
  }, [userEmail])

  // ── 2. Load Achievement Data when Email changes ───────────────────────────
  useEffect(() => {
    if (!userEmail) return

    const storageKey = `water_data_${userEmail}`
    const savedDataRaw = localStorage.getItem(storageKey)
    
    if (savedDataRaw) {
      try {
        const savedData = JSON.parse(savedDataRaw)
        if (savedData.achievements) {
          setAchievements(savedData.achievements)
        } else {
          setAchievements(initialAchievements)
        }
        if (savedData.userStats) {
          setUserStats(savedData.userStats)
        }
      } catch (e) {
        console.error("Failed to parse user achievements", e)
        setAchievements(initialAchievements)
      }
    } else {
      setAchievements(initialAchievements)
      setUserStats({
        totalWaterIntake: 0,
        daysTracked: 0,
        currentStreak: 0,
        longestStreak: 0,
        dailyGoalsReached: 0,
        totalPoints: 0,
        level: 1,
      })
    }
  }, [userEmail])

  // Helper to save to user-specific storage
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

  // Save to localStorage when achievements or stats change
  useEffect(() => {
    if (userEmail && achievements.length > 0) {
      saveToUserStorage({ achievements })
    }
  }, [achievements, userEmail, saveToUserStorage])

  useEffect(() => {
    if (userEmail) {
      saveToUserStorage({ userStats })
    }
  }, [userStats, userEmail, saveToUserStorage])

  const updateProgress = useCallback(
    (waterIntake: number, dailyGoal: number, streak: number) => {
      const goalReached = waterIntake >= dailyGoal

      setUserStats((prev) => {
        const newStats = {
          ...prev,
          totalWaterIntake: prev.totalWaterIntake + waterIntake,
          currentStreak: streak,
          longestStreak: Math.max(prev.longestStreak, streak),
          dailyGoalsReached: goalReached ? prev.dailyGoalsReached + 1 : prev.dailyGoalsReached,
          daysTracked: prev.daysTracked + 1,
        }

        // Calculate level based on points
        newStats.level = Math.floor(newStats.totalPoints / 100) + 1

        return newStats
      })

      setAchievements((prev) => {
        const updated = prev.map((achievement) => {
          let newProgress = achievement.progress
          let unlocked = achievement.unlocked

          switch (achievement.category) {
            case "streak":
              newProgress = streak
              break
            case "daily":
              if (achievement.id === "daily-goal-1" && goalReached) {
                newProgress = 1
              } else if (achievement.id.startsWith("daily-goals-")) {
                newProgress = userStats.dailyGoalsReached + (goalReached ? 1 : 0)
              }
              break
            case "volume":
              if (achievement.id.includes("volume-")) {
                newProgress = Math.max(newProgress, waterIntake)
              }
              break
            case "milestone":
              newProgress = userStats.totalWaterIntake + waterIntake
              break
          }

          if (!unlocked && newProgress >= achievement.requirement) {
            unlocked = true
            setNewlyUnlocked((current) => [...current, { ...achievement, unlocked: true, unlockedAt: Date.now() }])
            setUserStats((stats) => ({ ...stats, totalPoints: stats.totalPoints + achievement.points }))
          }

          return {
            ...achievement,
            progress: newProgress,
            unlocked,
            unlockedAt: unlocked && !achievement.unlockedAt ? Date.now() : achievement.unlockedAt,
          }
        })

        return updated
      })
    },
    [userStats.dailyGoalsReached, userStats.totalWaterIntake],
  )

  const dismissNewAchievements = useCallback(() => {
    setNewlyUnlocked([])
  }, [])

  const getAchievementsByCategory = useCallback(
    (category: Achievement["category"]) => {
      return achievements.filter((a) => a.category === category)
    },
    [achievements],
  )

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter((a) => a.unlocked)
  }, [achievements])

  const getProgressPercentage = useCallback((achievement: Achievement) => {
    if (!achievement.requirement || achievement.requirement <= 0) return achievement.unlocked ? 100 : 0
    return Math.min((achievement.progress / achievement.requirement) * 100, 100)
  }, [])

  return {
    achievements,
    userStats,
    newlyUnlocked,
    updateProgress,
    dismissNewAchievements,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getProgressPercentage,
  }
}
