import { createFileRoute, Link } from '@tanstack/react-router'
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
