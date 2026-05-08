# Papers as Blog Posts — Design

**Date:** 2026-05-08
**Status:** Approved (pending implementation plan)

## Goal

Turn research papers into clickable blog-post-style entries. The `/research` listing shows brief preview cards; clicking a card opens a dedicated detail page (`/research/$slug`) with full long-form content. Bilingual (es/en) support is preserved throughout.

## Schema changes

`convex/schema.ts` — `research` table gains two fields:

- `slug: v.string()` — required, URL-safe, unique. Used for detail-page routing.
- `body: v.optional(bilingual)` — long-form markdown content (`{ es: string, en: string }`). Optional so legacy rows without bodies still render (detail page falls back to showing the description).

Add a `by_slug` index on `["slug"]` for fast lookup and uniqueness enforcement.

## Convex functions (`convex/research.ts`)

- `get` — unchanged. Returns the full list for the listing page.
- `getBySlug({ slug })` — new query. Returns the single document or `null`.
- `create` / `update` — accept `slug` and `body`. Before insert/patch, query `by_slug` and throw if a different document already uses the slug.
- `seedResearch` — updated to write a slug for the seeded row.
- `backfillSlugs` — new admin-only one-shot mutation: iterates research docs missing a slug and patches in `slugify(title.en)`. Run once after the schema deploy.

A `slugify(text: string)` helper lives in `convex/lib/slug.ts` so the admin client, seed, and backfill share the same logic. Behavior: lowercase, strip accents (NFD normalize + remove combining marks), replace non-alphanumeric with `-`, collapse repeats, trim leading/trailing dashes.

## Admin (`src/routes/admin/research.tsx`)

Form additions:

- **Slug field** (`FieldText`). Default value is `slugify(title.en)`, recomputed live as the English title changes *until the user edits the slug field manually* — then auto-sync stops (tracked via a local "dirty" flag). Validation regex: `/^[a-z0-9-]+$/`. Required.
- **Body field** — bilingual markdown textarea using `FieldBilingualTextarea` with `rows={16}`. A small helper line below reads "Markdown supported (headings, lists, links, images)."

The Zod schema is updated accordingly: `slug` required and regex-validated; `body` optional bilingual.

## Listing page (`src/routes/research.tsx`)

- Each `.research-item` is wrapped in TanStack Router's `<Link to="/research/$slug" params={{ slug: paper.slug }}>`.
- The external "Read" button on the card is removed — the whole card navigates.
- All other content remains: image, tags, title, authors + date, description (option C from brainstorm).
- Card hover state added in `src/styles.css` (subtle elevation/cursor change) to signal interactivity.

## Detail page (new: `src/routes/research.$slug.tsx`)

Route uses `loader` to call `api.research.getBySlug` (or `useQuery` inside the component, matching the existing pattern used by sibling routes).

Layout (top to bottom, inside `site-container`):

1. **Hero image** — full-width within the container. Falls back to the same gradient placeholder used in the listing when `imageUrl` is absent.
2. **Title** — `page-title` style.
3. **Meta row** — authors · publication date · tags (existing `editorial-badge` style).
4. **Description** — rendered as a lede paragraph (`page-lead` style).
5. **Markdown body** — `react-markdown` + `remark-gfm`. Wrapped in `.research-body-prose` with editorial typography that matches the site's existing serif/display styles.
6. **External link button** — `editorial-btn` labeled "Read original" / "Leer original", shown only when `paper.url` is set.
7. **Gallery grid** — when `galleryImageUrls` is non-empty, render a responsive grid below the body under a small "Gallery" / "Galería" heading.

States:

- **Loading** (`paper === undefined`) — skeleton matching the listing's skeleton style.
- **Not found** (`paper === null`) — render a simple "Paper not found" message with a link back to `/research`.

## Dependencies

Add to `package.json`:

- `react-markdown`
- `remark-gfm`

## i18n strings (`src/i18n/strings.ts`)

New keys (es / en):

- `research.detail.back` — "Volver a papers" / "Back to papers"
- `research.detail.readOriginal` — "Leer original" / "Read original"
- `research.detail.notFound` — "No se encontró el paper" / "Paper not found"
- `research.detail.gallery` — "Galería" / "Gallery"

## Migration

After the schema with `slug` is deployed:

1. Run `backfillSlugs` (admin-only mutation) to populate slugs for any pre-existing rows.
2. Confirm uniqueness — if `slugify(title.en)` collides between two rows, `backfillSlugs` should append a numeric suffix (`-2`, `-3`, …) to the second occurrence.

## Out of scope

- SEO meta tags / Open Graph for the detail page (can be follow-up).
- Comments, reactions, or any social features.
- WYSIWYG editor — markdown textarea is sufficient.
- Search/filter on the listing page.
