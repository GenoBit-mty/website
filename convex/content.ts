import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./admin";
import type { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveUploadedUrl = mutation({
  args: { sessionToken: v.string(), storageId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const url = await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    if (!url) throw new Error("Uploaded file not found");
    return { url };
  },
});
