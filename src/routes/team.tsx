import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/team')({
  component: TeamPage,
})

function TeamPage() {
  const teamMembers = useQuery(api.team.get)
  const teamSkeletonKeys = ['team-a', 'team-b', 'team-c', 'team-d', 'team-e', 'team-f']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">
            EQUIPO
          </div>
          <div className="page-header-content">
            <span className="mono-label">Nuestro equipo</span>
            <h1 className="page-title">Conoce al Equipo</h1>
            <p className="page-lead">
              El equipo apasionado detrás de GenoBit. Estudiantes de diversas
              disciplinas unidos por la bioinformática.
            </p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {teamMembers === undefined ? (
            <div className="team-grid">
              {teamSkeletonKeys.map((key) => (
                <div key={key} className="team-card">
                  <div className="skeleton" style={{ width: '100%', height: '280px' }} />
                  <div className="skeleton-block">
                    <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '40%', height: '14px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="team-grid reveal-on-scroll">
              {teamMembers.map((member, idx) => (
                <div key={member._id} className="team-card stagger-child">
                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      alt={`${member.name} — ${member.role}`}
                      className="team-photo"
                    />
                  )}
                  {!member.imageUrl && (
                    <div
                      style={{
                        width: '100%',
                        height: '280px',
                        background: `linear-gradient(135deg, rgba(0, 112, 111, ${0.1 + (idx % 4) * 0.05}), rgba(61, 53, 139, ${0.1 + (idx % 3) * 0.05}))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--exo)',
                          fontSize: '3rem',
                          fontWeight: 800,
                          opacity: 0.15,
                        }}
                      >
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="team-info">
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                    {member.bio && <div className="team-bio">{member.bio}</div>}
                    <div className="team-links">
                      {member.email && (
                        <a href={`mailto:${member.email}`}>Email</a>
                      )}
                      {member.linkedinUrl && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          LinkedIn
                        </a>
                      )}
                      {member.githubUrl && (
                        <a href={member.githubUrl} target="_blank" rel="noopener noreferrer">
                          GitHub
                        </a>
                      )}
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
