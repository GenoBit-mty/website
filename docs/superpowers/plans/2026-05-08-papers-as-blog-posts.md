# Papers as Blog Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert research papers into blog-post-style entries with a clickable listing card → detail page (`/research/$slug`) that renders bilingual markdown content.

**Architecture:** Add `slug` (optional in schema, required by admin) and `body` (optional bilingual markdown) to the `research` Convex table with a `by_slug` index. The listing page wraps each card in a TanStack Router `Link`. A new file-based route `src/routes/research.$slug.tsx` queries `getBySlug`, renders an editorial detail layout with markdown body via `react-markdown`. The admin form gains a slug field (auto-generated from English title with manual override) and a bilingual markdown body textarea. A one-shot `backfillSlugs` admin mutation seeds slugs for legacy rows.

**Tech Stack:** Convex (schema, queries, mutations), TanStack Start/Router (file-based routes), React Hook Form + Zod (admin form), `react-markdown` + `remark-gfm` (markdown rendering), Vitest (unit tests for slugify).

**Phased deploy note:** `slug` is added as **optional** at the schema level so the schema check passes against existing rows. The Zod schema in the admin form treats it as required, and after running `backfillSlugs` every row will have a slug. We keep the schema field optional to preserve a graceful migration path; the listing page filters out rows missing a slug from clickability.

---

## File Structure

**Create:**

- `convex/lib/slug.ts` — pure `slugify()` helper, shared by Convex functions and the admin client (which already imports from the convex directory via relative paths).
- `convex/lib/slug.test.ts` — Vitest unit tests for `slugify`.
- `src/routes/research.$slug.tsx` — paper detail page (file-based TanStack route).
- `src/components/MarkdownBody.tsx` — small wrapper around `react-markdown` + `remark-gfm` with editorial prose styling class.

**Modify:**

- `convex/schema.ts` — add `slug` (optional string), `body` (optional bilingual), and `by_slug` index on `research` table.
- `convex/research.ts` — add `getBySlug`, `backfillSlugs`; update `create`, `update`, and `seedResearch` for slug + body.
- `src/routes/admin/research.tsx` — add slug and body fields to the form, Zod schema, and submit payload.
- `src/routes/research.tsx` — wrap each card in a `Link`, remove the external "Read" button, filter out rows missing a slug from the linked listing.
- `src/styles.css` — add `.research-body-prose`, `.research-detail-*`, hover state for clickable cards.
- `src/i18n/strings.ts` — add detail page strings.
- `package.json` / `bun.lock` — add `react-markdown` and `remark-gfm` dependencies.

---

## Task 1: Add `slugify` helper with tests

**Files:**

