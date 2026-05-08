import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'

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

function EventsPage() {
  const { lang, t } = useLang()
  const events = useQuery(api.events.get)
  const eventSkeletonKeys = ['event-a', 'event-b', 'event-c']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">eventos</div>
          <div className="page-header-content">
            <span className="mono-label">{t('events.header.eyebrow')}</span>
            <h1 className="page-title">
              <em>{t('events.header.title')}</em>
            </h1>
            <p className="page-lead">{t('events.header.lead')}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {events === undefined ? (
            <div className="events-grid">
              {eventSkeletonKeys.map((key) => (
                <div key={key} className="event-card">
                  <div className="skeleton" style={{ width: '100%', height: '200px' }} />
                  <div style={{ padding: '24px' }}>
                    <div className="skeleton" style={{ width: '30%', height: '14px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '70%', height: '20px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '48px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="events-grid reveal-on-scroll visible">
              {events.map((event) => {
                const title = tField(event.title, lang)
                const description = tField(event.description, lang)
                const paragraphs = description ? description.split(/\n\n+/).filter(Boolean) : []
                return (
                  <div key={event._id} className="event-card stagger-child">
                    <div className="event-image-wrap">
                      <span className="event-date-block">{event.date}</span>
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={title}
                          className="event-image"
                        />
                      ) : (
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
                            {t('events.placeholder')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="event-body">
                      <div className="event-header">
                        <span className={`editorial-badge ${event.isUpcoming ? 'active' : ''}`}>
                          {event.isUpcoming ? t('events.upcoming') : t('events.past')}
                        </span>
                      </div>
                      <h3 className="event-title">{title}</h3>
                      <div className="event-location">
                        <LocationIcon title={t('events.location.alt')} />
                        {event.location}
                      </div>
                      {paragraphs.map((para, i) => (
                        <p key={i} className="event-desc">{para}</p>
                      ))}
                      {event.registrationUrl && event.isUpcoming && (
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
