import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { mediaAssetValidator } from "./validators";
import type { Id } from "./_generated/dataModel.js";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAsset = mutation({
  args: {
    entityType: v.string(),
    entityId: v.optional(v.string()),
    storageId: v.string(),
    altText: v.optional(v.string()),
  },
  returns: v.object({
    assetId: v.id("mediaAssets"),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const fileUrl = await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    if (!fileUrl) {
      throw new Error("Uploaded file not found.");
    }

    const assetId = await ctx.db.insert("mediaAssets", {
      entityType: args.entityType,
      entityId: args.entityId,
      storageId: args.storageId,
      url: fileUrl,
      altText: args.altText,
      createdAt: Date.now(),
    });

    return { assetId, url: fileUrl };
  },
});

export const listAssets = query({
  args: {
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  returns: v.array(mediaAssetValidator),
  handler: async (ctx, args) => {
    const assets = await ctx.db.query("mediaAssets").order("desc").collect();

    return assets.filter((asset) => {
      if (args.entityType && asset.entityType !== args.entityType) {
        return false;
      }
      if (args.entityId && asset.entityId !== args.entityId) {
        return false;
      }
      return true;
    });
  },
});
