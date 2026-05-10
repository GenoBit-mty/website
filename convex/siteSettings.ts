import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin } from './admin'

const APPLICATIONS_OPEN_KEY = 'applicationsOpen'

export const getApplicationsOpen = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', APPLICATIONS_OPEN_KEY))
      .unique()
    // Default: open. If no row exists yet, treat as open.
    if (!row) return true
    return row.value === 'true'
  },
})

export const setApplicationsOpen = mutation({
  args: { sessionToken: v.string(), open: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const row = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', APPLICATIONS_OPEN_KEY))
      .unique()
    const value = args.open ? 'true' : 'false'
    if (row) {
      await ctx.db.patch(row._id, { value })
    } else {
      await ctx.db.insert('siteSettings', {
        key: APPLICATIONS_OPEN_KEY,
        value,
      })
    }
    return null
  },
})
