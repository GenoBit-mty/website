import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/team')({
  component: TeamPage,
})

type TeamMember = {
  _id: string
  name: string
  role: string
  career?: string
  group?: string
  tenure?: string
  isFirstBoard?: boolean
  bio?: string
  imageUrl?: string
  email?: string
  linkedinUrl?: string
  githubUrl?: string
}

const GROUP_META: Record<string, { label: string; mono: string; description?: string }> = {
  directives: {
    label: 'Mesa Directiva',
    mono: '01 / Mesa Directiva',
  },
  ndrg: {
    label: 'Neurodegenerative Diseases Research Group',
    mono: '02 / NDRG',
    description:
      'The Neurodegenerative Diseases Research Group within GenoBit focuses on the application of computational methods to better understand, detect, and analyze neurological disorders, with a particular emphasis on Alzheimer’s disease.',
  },
  proteomics: {
    label: 'Proteomics and Molecular Biology Group',
    mono: '03 / Proteomics & Molecular Biology',
    description:
      'The Proteomics and Molecular Biology Group within GenoBit focuses on bridging molecular biology and computational tools through innovative, accessible learning experiences.',
  },
  'student-community': {
    label: 'Student Community Coordinators',
    mono: '04 / Student Community',
  },
}

function TeamPage() {
  const teamMembers = useQuery(api.team.get) as TeamMember[] | undefined
  const teamSkeletonKeys = ['team-a', 'team-b', 'team-c', 'team-d', 'team-e', 'team-f']

  const grouped: Record<string, TeamMember[]> = {
    directives: [],
    ndrg: [],
    proteomics: [],
    'student-community': [],
  }
  if (teamMembers) {
    for (const m of teamMembers) {
      const key = m.group ?? 'student-community'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(m)
    }
  }

  const directiveTenure = grouped.directives[0]?.tenure
  const isFirstBoard = grouped.directives.some((m) => m.isFirstBoard)

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">EQUIPO</div>
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

      {teamMembers === undefined ? (
        <section className="section-spacing">
          <div className="site-container">
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
          </div>
        </section>
      ) : (
        <>
          {/* Mesa Directiva */}
          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll">
                <span className="mono-label">{GROUP_META.directives.mono}</span>
                <h2 className="section-display">{GROUP_META.directives.label}</h2>
                <p className="team-section-meta">
                  {isFirstBoard && (
                    <span className="team-section-pill">Primera Mesa Directiva</span>
                  )}
                  {directiveTenure && (
                    <span className="team-section-pill">Gestión {directiveTenure}</span>
                  )}
                </p>
              </div>

              <div className="team-grid reveal-on-scroll">
                {grouped.directives.map((member, idx) => (
                  <div key={member._id} className="team-card stagger-child">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={`${member.name} — ${member.role}`}
                        className="team-photo"
                      />
                    ) : (
                      <div className="team-photo-fallback" data-idx={idx}>
                        <span>{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="team-info">
                      <div className="team-name">{member.name}</div>
                      <div className="team-role">{member.role}</div>
                      {member.career && (
                        <div className="team-career">{member.career}</div>
                      )}
                      <div className="team-links">
                        {member.email && <a href={`mailto:${member.email}`}>Email</a>}
                        {member.linkedinUrl && (
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* NDRG (with photos & links) */}
          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll">
                <span className="mono-label">{GROUP_META.ndrg.mono}</span>
                <h2 className="section-display">{GROUP_META.ndrg.label}</h2>
                {GROUP_META.ndrg.description && (
                  <p className="team-section-description">{GROUP_META.ndrg.description}</p>
                )}
              </div>

              <div className="team-grid reveal-on-scroll">
                {grouped.ndrg.map((member, idx) => (
                  <div key={member._id} className="team-card stagger-child">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={`${member.name} — ${member.role}`}
                        className="team-photo"
                      />
                    ) : (
                      <div className="team-photo-fallback" data-idx={idx}>
                        <span>{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="team-info">
                      <div className="team-name">{member.name}</div>
                      <div className="team-role">{member.role}</div>
                      {member.career && (
                        <div className="team-career">{member.career}</div>
                      )}
                      <div className="team-links">
                        {member.linkedinUrl && (
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Proteomics & Molecular Biology */}
          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll">
                <span className="mono-label">{GROUP_META.proteomics.mono}</span>
                <h2 className="section-display">{GROUP_META.proteomics.label}</h2>
                {GROUP_META.proteomics.description && (
                  <p className="team-section-description">{GROUP_META.proteomics.description}</p>
                )}
              </div>

              <ul className="team-list reveal-on-scroll">
                {grouped.proteomics.map((member) => (
                  <li key={member._id} className="team-list-row stagger-child">
                    <div className="team-list-name">{member.name}</div>
                    <div className="team-list-role">{member.role}</div>
                    {member.career && (
                      <div className="team-list-career">{member.career}</div>
                    )}
                    {member.linkedinUrl && (
                      <a
                        className="team-list-link"
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Student Community Coordinators */}
          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll">
                <span className="mono-label">{GROUP_META['student-community'].mono}</span>
                <h2 className="section-display">{GROUP_META['student-community'].label}</h2>
              </div>

              <ul className="team-list reveal-on-scroll">
                {grouped['student-community'].map((member) => (
                  <li key={member._id} className="team-list-row stagger-child">
                    <div className="team-list-name">{member.name}</div>
                    <div className="team-list-role">{member.role}</div>
                    {member.career && (
                      <div className="team-list-career">{member.career}</div>
                    )}
                    {member.linkedinUrl && (
                      <a
                        className="team-list-link"
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Past boards */}
          <section className="section-spacing">
            <div className="site-container">
              <div className="content-row reveal-on-scroll">
                <div className="content-info">
                  <span className="mono-label">Archivo / Gestiones</span>
                  <h3 className="section-display">Mesas Pasadas</h3>
                  <p className="section-copy">
                    Conoce a las mesas directivas anteriores que han construido
                    el legado de GenoBit.
                  </p>
                  <div className="divider" />
                  <Link to="/administrations" className="editorial-btn">
                    Ver Gestiones Pasadas
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
