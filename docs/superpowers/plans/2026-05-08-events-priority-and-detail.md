# Events Priority Layout and Past-Event Detail Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/events` so upcoming events get a hero treatment and past events become a clickable secondary archive that links to a dedicated detail page (`/events/$eventId`) showing the full description and a gallery lightbox.

**Architecture:** Add a single `getById` Convex query. Sort and split upcoming/past on the client. Refactor `src/routes/events.tsx` into two sections — a hero card + grid for upcoming, a compact clickable grid for past. Add a new file-based route `src/routes/events.$eventId.tsx` that renders the editorial detail layout with an inline lightbox component (no new dependency). Add bilingual strings and new CSS classes. No schema changes.

**Tech Stack:** Convex (new query), TanStack Start/Router (file-based routes, `<Link>`), React 19 (useState for lightbox), Vitest (unit tests for the date-key helper), existing editorial CSS in `src/styles.css`.

**Spec:** `docs/superpowers/specs/2026-05-08-events-priority-and-detail-design.md`

---

## File Structure

**Create:**
- `src/lib/eventSort.ts` — pure helpers `dateKey(s)` and `partitionEvents(events)` for client-side splitting/sorting.
- `src/lib/eventSort.test.ts` — Vitest unit tests.
- `src/routes/events.$eventId.tsx` — past-event detail page (file-based TanStack route).
- `src/components/EventLightbox.tsx` — controlled lightbox overlay component.

**Modify:**
- `convex/events.ts` — add `getById` query.
- `src/routes/events.tsx` — refactor to upcoming hero + grid + past compact grid, with `<Link>` wrapping each past card.
- `src/i18n/strings.ts` — add new bilingual strings.
- `src/styles.css` — add `.event-card-hero`, `.events-past-grid`, `.event-card-compact`, `.events-section-heading`, `.event-detail-*`, `.event-lightbox*`.

**Untouched:**
- `convex/schema.ts` — already has `imageUrl`, `galleryImageUrls`, `category`, etc.
- The admin events page — gallery editing already works there.

---

## Task 1: Add `getById` Convex query

**Files:**
- Modify: `convex/events.ts`

- [ ] **Step 1: Add the query**

Open `convex/events.ts`. After the existing `getUpcoming` block (around line 22), add:

```ts
export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

The imports at the top of the file already cover `v`, `query`, etc.

- [ ] **Step 2: Regenerate Convex types**

Run: `bun convex codegen`
Expected: Updates `convex/_generated/api.d.ts` so `api.events.getById` is callable from the client. No errors.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `bun tsc --noEmit`
Expected: PASS (no TS errors). If errors mention `_generated`, re-run codegen first.

- [ ] **Step 4: Commit**

```bash
git add convex/events.ts convex/_generated/
git commit -m "feat(convex): add events.getById query"
```

---

## Task 2: Add `eventSort` helpers with tests (TDD)

**Files:**
- Create: `src/lib/eventSort.ts`
- Create: `src/lib/eventSort.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/eventSort.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { dateKey, partitionEvents } from './eventSort'

type TestEvent = { _id: string; date: string; isUpcoming: boolean }

describe('dateKey', () => {
  it('extracts YYYY-MM-DD prefix', () => {
    expect(dateKey('2026-05-12 · 18:00')).toBe('2026-05-12')
  })

  it('returns the input untouched when shorter than 10 chars', () => {
    expect(dateKey('2026')).toBe('2026')
  })
})

