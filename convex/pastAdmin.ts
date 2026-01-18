import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pastAdministrations").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    period: v.string(),
    presidentName: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    members: v.array(v.object({
      name: v.string(),
      role: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pastAdministrations", args);
  },
});
