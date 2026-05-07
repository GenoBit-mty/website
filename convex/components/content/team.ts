import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { teamMemberValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(teamMemberValidator),
  handler: async (ctx) => {
    const members = await ctx.db.query("teamMembers").collect();
    return members.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
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
  returns: v.id("teamMembers"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", args);
  },
});
