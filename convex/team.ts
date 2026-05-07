import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.content.team.list, {});
  },
});

export const seedGenobitTeam = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.runMutation(components.content.seedGenobit.seedGenobitTeam, {});
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    career: v.optional(v.string()),
    group: v.optional(v.string()),
    tenure: v.optional(v.string()),
    isFirstBoard: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.content.team.create, args);
  },
});