- Create: `convex/lib/slug.ts`
- Create: `convex/lib/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Create `convex/lib/slug.test.ts` with this content:

```ts
import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips diacritics', () => {
    expect(slugify('Detección de variantes')).toBe('deteccion-de-variantes')
  })

  it('removes punctuation and collapses repeats', () => {
    expect(slugify('Foo!! ---  Bar??')).toBe('foo-bar')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  -hello-  ')).toBe('hello')
  })

  it('keeps numbers and hyphens', () => {
    expect(slugify('NGS-2026 v1')).toBe('ngs-2026-v1')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test convex/lib/slug.test.ts`
Expected: FAIL — module `./slug` not found.

- [ ] **Step 3: Implement `slugify`**

Create `convex/lib/slug.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test convex/lib/slug.test.ts`
Expected: PASS — all 6 cases green.

- [ ] **Step 5: Commit**

```bash
git add convex/lib/slug.ts convex/lib/slug.test.ts
git commit -m "feat(convex): add slugify helper with tests"
```

---

## Task 2: Extend `research` schema with slug and body

**Files:**

- Modify: `convex/schema.ts`

- [ ] **Step 1: Update the `research` table definition**

In `convex/schema.ts`, replace the existing `research: defineTable({...}),` block with:

```ts
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
```

- [ ] **Step 2: Push the schema to Convex dev**

Run: `bunx convex dev --once`
Expected: Schema deployed, no validation errors (existing rows have no slug/body, both optional).

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(convex): add slug and body fields to research table"
```

---

## Task 3: Add `getBySlug` query

**Files:**

- Modify: `convex/research.ts`

- [ ] **Step 1: Add the query**

Insert after the existing `get` query in `convex/research.ts`:

```ts
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('research')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
  },
})
```

- [ ] **Step 2: Verify Convex regenerates types**

Run: `bunx convex dev --once`
Expected: `convex/_generated/api.d.ts` updated, no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/research.ts convex/_generated
git commit -m "feat(convex): add getBySlug query for research"
```

---

## Task 4: Update `create` and `update` mutations to accept slug, body, and enforce uniqueness

**Files:**

- Modify: `convex/research.ts`

- [ ] **Step 1: Update the `create` mutation**

Replace the existing `create` mutation in `convex/research.ts` with:

```ts
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
```

- [ ] **Step 2: Update the `update` mutation**

Replace the existing `update` mutation with:

```ts
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
```

- [ ] **Step 3: Sync Convex types**

Run: `bunx convex dev --once`
Expected: Generated types updated with new args.

- [ ] **Step 4: Commit**

```bash
git add convex/research.ts convex/_generated
git commit -m "feat(convex): accept slug and body in research mutations with uniqueness check"
```

---

## Task 5: Add `backfillSlugs` mutation

**Files:**

- Modify: `convex/research.ts`

- [ ] **Step 1: Add the import**

At the top of `convex/research.ts`, add:

```ts
import { slugify } from './lib/slug'
```

- [ ] **Step 2: Append the backfill mutation at the end of `convex/research.ts`**

```ts
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
```

- [ ] **Step 3: Sync Convex types**

Run: `bunx convex dev --once`
Expected: `backfillSlugs` appears in generated `api`.

- [ ] **Step 4: Commit**

```bash
git add convex/research.ts convex/_generated
git commit -m "feat(convex): add backfillSlugs admin mutation"
```

---

## Task 6: Update `seedResearch` to write slug and a sample body

**Files:**

- Modify: `convex/research.ts`

- [ ] **Step 1: Replace the seed insert**

In `convex/research.ts`, replace the entire `seedResearch` mutation body (the part inside `handler`) with:

```ts
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("research").collect();
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("research", {
      title: {
        es: "Pipeline para detección de variantes somáticas en cohortes pequeñas",
        en: "Pipeline for somatic variant detection in small cohorts",
      },
      description: {
        es: "Framework reproducible para identificar variantes de alto impacto con control de calidad automatizado.",
        en: "Reproducible framework to identify high-impact variants with automated quality control.",
      },
      body: {
        es: "## Motivación\n\nLas cohortes pequeñas presentan retos particulares para la detección de variantes somáticas debido al ruido estadístico.\n\n## Método\n\nEl pipeline integra control de calidad automatizado y filtrado por confianza.",
        en: "## Motivation\n\nSmall cohorts present unique challenges for somatic variant detection due to statistical noise.\n\n## Method\n\nThe pipeline integrates automated quality control and confidence-based filtering.",
      },
      slug: "pipeline-somatic-variant-detection-small-cohorts",
      authors: ["A. Ruiz", "J. Salinas", "L. Mendez"],
      publicationDate: "2026-02-20",
      url: "https://doi.org/10.0000/genobit.2026.001",
      imageUrl: researchImage,
      galleryImageUrls: [researchImage],
      tags: ["Genómica", "Pipelines", "NGS"],
    });

    return { inserted: 1, deleted: existing.length };
  },
```

- [ ] **Step 2: Sync Convex types**

Run: `bunx convex dev --once`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add convex/research.ts
git commit -m "feat(convex): seed research with slug and sample markdown body"
```

---

## Task 7: Add markdown rendering dependencies

**Files:**

- Modify: `package.json`, `bun.lock`

- [ ] **Step 1: Install dependencies**

Run: `bun add react-markdown remark-gfm`
Expected: `package.json` and `bun.lock` updated; both packages added to `dependencies`.

- [ ] **Step 2: Verify install**

Run: `grep -E "react-markdown|remark-gfm" package.json`
Expected: Both lines present.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add react-markdown and remark-gfm"
```

---

## Task 8: Create `MarkdownBody` component

**Files:**

- Create: `src/components/MarkdownBody.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/MarkdownBody.tsx`:

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="research-body-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MarkdownBody.tsx
git commit -m "feat: add MarkdownBody component"
```

---

## Task 9: Add i18n strings for the detail page

**Files:**

- Modify: `src/i18n/strings.ts`

- [ ] **Step 1: Add the new keys**

In `src/i18n/strings.ts`, find the `// Research page` block and insert these entries just before the closing `// Archive page` comment (i.e., right after `"research.placeholder": ...,`):

```ts
  "research.detail.back": { es: "Volver a papers", en: "Back to papers" },
  "research.detail.readOriginal": { es: "Leer original", en: "Read original" },
  "research.detail.notFound": { es: "No se encontró el paper", en: "Paper not found" },
  "research.detail.gallery": { es: "Galería", en: "Gallery" },
```

- [ ] **Step 2: Verify it type-checks**

Run: `bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "feat(i18n): add research detail page strings"
```

---

## Task 10: Wrap listing cards in Link and drop external button

**Files:**

- Modify: `src/routes/research.tsx`

- [ ] **Step 1: Update imports**

At the top of `src/routes/research.tsx`, change:

```ts
import { createFileRoute } from '@tanstack/react-router'
```

to:

```ts
import { createFileRoute, Link } from '@tanstack/react-router'
```

- [ ] **Step 2: Replace the paper rendering block**

In `src/routes/research.tsx`, replace the entire `papers.map(...)` block (the `<div className="reveal-on-scroll visible">{...}</div>` that maps papers) with:

```tsx
<div className="reveal-on-scroll visible">
  {papers
    .filter((p) => Boolean(p.slug))
    .map((paper, idx) => {
      const title = tField(paper.title, lang)
      return (
        <Link
          key={paper._id}
          to="/research/$slug"
          params={{ slug: paper.slug as string }}
          className="research-item research-item-link stagger-child"
        >
          <div className="research-index">
            № {String(idx + 1).padStart(3, '0')}
          </div>
          {paper.imageUrl ? (
            <img src={paper.imageUrl} alt={title} className="research-image" />
          ) : (
            <div
              className="research-image"
              style={{
                background: `linear-gradient(135deg, rgba(0, 112, 111, ${0.18 + (idx % 3) * 0.05}), rgba(217, 119, 87, ${0.1 + (idx % 2) * 0.06}))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--display)',
                  fontVariationSettings: '"opsz" 96, "wdth" 90, "wght" 720',
                  fontSize: '2.4rem',
                  letterSpacing: '-0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(14, 23, 23, 0.18)',
                }}
              >
                {t('research.placeholder')}
              </span>
            </div>
          )}
          <div className="research-body">
            <div className="research-tags">
              {paper.tags?.map((tag) => (
                <span key={tag} className="editorial-badge">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="research-title">{title}</h2>
            <p className="research-meta">
              {paper.authors.join(' · ')}
              {paper.publicationDate ? ` — ${paper.publicationDate}` : ''}
            </p>
            <p className="research-desc">{tField(paper.description, lang)}</p>
          </div>
        </Link>
      )
    })}
