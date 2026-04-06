import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.content.labs.list, {});
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
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.content.labs.create, args);
  },
});
