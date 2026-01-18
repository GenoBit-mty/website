import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("research").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    authors: v.array(v.string()),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("research", args);
  },
});
