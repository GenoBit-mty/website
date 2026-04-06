import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.runMutation(components.content.media.generateUploadUrl, {});
  },
});

export const saveImageAsset = mutation({
  args: {
    entityType: v.string(),
    entityId: v.optional(v.string()),
    storageId: v.string(),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.content.media.saveAsset, args);
  },
});

export const listImageAssets = query({
  args: {
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.content.media.listAssets, args);
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.runMutation(components.content.seed.seedDemoData, {});
  },
});
