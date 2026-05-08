import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

const bilingualValidator = v.object({ es: v.string(), en: v.string() });

const memberValidator = v.object({
  name: v.string(),
  role: bilingualValidator,
  imageUrl: v.optional(v.string()),
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pastAdministrations").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    period: v.string(),
    presidentName: v.string(),
    description: v.optional(bilingualValidator),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    members: v.array(memberValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, ...rest } = args;
    return await ctx.db.insert("pastAdministrations", rest);
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("pastAdministrations"),
    period: v.optional(v.string()),
    presidentName: v.optional(v.string()),
    description: v.optional(bilingualValidator),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    members: v.optional(v.array(memberValidator)),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return null;
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("pastAdministrations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
    return null;
  },
});

const teamImage =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200";
const presidentImage =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200";

export const seedPastAdmin = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ inserted: v.number(), deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("pastAdministrations").collect();
    for (const a of existing) {
      await ctx.db.delete(a._id);
    }

    await ctx.db.insert("pastAdministrations", {
      period: "2024-2025",
      presidentName: "Valeria Campos",
      description: {
        es: "Se consolidaron talleres semanales y se lanzó el primer repositorio comunitario de GenoBit.",
        en: "Weekly workshops were consolidated and the first GenoBit community repository was launched.",
      },
      imageUrl: presidentImage,
      galleryImageUrls: [teamImage],
      members: [
        {
          name: "Valeria Campos",
          role: { es: "Presidenta", en: "President" },
          imageUrl: teamImage,
        },
        {
          name: "Mario Diaz",
          role: { es: "Vicepresidente", en: "Vicepresident" },
          imageUrl: teamImage,
        },
      ],
    });

    return { inserted: 1, deleted: existing.length };
  },
});