</div>
```

- [ ] **Step 3: Type-check and run dev**

Run: `bunx tsc --noEmit`
Expected: No errors. (The `to="/research/$slug"` reference will be valid after Task 11 generates the route.)

If TS complains about the unknown route at this stage, proceed to Task 11; the route tree regenerates and resolves it.

- [ ] **Step 4: Commit**

```bash
git add src/routes/research.tsx
git commit -m "feat(research): wrap listing cards as links to detail page"
```

---

## Task 11: Create the detail route `/research/$slug`

**Files:**

- Create: `src/routes/research.$slug.tsx`

- [ ] **Step 1: Create the route file**

Create `src/routes/research.$slug.tsx`:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'
import { MarkdownBody } from '@/components/MarkdownBody'

export const Route = createFileRoute('/research/$slug')({
  component: ResearchDetailPage,
})

function ResearchDetailPage() {
  const { slug } = Route.useParams()
  const { lang, t } = useLang()
  const paper = useQuery(api.research.getBySlug, { slug })

  if (paper === undefined) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <div
                className="skeleton"
                style={{ width: '60%', height: '48px', marginBottom: '16px' }}
              />
              <div
                className="skeleton"
                style={{ width: '40%', height: '20px' }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (paper === null) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <h1 className="page-title">{t('research.detail.notFound')}</h1>
              <Link to="/research" className="editorial-btn">
                ← {t('research.detail.back')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const title = tField(paper.title, lang)
  const body = paper.body ? tField(paper.body, lang) : ''

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="page-header-content">
            <Link to="/research" className="mono-label research-detail-back">
              ← {t('research.detail.back')}
            </Link>
            {paper.imageUrl && (
              <img
                src={paper.imageUrl}
                alt={title}
                className="research-detail-hero"
              />
            )}
            <h1 className="page-title">{title}</h1>
            <p className="research-meta research-detail-meta">
              {paper.authors.join(' · ')}
              {paper.publicationDate ? ` — ${paper.publicationDate}` : ''}
            </p>
            {paper.tags && paper.tags.length > 0 && (
              <div className="research-tags">
                {paper.tags.map((tag) => (
                  <span key={tag} className="editorial-badge">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="page-lead">{tField(paper.description, lang)}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {body && <MarkdownBody>{body}</MarkdownBody>}

          {paper.url && (
            <div className="research-detail-actions">
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-btn"
              >
                {t('research.detail.readOriginal')}
              </a>
            </div>
          )}

          {paper.galleryImageUrls && paper.galleryImageUrls.length > 0 && (
            <div className="research-detail-gallery">
              <h2 className="mono-label">— {t('research.detail.gallery')}</h2>
              <div className="research-detail-gallery-grid">
                {paper.galleryImageUrls.map((url, i) => (
                  <img key={i} src={url} alt="" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Regenerate the route tree**

Run: `bun run dev` in the background until the TanStack Router plugin regenerates `src/routeTree.gen.ts`, then stop the dev server.

Alternative if the dev plugin doesn't auto-write: `bunx tsr generate` (TanStack Router CLI).

Expected: `src/routeTree.gen.ts` now contains a `ResearchSlug` route entry.

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: No errors. The `Link` in `research.tsx` from Task 10 now type-checks against the new route.

- [ ] **Step 4: Commit**

```bash
git add src/routes/research.$slug.tsx src/routeTree.gen.ts
git commit -m "feat: add research detail page route"
```

---

## Task 12: Add styles for the detail page and clickable cards

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1: Append detail-page styles**

At the end of `src/styles.css`, append:

```css
/* ═══════════ RESEARCH DETAIL ═══════════ */

