import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const addWaterIntake = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const isoDate = new Date(now).toISOString()
    const dateOnly = isoDate.split("T")[0] // YYYY-MM-DD

    const intakeId = await ctx.db.insert("waterIntakes", {
      userId: args.userId,
      amount: args.amount,
      timestamp: now,
      date: isoDate, // Use full ISO string as requested by user
    })

    // Check if daily goal is reached and award achievement
    const user = await ctx.db.get(args.userId)
    if (user) {
      const todayIntakes = await ctx.db
        .query("waterIntakes")
        .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", dateOnly))
        .collect()

      // Also search for intakes with full ISO string starting with today's date
      const allIntakes = await ctx.db
        .query("waterIntakes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("date"), dateOnly))
        .collect()
      
      const todayIntakesFiltered = allIntakes.filter(i => i.date.startsWith(dateOnly))

      const totalToday = todayIntakesFiltered.reduce((sum, intake) => sum + intake.amount, 0)

      if (totalToday >= user.dailyGoal) {
        // Check if achievement already exists for today
        const existingAchievement = await ctx.db
          .query("achievements")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) =>
            q.and(q.eq(q.field("type"), "daily_goal"), q.gte(q.field("unlockedAt"), new Date(dateOnly).getTime())),
          )
          .first()

        if (!existingAchievement) {
          await ctx.db.insert("achievements", {
            userId: args.userId,
            type: "daily_goal",
            title: "Daily Goal Achieved!",
            description: `Reached your daily goal of ${user.dailyGoal}ml`,
            unlockedAt: now,
            icon: "trophy",
          })
        }
      }
    }

    return intakeId
  },
})

export const getTodayIntakes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]

    // Use a range query to find all entries for today (handles both YYYY-MM-DD and ISO strings)
    return await ctx.db
      .query("waterIntakes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("date"), today))
      .collect()
      .then(results => results.filter(r => r.date.startsWith(today)))
  },
})

export const getWeeklyIntakes = query({
  args: { userId: v.id("users"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = new Date()
    const days = args.days ?? 7
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const cutoffStr = cutoffDate.toISOString().split("T")[0]

    return await ctx.db
      .query("waterIntakes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("date"), cutoffStr))
      .collect()
  },
})

export const getDailyStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]

    const todayIntakes = await ctx.db
      .query("waterIntakes")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", today))
      .collect()

    const totalToday = todayIntakes.reduce((sum, intake) => sum + intake.amount, 0)
    const lastIntake = todayIntakes.length > 0 ? Math.max(...todayIntakes.map((i) => i.timestamp)) : null

    return {
      totalToday,
      lastIntake,
      intakeCount: todayIntakes.length,
    }
  },
})

export const deleteIntake = mutation({
  args: { intakeId: v.id("waterIntakes"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.intakeId)
    if (!intake) return { success: false }

    // Ensure ownership
    if (String(intake.userId) !== String(args.userId)) {
      return { success: false }
    }

    await ctx.db.delete(args.intakeId)
    return { success: true }
  },
})
