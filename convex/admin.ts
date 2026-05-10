import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function requireAdmin(
  ctx: MutationCtx,
  sessionToken: string,
): Promise<void> {
  const expected = process.env.ADMIN_PASSCODE
  if (!expected) {
    throw new Error('ADMIN_PASSCODE env var not configured')
  }

  const session = await ctx.db
    .query('adminSessions')
    .withIndex('by_token', (q) => q.eq('token', sessionToken))
    .unique()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const now = Date.now()
  if (session.expiresAt < now) {
    await ctx.db.delete(session._id)
    throw new Error('Session expired')
  }

  await ctx.db.patch(session._id, { expiresAt: now + SESSION_DURATION_MS })
}

export async function requireAdminQuery(
  ctx: QueryCtx,
  sessionToken: string,
): Promise<void> {
  // Read-only variant of requireAdmin: queries cannot delete expired sessions,
  // so we only validate and throw; mutation paths handle cleanup on next use.
  const session = await ctx.db
    .query('adminSessions')
    .withIndex('by_token', (q) => q.eq('token', sessionToken))
    .unique()
  if (!session) throw new Error('Unauthorized')
  if (session.expiresAt < Date.now()) throw new Error('Session expired')
}

export const login = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_PASSCODE
    if (!expected) {
      throw new Error('ADMIN_PASSCODE env var not configured')
    }
    if (args.passcode !== expected) {
      throw new Error('Invalid passcode')
    }

    const token = generateToken()
    await ctx.db.insert('adminSessions', {
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    })
    return { token }
  },
})

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .unique()
    if (session) {
      await ctx.db.delete(session._id)
    }
    return null
  },
})

export const checkSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const session = await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .unique()
    if (!session) return { valid: false }
    if (session.expiresAt < Date.now()) return { valid: false }
    return { valid: true }
  },
})
