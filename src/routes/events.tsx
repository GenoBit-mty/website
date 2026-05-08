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
      to="/events_/$eventId"
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
