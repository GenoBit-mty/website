import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Team Members Table
  teamMembers: defineTable({
    name: v.string(),
    role: v.string(), // e.g., "President", "Vice President", "Member"
    career: v.optional(v.string()), // e.g., "ITC", "IBT", "IDM", "MC", "MSc BI"
    group: v.optional(v.string()), // "directives" | "ndrg" | "proteomics" | "student-community"
    tenure: v.optional(v.string()), // e.g., "2025-2026"
    isFirstBoard: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()), // For sorting display order
  }),

  // Past Administrations Table
  pastAdministrations: defineTable({
    period: v.string(), // e.g., "2023-2024"
    presidentName: v.string(),
    description: v.optional(v.string()), // Achievements summary
    imageUrl: v.optional(v.string()), // Group photo
    members: v.array(v.object({
      name: v.string(),
      role: v.string(),
    })),
  }),

  // Events Table
  events: defineTable({
    category: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    date: v.string(), // ISO date string or timestamp, keeping string for flexibility
    location: v.string(),
    imageUrl: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  }),

  // Research Papers / Projects Table
  research: defineTable({
    title: v.string(),
    description: v.string(),
    authors: v.array(v.string()),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()), // Link to paper/repo
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // e.g., ["Genomics", "Proteomics"]
  }),
});
