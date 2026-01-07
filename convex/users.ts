import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    dailyGoal: v.optional(v.number()),
    weight: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    climate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      return existingUser._id
    }

  // Calculate daily goal based on weight if provided
    let calculatedGoal = args.dailyGoal || 2500 // Default 2.5L
    if (args.weight) {
      calculatedGoal = Math.round(args.weight * 35) // 35ml per kg body weight

      // Adjust for activity level
      if (args.activityLevel === "high") calculatedGoal *= 1.3
      else if (args.activityLevel === "moderate") calculatedGoal *= 1.15

      // Adjust for climate
      if (args.climate === "hot") calculatedGoal *= 1.2
    }

      const insertObj: any = {
        name: args.name,
        email: args.email,
        dailyGoal: calculatedGoal,
        weight: args.weight,
        activityLevel: args.activityLevel,
        climate: args.climate,
        reminderInterval: 60,
        createdAt: Date.now(),
      }

      if (args.password) {
        insertObj.passwordHash = require("crypto").createHash("sha256").update(args.password).digest("hex")
      }

      const userId = await ctx.db.insert("users", insertObj)

    return userId
  },
})

export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
  },
})

export const authenticate = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (!user) return { success: false, error: "User not found" }

    const crypto = require("crypto")
    const hash = crypto.createHash("sha256").update(args.password).digest("hex")

    const storedHash = (user as any).passwordHash
    if (storedHash && storedHash === hash) {
      return { success: true, userId: user._id, user }
    }

    return { success: false, error: "Invalid credentials" }
  },
})

export const updateUserSettings = mutation({
  args: {
    userId: v.id("users"),
    dailyGoal: v.optional(v.number()),
    weight: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    climate: v.optional(v.string()),
    reminderInterval: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args
    await ctx.db.patch(userId, updates)
  },
})

export const deleteUserData = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete waterIntakes for user
    const intakes = await ctx.db
      .query("waterIntakes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    for (const it of intakes) {
      try {
        await ctx.db.delete(it._id)
      } catch (e) {
        // ignore individual failures
      }
    }

    // Delete achievements for user
    const ach = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    for (const a of ach) {
      try {
        await ctx.db.delete(a._id)
      } catch (e) {
        // ignore
      }
    }

    return { deletedIntakes: intakes.length, deletedAchievements: ach.length }
  },
})
