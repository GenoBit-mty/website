import { v } from "convex/values";

export const teamMemberValidator = v.object({
  _id: v.id("teamMembers"),
  _creationTime: v.number(),
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
});

export const eventValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  category: v.optional(v.string()),
  title: v.string(),
  description: v.string(),
  date: v.string(),
  location: v.string(),
  imageUrl: v.optional(v.string()),
  galleryImageUrls: v.optional(v.array(v.string())),
  registrationUrl: v.optional(v.string()),
  isUpcoming: v.optional(v.boolean()),
});

export const researchValidator = v.object({
  _id: v.id("research"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.string(),
  authors: v.array(v.string()),
  publicationDate: v.optional(v.string()),
  url: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  galleryImageUrls: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
});

export const administrationValidator = v.object({
  _id: v.id("pastAdministrations"),
  _creationTime: v.number(),
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
});

export const labValidator = v.object({
  _id: v.id("labs"),
  _creationTime: v.number(),
  title: v.string(),
  summary: v.string(),
  description: v.optional(v.string()),
  focusAreas: v.optional(v.array(v.string())),
  lead: v.optional(v.string()),
  location: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  galleryImageUrls: v.optional(v.array(v.string())),
});

export const mediaAssetValidator = v.object({
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
  entityType: v.string(),
  entityId: v.optional(v.string()),
  storageId: v.string(),
  url: v.string(),
  altText: v.optional(v.string()),
  createdAt: v.number(),
});
