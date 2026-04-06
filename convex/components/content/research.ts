import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { researchValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(researchValidator),
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
    galleryImageUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("research"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("research", args);
  },
});
