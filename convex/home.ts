import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin } from './admin'

export const HOME_SLOTS = ['research', 'team', 'events'] as const
export type HomeSlot = (typeof HOME_SLOTS)[number]

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('homeImages').collect()
  },
})

export const setSlot = mutation({
  args: {
    sessionToken: v.string(),
    slot: v.string(),
    imageUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    if (!HOME_SLOTS.includes(args.slot as HomeSlot)) {
      throw new Error(`Unknown home slot: ${args.slot}`)
    }
    const existing = await ctx.db
      .query('homeImages')
      .withIndex('by_slot', (q) => q.eq('slot', args.slot))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { imageUrl: args.imageUrl })
    } else {
      await ctx.db.insert('homeImages', {
        slot: args.slot,
        imageUrl: args.imageUrl,
      })
    }
    return null
  },
})

export const clearSlot = mutation({
  args: { sessionToken: v.string(), slot: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const existing = await ctx.db
      .query('homeImages')
      .withIndex('by_slot', (q) => q.eq('slot', args.slot))
      .unique()
    if (existing) {
      await ctx.db.delete(existing._id)
    }
    return null
  },
})

export const listAvailableImages = query({
  args: {},
  handler: async (ctx) => {
    const seen = new Set<string>()
    const push = (url: string | undefined) => {
      if (url && !seen.has(url)) seen.add(url)
    }

    const teamMembers = await ctx.db.query('teamMembers').collect()
    for (const m of teamMembers) {
      push(m.imageUrl)
      m.galleryImageUrls?.forEach(push)
    }

    const events = await ctx.db.query('events').collect()
    for (const e of events) {
      push(e.imageUrl)
      e.galleryImageUrls?.forEach(push)
    }

    const labs = await ctx.db.query('labs').collect()
    for (const l of labs) {
      push(l.imageUrl)
      l.galleryImageUrls?.forEach(push)
    }

    const research = await ctx.db.query('research').collect()
    for (const r of research) {
      push(r.imageUrl)
      r.galleryImageUrls?.forEach(push)
    }

    const past = await ctx.db.query('pastAdministrations').collect()
    for (const p of past) {
      push(p.imageUrl)
      p.galleryImageUrls?.forEach(push)
      for (const m of p.members) {
        push(m.imageUrl)
        m.galleryImageUrls?.forEach(push)
      }
    }

    const home = await ctx.db.query('homeImages').collect()
    for (const h of home) push(h.imageUrl)

    return Array.from(seen)
  },
})
