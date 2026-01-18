import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isUpcoming"), true))
      .collect();
  },
});

export const create = mutation({
  args: {
    category: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", args);
  },
});
