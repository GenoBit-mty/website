import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>Ubicación</title>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function EventsPage() {
  const events = useQuery(api.events.get)
  const eventSkeletonKeys = ['event-a', 'event-b', 'event-c']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">
            EVENTOS
          </div>
          <div className="page-header-content">
            <span className="mono-label">Calendario</span>
            <h1 className="page-title">Eventos</h1>
            <p className="page-lead">
              Participa en nuestros talleres, conferencias y reuniones.
              Potencia tu formación en bioinformática.
            </p>
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
            <div className="events-grid reveal-on-scroll">
              {events.map((event) => (
                <div key={event._id} className="event-card stagger-child">
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="event-image"
                    />
                  )}
                  {!event.imageUrl && (
                    <div
                      style={{
                        width: '100%',
                        height: '200px',
                        background: 'linear-gradient(135deg, rgba(0, 112, 111, 0.12), rgba(42, 187, 203, 0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--exo)',
                          fontSize: '2rem',
                          fontWeight: 800,
                          opacity: 0.1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Evento
                      </span>
                    </div>
                  )}
                  <div className="event-body">
                    <div className="event-header">
                      <span className={`editorial-badge ${event.isUpcoming ? 'active' : ''}`}>
                        {event.isUpcoming ? 'Próximo' : 'Pasado'}
                      </span>
                      <span className="event-date">{event.date}</span>
                    </div>
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-location">
                      <LocationIcon />
                      {event.location}
                    </div>
                    <p className="event-desc">{event.description}</p>
                    {event.registrationUrl && event.isUpcoming && (
                      <div style={{ marginTop: '20px' }}>
                        <a
                          href={event.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="editorial-btn filled"
                          style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem' }}
                        >
                          Registrarse
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
