import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/administrations')({
  component: AdministrationsPage,
})

function AdministrationsPage() {
  const admins = useQuery(api.pastAdmin.get)
  const archiveSkeletonKeys = ['archive-a', 'archive-b']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">
            ARCHIVO
          </div>
          <div className="page-header-content">
            <span className="mono-label">Legado</span>
            <h1 className="page-title">Gestiones Pasadas</h1>
            <p className="page-lead">
              Legado de liderazgo en GenoBit. Conoce la historia y los líderes
              que han construido nuestra comunidad.
            </p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {admins === undefined ? (
            <div>
              {archiveSkeletonKeys.map((key) => (
                <div key={key} className="archive-card" style={{ marginBottom: '48px' }}>
                  <div className="archive-header">
                    <div className="skeleton" style={{ width: '20%', height: '14px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '50%', height: '28px' }} />
                  </div>
                  <div className="archive-body">
                    <div className="skeleton" style={{ width: '280px', height: '200px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '100%', height: '80px', marginBottom: '24px' }} />
                      <div className="skeleton" style={{ width: '100%', height: '100px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal-on-scroll">
              {admins.map((admin) => (
                <div key={admin._id} className="archive-card stagger-child">
                  <div className="archive-header">
                    <div className="archive-period">{admin.period}</div>
                    <div className="archive-president">
                      Presidencia: {admin.presidentName}
                    </div>
                  </div>
                  <div className="archive-body">
                    {admin.imageUrl && (
                      <img
                        src={admin.imageUrl}
                        alt={`Gestión ${admin.period}`}
                        className="archive-image"
                      />
                    )}
                    <div className="archive-content">
                      {admin.description && (
                        <div style={{ marginBottom: '28px' }}>
                          <h3 className="archive-section-title">Logros Destacados</h3>
                          <p className="archive-desc">{admin.description}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="archive-section-title">Equipo</h3>
                        <div className="members-grid">
                          {admin.members.map((member) => (
                            <div key={`${member.name}-${member.role}`} className="member-chip">
                              <div className="member-name">{member.name}</div>
                              <div className="member-role">{member.role}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
