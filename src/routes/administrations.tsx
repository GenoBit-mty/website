import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'

export const Route = createFileRoute('/administrations')({
  component: AdministrationsPage,
})

function AdministrationsPage() {
  const { lang, t } = useLang()
  const admins = useQuery(api.pastAdmin.get)
  const archiveSkeletonKeys = ['archive-a', 'archive-b']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">archivo</div>
          <div className="page-header-content">
            <span className="mono-label">{t('archive.header.eyebrow')}</span>
            <h1 className="page-title">
              <em>{t('archive.header.title.pre')}</em>{' '}
              {t('archive.header.title.post')}
            </h1>
            <p className="page-lead">{t('archive.header.lead')}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {admins === undefined ? (
            <div>
              {archiveSkeletonKeys.map((key) => (
                <div
                  key={key}
                  className="archive-card"
                  style={{ marginBottom: '48px' }}
                >
                  <div className="archive-header">
                    <div
                      className="skeleton"
                      style={{
                        width: '20%',
                        height: '14px',
                        marginBottom: '12px',
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{ width: '50%', height: '28px' }}
                    />
                  </div>
                  <div className="archive-body">
                    <div
                      className="skeleton"
                      style={{ width: '280px', height: '200px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        className="skeleton"
                        style={{
                          width: '100%',
                          height: '80px',
                          marginBottom: '24px',
                        }}
                      />
                      <div
                        className="skeleton"
                        style={{ width: '100%', height: '100px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal-on-scroll visible">
              {admins.map((admin) => (
                <div key={admin._id} className="archive-card stagger-child">
                  <div className="archive-header">
                    <div className="archive-period">{admin.period}</div>
                    <div className="archive-president">
                      {t('archive.presidency')} · <em>{admin.presidentName}</em>
                    </div>
                  </div>
                  <div className="archive-body">
                    {admin.imageUrl && (
                      <img
                        src={admin.imageUrl}
                        alt={`${t('archive.alt')} ${admin.period}`}
                        className="archive-image"
                      />
                    )}
                    <div className="archive-content">
                      {admin.description && (
                        <div>
                          <h3 className="archive-section-title">
                            {t('archive.highlights')}
                          </h3>
                          <p className="archive-desc">
                            {tField(admin.description, lang)}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="archive-section-title">
                          {t('archive.team')}
                        </h3>
                        <div className="members-grid">
                          {admin.members.map((member) => (
                            <div
                              key={`${member.name}-${tField(member.role, lang)}`}
                              className="member-chip"
                            >
                              <div className="member-name">{member.name}</div>
                              <div className="member-role">
                                {tField(member.role, lang)}
                              </div>
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
