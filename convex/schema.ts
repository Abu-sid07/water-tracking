import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    dailyGoal: v.number(), // ml
    weight: v.optional(v.number()), // kg
    activityLevel: v.optional(v.string()), // "low", "moderate", "high"
    climate: v.optional(v.string()), // "cool", "moderate", "hot"
    reminderInterval: v.optional(v.number()), // minutes
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  waterIntakes: defineTable({
    userId: v.id("users"),
    amount: v.number(), // ml
    timestamp: v.number(),
    date: v.string(), // YYYY-MM-DD format for easy querying
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  achievements: defineTable({
    userId: v.id("users"),
    type: v.string(), // "daily_goal", "streak", "total_intake"
    title: v.string(),
    description: v.string(),
    unlockedAt: v.number(),
    icon: v.string(),
  }).index("by_user", ["userId"]),

  reminders: defineTable({
    userId: v.id("users"),
    isActive: v.boolean(),
    interval: v.number(), // minutes
    lastReminder: v.optional(v.number()),
    nextReminder: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  analytics: defineTable({
    userId: v.id("users"),
    startDate: v.string(),
    period: v.string(),
    payload: v.string(), // JSON string of analytics snapshot
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
})
