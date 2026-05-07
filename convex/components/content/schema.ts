import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teamMembers: defineTable({
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
  }),

  pastAdministrations: defineTable({
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
  }),

  events: defineTable({
    category: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  }),

  research: defineTable({
    title: v.string(),
    description: v.string(),
    authors: v.array(v.string()),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  }),

  labs: defineTable({
    title: v.string(),
    summary: v.string(),
    description: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
    lead: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
  }),

  mediaAssets: defineTable({
    entityType: v.string(),
    entityId: v.optional(v.string()),
    storageId: v.string(),
    url: v.string(),
    altText: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
