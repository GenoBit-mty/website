# Events Page — Priority Layout and Past-Event Detail Pages

**Date:** 2026-05-08
**Status:** Approved (pending implementation plan)

## Goal

Restructure `/events` so that upcoming events get visual priority and past events become a secondary, browsable archive. Past events become clickable and open a dedicated detail page that shows the full description and gallery images. Bilingual (es/en) support is preserved throughout.

## Schema

No schema changes. The `events` table already has `imageUrl`, `galleryImageUrls: v.optional(v.array(v.string()))`, `category`, `description`, `isUpcoming`, etc. The detail page reads these directly.

## Convex functions (`convex/events.ts`)

- `get` — unchanged. Used by the listing page.
- `getById({ id })` — new query. Takes `v.id("events")` and returns the document or `null`.
- `getUpcoming` / `create` / `update` / `remove` — unchanged.

Sorting and the upcoming/past split are computed on the client (the dataset is small) so we don't need new queries.

## Listing page (`src/routes/events.tsx`)

### Data partitioning

After `useQuery(api.events.get)` resolves, derive:

- `upcoming = events.filter(e => e.isUpcoming).sort(byDateAscending)` — soonest first.
- `past = events.filter(e => !e.isUpcoming).sort(byDateDescending)` — most recent first.

Date strings in the seed look like `"2026-05-12 · 18:00"`. The first 10 chars are an ISO date and string-comparable, which is enough for chronological sort. Helper:

```ts
const dateKey = (s: string) => s.slice(0, 10) // "YYYY-MM-DD"
```

### Section 1 — Upcoming (hero treatment)

- Section heading: `events.section.upcoming` ("Próximos eventos" / "Upcoming events").
- The first upcoming event renders as a **hero card** (`event-card-hero`): wide layout with the image on the left and content (date block, badge, title, location, full description, register button) on the right. On narrow viewports, image stacks above content.
- Remaining upcoming events render in a **2-column grid** (`events-grid` reused) below the hero, using the existing card structure.
- Empty case: if no upcoming events, render a small placeholder line using `events.empty.upcoming` ("Próximamente / Coming soon") and skip directly to the past-events section.

### Section 2 — Past events (secondary grid)

- Section heading: `events.section.past` ("Eventos pasados" / "Past events").
- 3-column **compact grid** (`events-past-grid`) of smaller cards. Each card is a TanStack Router `<Link to="/events/$eventId" params={{ eventId: event._id }}>`.
- Card shows: thumbnail image, date block, title, location. **No description preview** (kept minimal).
- Card hover state (defined in `src/styles.css`) signals clickability — subtle elevation/cursor change, matching the pattern added for research cards.
- Empty case: if no past events, the section is hidden entirely.

### Skeletons

Loading state (`events === undefined`) renders a single hero skeleton followed by 3 small skeletons in the past grid, so the structure matches the loaded view.

## Detail page (new: `src/routes/events.$eventId.tsx`)

File-based route. TanStack file router resolves `/events` to `events.tsx` and `/events/:eventId` to `events.$eventId.tsx`.

### Data

`useQuery(api.events.getById, { id: eventId as Id<"events"> })`. Three states:

- `undefined` → skeleton.
- `null` → "Event not found" message + back link to `/events`. Use `events.notFound`.
- document → render.

### Layout (top to bottom, inside `site-container`)

1. **Back link** — "← Volver a eventos / Back to events" (`events.detail.back`), TanStack `<Link to="/events">`.
2. **Header block** — category eyebrow (`mono-label`), title in editorial display style, date + location row, "Past event" badge if `!isUpcoming`.
3. **Lead image** — full-width hero rendering of `imageUrl`. If absent, the same placeholder treatment used on the listing.
4. **Description** — full bilingual description, paragraph-split on `\n\n` (same logic as the current cards).
5. **Gallery section** — only if `galleryImageUrls` has 2+ images (the lead image is often the first gallery item, so showing a single-image gallery would duplicate the hero).
   - Heading: `events.detail.gallery` ("Galería" / "Gallery").
   - Responsive grid (3 columns desktop, 2 tablet, 1 mobile).
   - Each thumbnail is a button that opens a **lightbox**: full-resolution image centered on a dark backdrop. Closes on backdrop click and on `Esc`. Left/right keys cycle to prev/next image.
   - The lightbox is implemented inline in this file (no new dependency) — a simple controlled component holding `activeIndex: number | null` state and a fixed-position overlay.

### Edge cases

- Invalid ID format → Convex `useQuery` returns `null`; renders "not found".
- Document missing or deleted → same path.
- An `isUpcoming === true` event reached via direct URL still renders. We don't gate access — the detail route works for any event ID, the listing just only links past events.

## i18n additions (`src/i18n/strings.ts`)

```ts
"events.section.upcoming": { es: "Próximos eventos", en: "Upcoming events" },
"events.section.past": { es: "Eventos pasados", en: "Past events" },
"events.empty.upcoming": { es: "Próximamente", en: "Coming soon" },
"events.detail.back": { es: "← Volver a eventos", en: "← Back to events" },
"events.detail.gallery": { es: "Galería", en: "Gallery" },
"events.notFound": { es: "Evento no encontrado", en: "Event not found" },
```

## Styles (`src/styles.css`)

New / modified classes:

- `.event-card-hero` — wide flex/grid container, image takes ~55% width on desktop, stacks on mobile. Larger title size than the standard card.
- `.events-past-grid` — 3-column grid (responsive: 2 on tablet, 1 on mobile), tighter gap than `.events-grid`.
- `.event-card-compact` — smaller variant used inside `.events-past-grid`. No description, smaller image height (~140px), reduced padding. Hover: subtle elevation + `cursor: pointer`.
- `.events-section-heading` — section heading style (matches the editorial typography already in use).
- `.event-detail-hero` / `.event-detail-meta` / `.event-gallery-grid` / `.event-lightbox` — detail page layout.

All additions follow the existing editorial design language (no new font families, reuse existing CSS variables for color, spacing, typography).

## Out of scope

- Filtering by category or year.
- Pagination of past events.
- Comments / RSVPs / attendance tracking.
- Server-side rendering of the detail page meta tags.
- Deleting/editing the gallery from the public site (admin already supports it).

## Acceptance criteria

- `/events` shows a clear visual hierarchy: a hero upcoming card first, then a smaller upcoming grid (if any), then a compact past-events grid.
- Upcoming events sorted soonest-first; past events sorted most-recent-first.
- Past-event cards are clickable and navigate to `/events/$eventId` via TanStack Router (no full page reload).
- Detail page renders title, description, lead image, and a gallery whose thumbnails open a keyboard-dismissible lightbox.
- All new strings are bilingual and switch with the existing `useLang()` toggle.
- Loading skeletons render for both the listing and the detail page.
- Invalid event IDs render a graceful "Event not found" with a back link.