.research-item-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.research-item-link:hover .research-title {
  color: var(--gb-warm);
}

.research-detail-back {
  display: inline-block;
  margin-bottom: 24px;
  color: var(--gb-warm);
  text-decoration: none;
}

.research-detail-back:hover {
  color: var(--gb-ink);
}

.research-detail-hero {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border: 1px solid var(--gb-rule);
  margin-bottom: 32px;
  filter: grayscale(0.4) contrast(1.05);
}

.research-detail-meta {
  margin-bottom: 16px;
}

.research-body-prose {
  font-family: var(--body);
  font-size: 1.05rem;
  color: var(--gb-ink-soft);
  line-height: 1.75;
  max-width: 64ch;
}

.research-body-prose h2 {
  font-family: var(--display);
  font-variation-settings:
    'opsz' 48,
    'wdth' 95,
    'wght' 640;
  font-size: clamp(1.4rem, 2vw, 1.75rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--gb-ink);
  margin: 40px 0 16px;
}

.research-body-prose h3 {
  font-family: var(--display);
  font-variation-settings:
    'opsz' 36,
    'wdth' 95,
    'wght' 600;
  font-size: 1.25rem;
  color: var(--gb-ink);
  margin: 32px 0 12px;
}

.research-body-prose p {
  margin: 0 0 18px;
}

.research-body-prose ul,
.research-body-prose ol {
  margin: 0 0 18px;
  padding-left: 22px;
}

