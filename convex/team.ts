import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", args);
  },
});
