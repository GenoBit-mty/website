import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { eventValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(eventValidator),
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const listUpcoming = query({
  args: {},
  returns: v.array(eventValidator),
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
    galleryImageUrls: v.optional(v.array(v.string())),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", args);
  },
});
