import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin, requireAdminQuery } from './admin'

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

const groupValidator = v.union(
  v.literal('ndrg'),
  v.literal('proteomics'),
  v.literal('student-community'),
)

const statusValidator = v.union(
  v.literal('new'),
  v.literal('under_review'),
  v.literal('contacted'),
  v.literal('interview_scheduled'),
  v.literal('accepted'),
  v.literal('rejected'),
)

const localeValidator = v.union(v.literal('es'), v.literal('en'))

export const submit = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    career: v.string(),
    careerOther: v.optional(v.string()),
    semester: v.string(),
    university: v.string(),
    group: groupValidator,
    subArea: v.optional(v.string()),
    motivation: v.string(),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    acceptsContact: v.boolean(),
    locale: localeValidator,
    // honeypot — bots fill this, humans don't see it
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Honeypot: silently return success so bots don't probe for behavior.
    if (args.website && args.website.length > 0) {
      return { ok: true as const }
    }

    // Applications-closed gate
    const openSetting = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'applicationsOpen'))
      .unique()
    if (openSetting && openSetting.value !== 'true') {
      throw new ConvexError({ code: 'CLOSED' })
    }

    // Rate-limit: one submission per email per 24h.
    const normalizedEmail = args.email.trim().toLowerCase()
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
    const recent = await ctx.db
      .query('applications')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .collect()
    if (recent.some((r) => r.submittedAt >= cutoff)) {
      throw new ConvexError({ code: 'DUPLICATE_RECENT' })
    }

    // Server-side guard: sub-area required for student-community.
    if (args.group === 'student-community' && !args.subArea) {
      throw new ConvexError({ code: 'SUBAREA_REQUIRED' })
    }

    const now = Date.now()
    await ctx.db.insert('applications', {
      fullName: args.fullName.trim(),
      email: normalizedEmail,
      phone: args.phone.trim(),
      career: args.career,
      careerOther: args.careerOther?.trim() || undefined,
      semester: args.semester,
      university: args.university,
      group: args.group,
      subArea: args.subArea,
      motivation: args.motivation.trim(),
      linkedinUrl: args.linkedinUrl?.trim() || undefined,
      githubUrl: args.githubUrl?.trim() || undefined,
      acceptsContact: args.acceptsContact,
      locale: args.locale,
      submittedAt: now,
      status: 'new',
      statusHistory: [{ status: 'new', changedAt: now }],
    })
    return { ok: true as const }
  },
})

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdminQuery(ctx, args.sessionToken)

    return await ctx.db
      .query('applications')
      .withIndex('by_submittedAt')
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { sessionToken: v.string(), id: v.id('applications') },
  handler: async (ctx, args) => {
    await requireAdminQuery(ctx, args.sessionToken)
    return await ctx.db.get(args.id)
  },
})

export const updateStatus = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const app = await ctx.db.get(args.id)
    if (!app) throw new Error('Application not found')
    if (app.status === args.status) return null
    await ctx.db.patch(args.id, {
      status: args.status,
      statusHistory: [
        ...app.statusHistory,
        { status: args.status, changedAt: Date.now() },
      ],
    })
    return null
  },
})

export const updateAssignee = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    assigneeName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const trimmed = args.assigneeName.trim()
    await ctx.db.patch(args.id, {
      assigneeName: trimmed.length === 0 ? undefined : trimmed,
    })
    return null
  },
})

export const updateNotes = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    adminNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const trimmed = args.adminNotes.trim()
    await ctx.db.patch(args.id, {
      adminNotes: trimmed.length === 0 ? undefined : trimmed,
    })
    return null
  },
})

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id('applications') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    await ctx.db.delete(args.id)
    return null
  },
})
