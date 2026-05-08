import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type {Bilingual} from '@/i18n/types';
import { useLang } from '@/i18n/LanguageProvider'
import {  tField } from '@/i18n/types'

export const Route = createFileRoute('/team')({
  component: TeamPage,
})

type TeamMember = {
  _id: string
  name: string
  role: Bilingual
  career?: string
  group?: string
  tenure?: string
  isFirstBoard?: boolean
  bio?: Bilingual
  imageUrl?: string
  email?: string
  linkedinUrl?: string
  githubUrl?: string
}

function TeamPage() {
  const { lang, t } = useLang()
  const teamMembers = useQuery(api.team.get) as Array<TeamMember> | undefined
  const teamSkeletonKeys = ['team-a', 'team-b', 'team-c', 'team-d', 'team-e', 'team-f']

  const grouped: Record<string, Array<TeamMember>> = {
    directives: [],
    ndrg: [],
    proteomics: [],
    'student-community': [],
  }
  if (teamMembers) {
    for (const m of teamMembers) {
      const key = m.group ?? 'student-community'
      const bucket = grouped[key] ?? (grouped[key] = [])
      bucket.push(m)
    }
  }

  const directiveTenure = grouped.directives[0]?.tenure
  const isFirstBoard = grouped.directives.some((m) => m.isFirstBoard)

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">equipo</div>
          <div className="page-header-content">
            <span className="mono-label">{t('team.header.eyebrow')}</span>
            <h1 className="page-title">
              {t('team.header.title.pre')} <em>{t('team.header.title.em')}</em>
            </h1>
            <p className="page-lead">{t('team.header.lead')}</p>
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
          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll visible">
                <span className="mono-label">— 01 / {t('team.group.directives')}</span>
                <h2 className="section-display">{t('team.group.directives')}</h2>
                <p className="team-section-meta">
                  {isFirstBoard && (
                    <span className="team-section-pill">{t('team.firstBoard')}</span>
                  )}
                  {directiveTenure && (
                    <span className="team-section-pill">{t('team.tenure')} {directiveTenure}</span>
                  )}
                </p>
              </div>

              <div className="team-grid reveal-on-scroll visible">
                {grouped.directives.map((member, idx) => (
                  <div key={member._id} className="team-card stagger-child">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={`${member.name} — ${tField(member.role, lang)}`}
                        className="team-photo"
                      />
                    ) : (
                      <div className="team-photo-fallback" data-idx={idx}>
                        <span>{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="team-info">
                      <div className="team-name">{member.name}</div>
                      <div className="team-role">{tField(member.role, lang)}</div>
                      {member.career && (
                        <div className="team-career">{member.career}</div>
                      )}
                      <div className="team-links">
                        {member.email && <a href={`mailto:${member.email}`}>{t('team.email')}</a>}
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

          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll visible">
                <span className="mono-label">— 02 / NDRG</span>
                <h2 className="section-display">{t('team.group.ndrg')}</h2>
                <p className="team-section-description">{t('team.group.ndrg.body')}</p>
              </div>

              <div className="team-grid reveal-on-scroll visible">
                {grouped.ndrg.map((member, idx) => (
                  <div key={member._id} className="team-card stagger-child">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={`${member.name} — ${tField(member.role, lang)}`}
                        className="team-photo"
                      />
                    ) : (
                      <div className="team-photo-fallback" data-idx={idx}>
                        <span>{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="team-info">
                      <div className="team-name">{member.name}</div>
                      <div className="team-role">{tField(member.role, lang)}</div>
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

          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll visible">
                <span className="mono-label">— 03 / Proteomics</span>
                <h2 className="section-display">{t('team.group.proteomics')}</h2>
                <p className="team-section-description">{t('team.group.proteomics.body')}</p>
              </div>

              <ul className="team-list reveal-on-scroll visible">
                {grouped.proteomics.map((member) => (
                  <li key={member._id} className="team-list-row stagger-child">
                    <div className="team-list-name">{member.name}</div>
                    <div className="team-list-role">{tField(member.role, lang)}</div>
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

          <section className="section-spacing">
            <div className="site-container">
              <div className="team-section-header reveal-on-scroll visible">
                <span className="mono-label">— 04 / Community</span>
                <h2 className="section-display">{t('team.group.studentCommunity')}</h2>
              </div>

              <ul className="team-list reveal-on-scroll visible">
                {grouped['student-community'].map((member) => (
                  <li key={member._id} className="team-list-row stagger-child">
                    <div className="team-list-name">{member.name}</div>
                    <div className="team-list-role">{tField(member.role, lang)}</div>
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

          <section className="section-spacing">
            <div className="site-container">
              <div className="content-row reveal-on-scroll visible">
                <div className="content-info">
                  <span className="mono-label">{t('team.pastBoards.label')}</span>
                  <h3 className="section-display">{t('team.pastBoards.title')}</h3>
                  <p className="section-copy">{t('team.pastBoards.body')}</p>
                  <div className="divider" />
                  <Link to="/administrations" className="editorial-btn">
                    {t('team.pastBoards.cta')}
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
