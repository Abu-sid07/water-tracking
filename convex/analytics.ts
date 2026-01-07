import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const saveAnalytics = mutation({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    period: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("analytics", {
      userId: args.userId,
      startDate: args.startDate,
      period: args.period,
      payload: args.payload,
      createdAt: Date.now(),
    })
    return id
  },
})
