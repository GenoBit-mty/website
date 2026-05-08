import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const bilingual = v.object({
  es: v.string(),
  en: v.string(),
});

export default defineSchema({
  teamMembers: defineTable({
    name: v.string(),
    role: bilingual,
    career: v.optional(v.string()),
    group: v.optional(v.string()),
    tenure: v.optional(v.string()),
    isFirstBoard: v.optional(v.boolean()),
    bio: v.optional(bilingual),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  }),

  pastAdministrations: defineTable({
    period: v.string(),
    presidentName: v.string(),
    description: v.optional(bilingual),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    members: v.array(
      v.object({
        name: v.string(),
        role: bilingual,
        imageUrl: v.optional(v.string()),
      }),
    ),
  }),

  events: defineTable({
    category: v.optional(v.string()),
    title: bilingual,
    description: bilingual,
    date: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    requiresRegistration: v.optional(v.boolean()),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  }),

  research: defineTable({
    title: bilingual,
    description: bilingual,
    body: v.optional(bilingual),
    slug: v.optional(v.string()),
    authors: v.array(v.string()),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  }).index("by_slug", ["slug"]),

  labs: defineTable({
    title: bilingual,
    summary: bilingual,
    description: v.optional(bilingual),
    focusAreas: v.optional(v.array(v.string())),
    lead: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
  }),

  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