.research-body-prose li {
  margin-bottom: 6px;
}

.research-body-prose a {
  color: var(--gb-warm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.research-body-prose code {
  font-family: var(--mono);
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.04);
  padding: 1px 6px;
  border-radius: 2px;
}

.research-body-prose pre {
  font-family: var(--mono);
  background: rgba(0, 0, 0, 0.04);
  padding: 16px;
  overflow-x: auto;
  margin: 0 0 18px;
  border: 1px solid var(--gb-rule);
}

.research-body-prose img {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--gb-rule);
  margin: 16px 0;
}

.research-detail-actions {
  margin: 40px 0;
}

.research-detail-gallery {
  margin-top: 56px;
}

.research-detail-gallery .mono-label {
  display: block;
  margin-bottom: 16px;
}

.research-detail-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.research-detail-gallery-grid img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border: 1px solid var(--gb-rule);
}
```

- [ ] **Step 2: Verify the dev server renders without CSS errors**

Run: `bun run dev` and visit `http://localhost:3000/research`. Click a paper.
Expected: Listing cards are clickable; detail page renders with hero, title, meta, description, markdown body, gallery.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat(styles): add research detail page styles and link hover"
```

---

## Task 13: Update admin form — slug and body fields

**Files:**

- Modify: `src/routes/admin/research.tsx`

- [ ] **Step 1: Update imports and add `useEffect` + `useState`**

At the top of `src/routes/admin/research.tsx`, change the existing `import { useState } from 'react'` line to:

```tsx
import { useEffect, useState } from 'react'
```

And add this import below the existing field imports:

```tsx
import { slugify } from '../../../convex/lib/slug'
```

- [ ] **Step 2: Update the Zod schema**

Replace the existing `researchSchema` block with:

```ts
const researchSchema = z.object({
  title: bilingual,
  description: bilingual,
  body: bilingual.optional(),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  authors: z.array(z.string()).min(1, 'Al menos un autor'),
  publicationDate: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})
```

- [ ] **Step 3: Update `defaultValues` and `ResearchDoc`**

Replace the existing `defaultValues` const with:

```ts
const defaultValues: ResearchFormValues = {
  title: { es: '', en: '' },
  description: { es: '', en: '' },
  body: { es: '', en: '' },
  slug: '',
  authors: [''],
  publicationDate: '',
  url: '',
  imageUrl: '',
  galleryImageUrls: [],
  tags: [],
}
```

Replace the existing `ResearchDoc` type with:

```ts
type ResearchDoc = {
  _id: Id<'research'>
  title: { es: string; en: string }
  description: { es: string; en: string }
  body?: { es: string; en: string }
  slug?: string
  authors: Array<string>
  publicationDate?: string
  url?: string
  imageUrl?: string
  galleryImageUrls?: Array<string>
  tags?: Array<string>
}
```

- [ ] **Step 4: Update the submit payload**

Inside `AdminResearchPage`, replace the existing `payload` object inside the `onSubmit` handler with:

```ts
const body =
  values.body && (values.body.es.trim() || values.body.en.trim())
    ? values.body
    : undefined
const payload = {
  title: values.title,
  description: values.description,
  body,
  slug: values.slug.trim(),
  authors,
  publicationDate: cleanOptional(values.publicationDate),
  url: cleanOptional(values.url),
  imageUrl: cleanOptional(values.imageUrl),
  galleryImageUrls: values.galleryImageUrls?.length
    ? values.galleryImageUrls
    : undefined,
  tags: cleanList(values.tags).length ? cleanList(values.tags) : undefined,
}
```

- [ ] **Step 5: Update `ResearchForm` defaults to include slug + body**

Inside `ResearchForm`, replace the existing `defaultValues` argument to `useForm` with:

```ts
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          body: initial.body ?? { es: '', en: '' },
          slug: initial.slug ?? '',
          authors: initial.authors.length ? initial.authors : [''],
          publicationDate: initial.publicationDate ?? '',
          url: initial.url ?? '',
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
          tags: initial.tags ?? [],
        }
      : defaultValues,
