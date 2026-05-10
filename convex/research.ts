import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin } from './admin'
import { slugify } from './lib/slug'

const bilingualValidator = v.object({ es: v.string(), en: v.string() })

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('research').collect()
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('research')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
  },
})

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: bilingualValidator,
    description: bilingualValidator,
    body: v.optional(bilingualValidator),
    slug: v.string(),
    authors: v.array(v.string()),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const { sessionToken, ...rest } = args
    const collision = await ctx.db
      .query('research')
      .withIndex('by_slug', (q) => q.eq('slug', rest.slug))
      .unique()
    if (collision) {
      throw new Error(`Slug "${rest.slug}" ya está en uso`)
    }
    return await ctx.db.insert('research', rest)
  },
})

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('research'),
    title: v.optional(bilingualValidator),
    description: v.optional(bilingualValidator),
    body: v.optional(bilingualValidator),
    slug: v.optional(v.string()),
    authors: v.optional(v.array(v.string())),
    publicationDate: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const { sessionToken, id, ...rest } = args
    if (rest.slug) {
      const collision = await ctx.db
        .query('research')
        .withIndex('by_slug', (q) => q.eq('slug', rest.slug as string))
        .unique()
      if (collision && collision._id !== id) {
        throw new Error(`Slug "${rest.slug}" ya está en uso`)
      }
    }
    await ctx.db.patch(id, rest)
    return null
  },
})

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id('research') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    await ctx.db.delete(args.id)
    return null
  },
})

const researchImage =
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1200'

export const seedResearch = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ inserted: v.number(), deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)

    const existing = await ctx.db.query('research').collect()
    for (const r of existing) {
      await ctx.db.delete(r._id)
    }

    await ctx.db.insert('research', {
      title: {
        es: 'Pipeline para detección de variantes somáticas en cohortes pequeñas',
        en: 'Pipeline for somatic variant detection in small cohorts',
      },
      description: {
        es: 'Framework reproducible para identificar variantes de alto impacto con control de calidad automatizado.',
        en: 'Reproducible framework to identify high-impact variants with automated quality control.',
      },
      body: {
        es: '## Motivación\n\nLas cohortes pequeñas presentan retos particulares para la detección de variantes somáticas debido al ruido estadístico.\n\n## Método\n\nEl pipeline integra control de calidad automatizado y filtrado por confianza.',
        en: '## Motivation\n\nSmall cohorts present unique challenges for somatic variant detection due to statistical noise.\n\n## Method\n\nThe pipeline integrates automated quality control and confidence-based filtering.',
      },
      slug: 'pipeline-somatic-variant-detection-small-cohorts',
      authors: ['A. Ruiz', 'J. Salinas', 'L. Mendez'],
      publicationDate: '2026-02-20',
      url: 'https://doi.org/10.0000/genobit.2026.001',
      imageUrl: researchImage,
      galleryImageUrls: [researchImage],
      tags: ['Genómica', 'Pipelines', 'NGS'],
    })

    return { inserted: 1, deleted: existing.length }
  },
})

export const backfillSlugs = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const all = await ctx.db.query('research').collect()
    const used = new Set<string>()
    for (const r of all) {
      if (r.slug) used.add(r.slug)
    }
    let patched = 0
    for (const r of all) {
      if (r.slug) continue
      const base = slugify(r.title.en) || slugify(r.title.es) || 'paper'
      let candidate = base
      let n = 2
      while (used.has(candidate)) {
        candidate = `${base}-${n}`
        n += 1
      }
      used.add(candidate)
      await ctx.db.patch(r._id, { slug: candidate })
      patched += 1
    }
    return { patched }
  },
})