describe('partitionEvents', () => {
  const events: TestEvent[] = [
    { _id: 'a', date: '2026-07-18 · 09:00', isUpcoming: true },
    { _id: 'b', date: '2026-05-12 · 18:00', isUpcoming: true },
    { _id: 'c', date: '2026-06-03 · 19:30', isUpcoming: true },
    { _id: 'd', date: '2026-03-22 · 17:00', isUpcoming: false },
    { _id: 'e', date: '2025-11-08 · 16:00', isUpcoming: false },
    { _id: 'f', date: '2026-02-14 · 10:00', isUpcoming: false },
  ]

  it('splits into upcoming and past arrays', () => {
    const { upcoming, past } = partitionEvents(events)
    expect(upcoming.map((e) => e._id)).toEqual(['b', 'c', 'a'])
    expect(past.map((e) => e._id)).toEqual(['d', 'f', 'e'])
  })

  it('sorts upcoming soonest-first', () => {
    const { upcoming } = partitionEvents(events)
    expect(upcoming[0]._id).toBe('b')
  })

  it('sorts past most-recent-first', () => {
    const { past } = partitionEvents(events)
    expect(past[0]._id).toBe('d')
  })

  it('handles empty arrays', () => {
    expect(partitionEvents([])).toEqual({ upcoming: [], past: [] })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/eventSort.test.ts`
Expected: FAIL — module `./eventSort` not found.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/eventSort.ts`:

```ts
export function dateKey(s: string): string {
  return s.length >= 10 ? s.slice(0, 10) : s
}

export function partitionEvents<T extends { date: string; isUpcoming: boolean }>(
  events: ReadonlyArray<T>,
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = []
  const past: T[] = []
  for (const e of events) {
    if (e.isUpcoming) upcoming.push(e)
    else past.push(e)
  }
  upcoming.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
  past.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
  return { upcoming, past }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/eventSort.test.ts`
Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/eventSort.ts src/lib/eventSort.test.ts
git commit -m "feat(events): add partitionEvents and dateKey helpers"
```

---

## Task 3: Add i18n strings for new sections and detail page

**Files:**
- Modify: `src/i18n/strings.ts`

- [ ] **Step 1: Add new entries**

Open `src/i18n/strings.ts`. Find the existing events block (around line 120, starting with `"events.header.eyebrow"`). After the line `"events.location.alt": { es: "Ubicación", en: "Location" },` add:

```ts
  "events.section.upcoming": { es: "Próximos eventos", en: "Upcoming events" },
  "events.section.past": { es: "Eventos pasados", en: "Past events" },
  "events.empty.upcoming": { es: "Próximamente", en: "Coming soon" },
  "events.detail.back": { es: "← Volver a eventos", en: "← Back to events" },
  "events.detail.gallery": { es: "Galería", en: "Gallery" },
  "events.detail.notFound": { es: "Evento no encontrado", en: "Event not found" },
  "events.detail.lightbox.close": { es: "Cerrar", en: "Close" },
  "events.detail.lightbox.prev": { es: "Anterior", en: "Previous" },
  "events.detail.lightbox.next": { es: "Siguiente", en: "Next" },
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `bun tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "feat(i18n): add events section and detail strings"
```

---

## Task 4: Add CSS for new layout classes

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Append new event styles**

Open `src/styles.css`. Find the `/* ═══════════ EVENT CARDS ═══════════ */` section (around line 1825). After the closing of `.event-card .event-date` block (around line 1936, end of the existing event card styles, just before the `/* ═══════════ ADMIN / ARCHIVE CARDS ═══════════ */` comment), add:

```css
/* ─── Section heading shared by upcoming/past ─── */
.events-section-heading {
    font-family: var(--display);
    font-variation-settings: "opsz" 48, "wdth" 92, "wght" 640;
    font-size: clamp(1.6rem, 2.4vw, 2.2rem);
    letter-spacing: -0.025em;
    color: var(--gb-ink);
    margin: 0 0 24px 0;
}

.events-section-heading + .events-grid,
.events-section-heading + .events-past-grid,
.events-section-heading + .event-card-hero {
    margin-top: 8px;
}

.events-section-block + .events-section-block {
    margin-top: clamp(48px, 6vw, 88px);
}

/* ─── Upcoming hero card ─── */
.event-card-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 0;
    background: rgba(255, 253, 247, 0.85);
    border: 1px solid var(--gb-rule);
    overflow: hidden;
    margin-bottom: clamp(24px, 3vw, 36px);
    transition: border-color 0.3s ease, box-shadow 0.4s ease;
}

.event-card-hero:hover {
    border-color: var(--gb-ink);
    box-shadow: 0 18px 40px -28px rgba(14, 23, 23, 0.22);
}

.event-card-hero .event-image-wrap {
    position: relative;
    overflow: hidden;
    min-height: 320px;
}

.event-card-hero .event-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(0.5) contrast(1.05);
    transition: filter 0.5s ease;
}

.event-card-hero:hover .event-image {
    filter: grayscale(0);
}

.event-card-hero .event-date-block {
    position: absolute;
    top: 20px;
    left: 20px;
    background: var(--gb-paper);
    border: 1px solid var(--gb-ink);
    padding: 12px 16px;
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gb-ink);
    z-index: 2;
    font-variant-numeric: tabular-nums;
}

.event-card-hero .event-body {
    padding: clamp(28px, 3vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    justify-content: center;
}

.event-card-hero .event-title {
    font-family: var(--display);
    font-variation-settings: "opsz" 60, "wdth" 92, "wght" 640;
    font-size: clamp(1.8rem, 2.6vw, 2.6rem);
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--gb-ink);
    margin: 0;
}

@media (max-width: 760px) {
    .event-card-hero {
        grid-template-columns: 1fr;
    }
    .event-card-hero .event-image-wrap {
        min-height: 220px;
    }
}

/* ─── Past events compact grid ─── */
.events-past-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: clamp(16px, 1.6vw, 22px);
}

.event-card-compact {
    display: flex;
    flex-direction: column;
    background: rgba(255, 253, 247, 0.7);
    border: 1px solid var(--gb-rule);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.4s ease;
    cursor: pointer;
}

.event-card-compact:hover {
    border-color: var(--gb-ink);
    transform: translateY(-3px);
    box-shadow: 0 14px 30px -24px rgba(14, 23, 23, 0.22);
}

.event-card-compact .event-image-wrap {
    position: relative;
    overflow: hidden;
}

.event-card-compact .event-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    filter: grayscale(0.85) contrast(1.05);
    transition: filter 0.5s ease, transform 0.6s ease;
}

.event-card-compact:hover .event-image {
    filter: grayscale(0.2);
    transform: scale(1.04);
}

.event-card-compact .event-date-block {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--gb-paper);
    border: 1px solid var(--gb-ink);
    padding: 6px 10px;
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gb-ink);
    z-index: 2;
    font-variant-numeric: tabular-nums;
}

.event-card-compact .event-body {
    padding: 16px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.event-card-compact .event-title {
    font-family: var(--display);
    font-variation-settings: "opsz" 28, "wdth" 95, "wght" 620;
    font-size: 1.05rem;
    line-height: 1.18;
    letter-spacing: -0.02em;
    color: var(--gb-ink);
    margin: 0;
}

.event-card-compact .event-location {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gb-ink-mute);
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ─── Empty state line ─── */
.events-empty {
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gb-ink-mute);
    padding: 24px 0;
}

/* ─── Detail page ─── */
.event-detail-back {
    display: inline-block;
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gb-ink-mute);
    text-decoration: none;
    margin-bottom: 32px;
    transition: color 0.2s ease;
}

.event-detail-back:hover {
    color: var(--gb-ink);
}

.event-detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    margin-bottom: 24px;
}

.event-detail-hero-image {
    width: 100%;
    max-height: 520px;
    object-fit: cover;
    margin-bottom: clamp(28px, 3vw, 40px);
    border: 1px solid var(--gb-rule);
}

.event-detail-description {
    font-family: var(--body);
    font-size: 1.05rem;
    color: var(--gb-ink-soft);
    line-height: 1.7;
    max-width: 68ch;
    margin-bottom: clamp(40px, 5vw, 64px);
}

.event-detail-description p + p {
    margin-top: 1.1em;
}

.event-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
}

.event-gallery-thumb {
    border: 1px solid var(--gb-rule);
    background: transparent;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    transition: border-color 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.event-gallery-thumb:hover {
    border-color: var(--gb-ink);
    transform: translateY(-2px);
}

.event-gallery-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* ─── Lightbox ─── */
.event-lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(14, 23, 23, 0.92);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(16px, 4vw, 48px);
}

.event-lightbox-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 20px 60px -30px rgba(0, 0, 0, 0.6);
}

.event-lightbox-btn {
    position: absolute;
    background: var(--gb-paper);
    border: 1px solid var(--gb-ink);
    color: var(--gb-ink);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-family: var(--mono);
    font-size: 1rem;
    transition: background 0.2s ease, color 0.2s ease;
}

.event-lightbox-btn:hover {
    background: var(--gb-ink);
    color: var(--gb-paper);
}

.event-lightbox-btn.close { top: 24px; right: 24px; }
.event-lightbox-btn.prev  { left: 24px; top: 50%; transform: translateY(-50%); }
.event-lightbox-btn.next  { right: 24px; top: 50%; transform: translateY(-50%); }
```

- [ ] **Step 2: Verify build still works**

Run: `bun run build`
Expected: Build succeeds. (CSS is just appended; should not affect anything else.)

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat(styles): add hero, compact, and detail-page event styles"
```

---

## Task 5: Build the EventLightbox component

**Files:**
- Create: `src/components/EventLightbox.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/EventLightbox.tsx`:

```tsx
import { useEffect } from 'react'

type Props = {
  images: string[]
  activeIndex: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  labels: { close: string; prev: string; next: string }
}

export function EventLightbox({ images, activeIndex, onClose, onPrev, onNext, labels }: Props) {
  useEffect(() => {
    if (activeIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [activeIndex, onClose, onPrev, onNext])

  if (activeIndex === null) return null
  const src = images[activeIndex]
  if (!src) return null

  const showNav = images.length > 1

  return (
    <div
      className="event-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <img
        src={src}
        alt=""
        className="event-lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="event-lightbox-btn close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={labels.close}
      >
        ×
      </button>
      {showNav && (
        <>
          <button
            type="button"
            className="event-lightbox-btn prev"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label={labels.prev}
          >
            ‹
          </button>
          <button
            type="button"
            className="event-lightbox-btn next"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label={labels.next}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventLightbox.tsx
git commit -m "feat(events): add EventLightbox component"
```

---

## Task 6: Refactor `/events` listing into upcoming hero + past grid

**Files:**
- Modify: `src/routes/events.tsx`

- [ ] **Step 1: Replace the file contents**

Overwrite `src/routes/events.tsx` with:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'
import { partitionEvents } from '@/lib/eventSort'
import type { Doc } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

function LocationIcon({ title }: { title: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>{title}</title>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

type EventDoc = Doc<'events'>

function EventImage({ src, alt, placeholder }: { src?: string; alt: string; placeholder: string }) {
  if (src) return <img src={src} alt={alt} className="event-image" />
  return (
    <div
      className="event-image"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 112, 111, 0.16), rgba(217, 119, 87, 0.12))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--display)',
          fontVariationSettings: '"opsz" 96, "wdth" 90, "wght" 720',
          fontSize: '2.6rem',
          letterSpacing: '-0.05em',
          textTransform: 'uppercase',
          color: 'rgba(14, 23, 23, 0.18)',
        }}
      >
        {placeholder}
      </span>
    </div>
  )
}

function HeroCard({ event }: { event: EventDoc }) {
  const { lang, t } = useLang()
  const title = tField(event.title, lang)
  const description = tField(event.description, lang)
  const paragraphs = description ? description.split(/\n\n+/).filter(Boolean) : []
  return (
    <article className="event-card-hero">
      <div className="event-image-wrap">
        <span className="event-date-block">{event.date}</span>
        <EventImage src={event.imageUrl} alt={title} placeholder={t('events.placeholder')} />
      </div>
      <div className="event-body">
        <div className="event-header">
          <span className="editorial-badge active">{t('events.upcoming')}</span>
        </div>
        <h2 className="event-title">{title}</h2>
        <div className="event-location">
          <LocationIcon title={t('events.location.alt')} />
          {event.location}
        </div>
        {paragraphs.map((para, i) => (
          <p key={i} className="event-desc">{para}</p>
        ))}
        {event.registrationUrl && (
          <div style={{ marginTop: '12px' }}>
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-btn filled"
              style={{ display: 'inline-flex' }}
            >
              {t('events.register')}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}

function UpcomingGridCard({ event }: { event: EventDoc }) {
  const { lang, t } = useLang()
  const title = tField(event.title, lang)
  const description = tField(event.description, lang)
  const paragraphs = description ? description.split(/\n\n+/).filter(Boolean) : []
  return (
    <article className="event-card stagger-child">
      <div className="event-image-wrap">
        <span className="event-date-block">{event.date}</span>
        <EventImage src={event.imageUrl} alt={title} placeholder={t('events.placeholder')} />
      </div>
      <div className="event-body">
        <div className="event-header">
          <span className="editorial-badge active">{t('events.upcoming')}</span>
        </div>
        <h3 className="event-title">{title}</h3>
        <div className="event-location">
          <LocationIcon title={t('events.location.alt')} />
          {event.location}
        </div>
        {paragraphs.map((para, i) => (
          <p key={i} className="event-desc">{para}</p>
        ))}
        {event.registrationUrl && (
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-btn filled"
              style={{ display: 'inline-flex' }}
            >
              {t('events.register')}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}

function PastCard({ event }: { event: EventDoc }) {
  const { lang, t } = useLang()
  const title = tField(event.title, lang)
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event._id }}
      className="event-card-compact stagger-child"
    >
      <div className="event-image-wrap">
        <span className="event-date-block">{event.date}</span>
        <EventImage src={event.imageUrl} alt={title} placeholder={t('events.placeholder')} />
      </div>
      <div className="event-body">
        <h3 className="event-title">{title}</h3>
        <div className="event-location">
          <LocationIcon title={t('events.location.alt')} />
          {event.location}
        </div>
      </div>
    </Link>
  )
}

function EventsPage() {
  const { t } = useLang()
  const events = useQuery(api.events.get)

  if (events === undefined) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="sticky-type page-watermark">eventos</div>
            <div className="page-header-content">
              <span className="mono-label">{t('events.header.eyebrow')}</span>
              <h1 className="page-title"><em>{t('events.header.title')}</em></h1>
              <p className="page-lead">{t('events.header.lead')}</p>
            </div>
          </div>
        </div>
        <section className="section-spacing">
          <div className="site-container">
            <div className="skeleton" style={{ width: '100%', height: '320px', marginBottom: '40px' }} />
            <div className="events-past-grid">
              {['s1', 's2', 's3'].map((k) => (
                <div key={k} className="event-card-compact">
                  <div className="skeleton" style={{ width: '100%', height: '140px' }} />
                  <div style={{ padding: '16px' }}>
                    <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '50%', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  const { upcoming, past } = partitionEvents(events)
  const [hero, ...restUpcoming] = upcoming

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">eventos</div>
          <div className="page-header-content">
            <span className="mono-label">{t('events.header.eyebrow')}</span>
            <h1 className="page-title"><em>{t('events.header.title')}</em></h1>
            <p className="page-lead">{t('events.header.lead')}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container reveal-on-scroll visible">
          <div className="events-section-block">
            <h2 className="events-section-heading">{t('events.section.upcoming')}</h2>
            {hero ? (
              <>
                <HeroCard event={hero} />
                {restUpcoming.length > 0 && (
                  <div className="events-grid">
                    {restUpcoming.map((event) => (
                      <UpcomingGridCard key={event._id} event={event} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="events-empty">{t('events.empty.upcoming')}</p>
            )}
          </div>

          {past.length > 0 && (
            <div className="events-section-block">
              <h2 className="events-section-heading">{t('events.section.past')}</h2>
              <div className="events-past-grid">
                {past.map((event) => (
                  <PastCard key={event._id} event={event} />
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

The TanStack Router plugin auto-generates `src/routeTree.gen.ts` during dev/build. Run a build to make sure the existing tree still includes `/events`:

Run: `bun run build`
Expected: Build succeeds. (We haven't yet added `events.$eventId.tsx`, so only the listing route is regenerated.)

- [ ] **Step 3: Verify TS**

Run: `bun tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Smoke check the dev server**

Run: `bun run dev`
Open http://localhost:3000/events. Confirm:
- The first upcoming event renders as a wide hero card.
- Any other upcoming events render in a 2-column grid below.
- Past events render in a smaller 3-column grid below.
- Hovering a past card shows the cursor change and elevation.
- Clicking a past card produces a 404 currently (the detail route doesn't exist yet — that's expected and gets fixed in Task 7).

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/routes/events.tsx
git commit -m "feat(events): split listing into upcoming hero and past grid"
```

---

## Task 7: Add the `/events/$eventId` detail page

**Files:**
- Create: `src/routes/events.$eventId.tsx`

- [ ] **Step 1: Create the route**

Create `src/routes/events.$eventId.tsx`:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'
import { EventLightbox } from '@/components/EventLightbox'

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
})

function LocationIcon({ title }: { title: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>{title}</title>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function EventDetailPage() {
  const { eventId } = Route.useParams()
  const { lang, t } = useLang()
  const event = useQuery(api.events.getById, { id: eventId as Id<'events'> })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (event === undefined) {
    return (
      <main>
        <section className="section-spacing">
          <div className="site-container">
            <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '32px' }} />
            <div className="skeleton" style={{ width: '70%', height: '40px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '32px' }} />
            <div className="skeleton" style={{ width: '100%', height: '420px' }} />
          </div>
        </section>
      </main>
    )
  }

  if (event === null) {
    return (
      <main>
        <section className="section-spacing">
          <div className="site-container">
            <Link to="/events" className="event-detail-back">{t('events.detail.back')}</Link>
            <h1 className="page-title"><em>{t('events.detail.notFound')}</em></h1>
          </div>
        </section>
      </main>
    )
  }

  const title = tField(event.title, lang)
  const description = tField(event.description, lang)
  const paragraphs = description ? description.split(/\n\n+/).filter(Boolean) : []
  const gallery = event.galleryImageUrls ?? []
  const showGallery = gallery.length >= 2

  const closeLightbox = () => setActiveIndex(null)
  const prevImage = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
  const nextImage = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % gallery.length))

  return (
    <main>
      <section className="section-spacing">
        <div className="site-container">
          <Link to="/events" className="event-detail-back">{t('events.detail.back')}</Link>

          {event.category && <span className="mono-label">{event.category}</span>}
          <h1 className="page-title" style={{ marginTop: '12px' }}>
            <em>{title}</em>
          </h1>

          <div className="event-detail-meta">
            <span className={`editorial-badge ${event.isUpcoming ? 'active' : ''}`}>
              {event.isUpcoming ? t('events.upcoming') : t('events.past')}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gb-ink-mute)' }}>
              {event.date}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gb-ink-mute)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LocationIcon title={t('events.location.alt')} />
              {event.location}
            </span>
          </div>

          {event.imageUrl && (
            <img src={event.imageUrl} alt={title} className="event-detail-hero-image" />
          )}

          {paragraphs.length > 0 && (
            <div className="event-detail-description">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {showGallery && (
            <div>
              <h2 className="events-section-heading">{t('events.detail.gallery')}</h2>
              <div className="event-gallery-grid">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className="event-gallery-thumb"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`${title} — ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <EventLightbox
        images={gallery}
        activeIndex={activeIndex}
        onClose={closeLightbox}
        onPrev={prevImage}
        onNext={nextImage}
        labels={{
          close: t('events.detail.lightbox.close'),
          prev: t('events.detail.lightbox.prev'),
          next: t('events.detail.lightbox.next'),
        }}
      />
    </main>
  )
}
```

- [ ] **Step 2: Regenerate the route tree**

The TanStack Router plugin regenerates `src/routeTree.gen.ts` automatically during `dev` or `build`. Run:

Run: `bun run build`
Expected: Build succeeds. After this, `src/routeTree.gen.ts` should include a route for `/events/$eventId`. Confirm with:

`grep -n "events.\$eventId\\|events_eventId" src/routeTree.gen.ts`

Expected: At least one match.

- [ ] **Step 3: Verify TS**

Run: `bun tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Smoke check end-to-end**

Run: `bun run dev`
Open http://localhost:3000/events.

- Click a past-event card. The detail page should load with header, lead image, description, and (if 2+ gallery images) a gallery section.
- Click a gallery thumbnail. The lightbox should open. Press `ArrowRight` / `ArrowLeft` — the image should cycle. Press `Esc` — the lightbox should close. Click outside the image — the lightbox should close.
- Click "← Volver a eventos" — should return to `/events` without a full page reload.
- Manually visit `/events/invalid-id` — should render the "not found" message and back link.
- Toggle language (es ↔ en) — all new strings should switch.

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/routes/events.\$eventId.tsx src/routeTree.gen.ts
git commit -m "feat(events): add past-event detail page with gallery lightbox"
```

---

## Task 8: Final verification

**Files:** none

- [ ] **Step 1: Full test suite**

Run: `bun run test`
Expected: All tests PASS, including the new `eventSort` tests and the existing `slug` tests.

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: No new errors from files we touched.

- [ ] **Step 3: Production build**

Run: `bun run build`
Expected: Build succeeds.

- [ ] **Step 4: Manual acceptance walkthrough**

Run: `bun run dev`. Confirm against the spec's acceptance criteria:

- `/events` shows a hero upcoming card, a smaller upcoming grid (if any), and a compact past-events grid.
- Upcoming sorted soonest-first; past sorted most-recent-first.
- Past-event cards navigate via TanStack `<Link>` (no full page reload).
- Detail page renders title, description, lead image, and gallery with keyboard-dismissible lightbox.
- All new strings bilingual.
- Loading skeletons render on listing and detail pages.
- Invalid event ID shows "not found" + back link.

- [ ] **Step 5: Final commit (if needed)**

If the route tree regeneration produced changes that weren't already committed:

```bash
git add src/routeTree.gen.ts
git commit -m "chore: regenerate route tree after events detail route"
```

Otherwise nothing to do.
