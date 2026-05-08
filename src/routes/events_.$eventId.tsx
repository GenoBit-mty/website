import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'
import { EventLightbox } from '@/components/EventLightbox'

export const Route = createFileRoute('/events_/$eventId')({
  component: EventDetailPage,
})

const BACK_LINK =
  'mb-8 inline-block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--gb-ink-mute)] no-underline transition-colors duration-200 hover:text-[var(--gb-ink)]'

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
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <div className="skeleton" style={{ width: '120px', height: '14px' }} />
              <div className="skeleton" style={{ width: '70%', height: '48px' }} />
              <div className="skeleton" style={{ width: '40%', height: '14px' }} />
            </div>
          </div>
        </div>
        <section className="section-spacing">
          <div className="site-container">
            <div className="skeleton" style={{ width: '100%', height: '420px' }} />
          </div>
        </section>
      </main>
    )
  }

  if (event === null) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <Link to="/events" className={BACK_LINK}>
                {t('events.detail.back')}
              </Link>
              <h1 className="page-title"><em>{t('events.detail.notFound')}</em></h1>
            </div>
          </div>
        </div>
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
      <div className="page-header">
        <div className="site-container">
          <div className="page-header-content">
            <Link to="/events" className={BACK_LINK}>
              {t('events.detail.back')}
            </Link>

            {event.category && <span className="mono-label">{event.category}</span>}
            <h1 className="page-title">
              <em>{title}</em>
            </h1>

            <div className="mb-6 flex flex-wrap items-center gap-4">
              <span className={`editorial-badge ${event.isUpcoming ? 'active' : ''}`}>
                {event.isUpcoming ? t('events.upcoming') : t('events.past')}
              </span>
              <span className="font-[family-name:var(--mono)] text-[0.7rem] tracking-[0.16em] uppercase text-[var(--gb-ink-mute)]">
                {event.date}
              </span>
              <span className="font-[family-name:var(--mono)] text-[0.7rem] tracking-[0.14em] uppercase text-[var(--gb-ink-mute)] inline-flex items-center gap-1.5">
                <LocationIcon title={t('events.location.alt')} />
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={title}
              className="mb-[clamp(28px,3vw,40px)] max-h-[520px] w-full border border-[var(--gb-rule)] object-cover"
            />
          )}

          {paragraphs.length > 0 && (
            <div className="mb-[clamp(40px,5vw,64px)] max-w-[68ch] font-sans text-[1.05rem] leading-[1.7] text-[var(--gb-ink-soft)] [&_p+p]:mt-[1.1em]">
              {paragraphs.map((para) => (
                <p key={`${event._id}-${para}`}>{para}</p>
              ))}
            </div>
          )}

          {showGallery && (
            <div>
              <h2 className="events-section-heading">{t('events.detail.gallery')}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className="aspect-[4/3] cursor-pointer overflow-hidden border border-[var(--gb-rule)] bg-transparent p-0 transition-[border-color_300ms_ease,transform_400ms_cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[var(--gb-ink)]"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`${title} — ${i + 1}`}
                  >
                    <img src={src} alt="" className="block h-full w-full object-cover" />
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
