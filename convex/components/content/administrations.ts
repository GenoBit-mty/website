import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { administrationValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(administrationValidator),
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
    galleryImageUrls: v.optional(v.array(v.string())),
    members: v.array(
      v.object({
        name: v.string(),
        role: v.string(),
        imageUrl: v.optional(v.string()),
      }),
    ),
  },
  returns: v.id("pastAdministrations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("pastAdministrations", args);
  },
});
