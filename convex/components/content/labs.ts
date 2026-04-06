import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { labValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(labValidator),
  handler: async (ctx) => {
    return await ctx.db.query("labs").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    description: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
    lead: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
  },
  returns: v.id("labs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("labs", args);
  },
});