```

- [ ] **Step 6: Add slug auto-sync effect inside `ResearchForm`**

Add this block inside `ResearchForm`, immediately after the `const form = useForm(...)` call:

```tsx
const [slugDirty, setSlugDirty] = useState(Boolean(initial?.slug))
const titleEn = form.watch('title.en')
const slugValue = form.watch('slug')

useEffect(() => {
  if (!slugDirty) {
    const generated = slugify(titleEn ?? '')
    if (generated !== slugValue) {
      form.setValue('slug', generated, {
        shouldValidate: false,
        shouldDirty: false,
      })
    }
  }
}, [titleEn, slugDirty, slugValue, form])
```

- [ ] **Step 7: Render the slug and body fields in the form**

Inside `ResearchForm`'s returned JSX, find the line with `<FieldBilingualTextarea<ResearchFormValues> name="description" ...` and insert these two field blocks **after** that description field:

```tsx
        <div onInput={() => setSlugDirty(true)}>
          <FieldText<ResearchFormValues>
            name="slug"
            label="Slug (URL)"
            placeholder="ej. pipeline-somatic-variants"
            required
          />
        </div>
        <FieldBilingualTextarea<ResearchFormValues>
          name="body"
          label="Cuerpo (Markdown)"
          description="Markdown soportado: encabezados, listas, enlaces, imágenes."
          rows={16}
        />
```

- [ ] **Step 8: Type-check and run admin form locally**

Run: `bunx tsc --noEmit`
Expected: No errors.

Then run: `bun run dev`, navigate to `/admin/research`, create a new paper, type an English title.
Expected: Slug field auto-populates as you type. Editing the slug stops the auto-sync. Submitting saves slug + body. Editing existing rows shows the saved slug; auto-sync is off because `slugDirty` starts true when `initial?.slug` exists.

- [ ] **Step 9: Commit**

```bash
git add src/routes/admin/research.tsx
git commit -m "feat(admin): add slug and body fields to research form"
```

---

## Task 14: Run backfill and final smoke test

**Files:** None modified.

- [ ] **Step 1: Backfill slugs for existing rows**

In the Convex dashboard (or via the admin UI if a button exists; otherwise run from a Convex shell session), run the `backfillSlugs` mutation while logged in as admin. From a JS console with a valid session token:

```js
await convex.mutation('research:backfillSlugs', { sessionToken: '<token>' })
```

Expected: Returns `{ patched: <n> }` where `n` is the number of pre-existing rows that lacked a slug.

- [ ] **Step 2: Verify the listing**

Visit `/research` in the running dev server. Every paper card should be clickable. Click one.
Expected: Detail page loads at `/research/<slug>` with title, hero (or gradient placeholder), meta, description, markdown body (if present), external link button (if URL set), and gallery (if any).

- [ ] **Step 3: Verify "not found" handling**

Visit `/research/this-slug-does-not-exist`.
Expected: "Paper not found" page with a "Back to papers" link.

- [ ] **Step 4: Verify language toggle**

Switch the site language to ES / EN on a detail page.
Expected: Title, description, body, and back/read-original/gallery labels switch languages.

- [ ] **Step 5: Run the test suite once more**

Run: `bun run test`
Expected: `slugify` tests still pass.

- [ ] **Step 6: No commit needed unless smoke test surfaces fixes.**

If issues emerge, fix and commit as targeted bug-fix commits.

---

## Self-Review (already performed)

- ✅ Spec coverage: every section of the spec maps to a task (slugify → 1; schema → 2; queries/mutations → 3, 4, 5; seed → 6; deps → 7; markdown component → 8; i18n → 9; listing changes → 10; detail route → 11; styles → 12; admin form → 13; migration → 14).
- ✅ No placeholders: every code step contains complete code.
- ✅ Type consistency: `slug` is `v.optional(v.string())` in schema, `v.string()` (required) in `create` args, `v.optional(v.string())` in `update` args. Form Zod requires it. Detail route filters out `null` from `getBySlug`. Listing filters rows missing `slug` before linking. `body` is `v.optional(bilingual)` everywhere.
- ✅ Index name `by_slug` is consistent in schema and query.
- ✅ Mutation names (`getBySlug`, `backfillSlugs`) match across Convex file and React callsites.
