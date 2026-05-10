import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'

export const Route = createFileRoute('/research')({
  component: ResearchPage,
})

function ResearchPage() {
  const { lang, t } = useLang()
  const papers = useQuery(api.research.get)
  const labs = useQuery(api.labs.get)
  const paperSkeletonKeys = ['paper-a', 'paper-b', 'paper-c']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">papers</div>
          <div className="page-header-content">
            <span className="mono-label">{t('research.header.eyebrow')}</span>
            <h1 className="page-title">
              <em>{t('research.header.title.pre')}</em>{' '}
              {t('research.header.title.post')}
            </h1>
            <p className="page-lead">{t('research.header.lead')}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          <div className="research-groups reveal-on-scroll visible">
            {labs?.map((lab, idx) => {
              const description = tField(lab.description, lang)
              const paragraphs = description
                ? description.split(/\n\n+/).filter(Boolean)
                : []
              return (
                <article
                  key={lab._id}
                  className="research-group-card stagger-child"
                >
                  <span className="mono-label">
                    — Group {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="research-group-title">
                    {tField(lab.title, lang)}
                  </h2>
                  {paragraphs.map((para) => (
                    <p
                      key={`${lab._id}-${para}`}
                      className="research-group-body"
                    >
                      {para}
                    </p>
                  ))}
                </article>
              )
            })}
          </div>

          <div className="research-section-mark">
            <span className="mono-label warm">
              {t('research.papers.label')}
            </span>
            <h2 className="section-display">
              <em>{t('research.papers.title')}</em>
            </h2>
          </div>

          {papers === undefined ? (
            <div>
              {paperSkeletonKeys.map((key) => (
                <div key={key} className="research-item">
                  <div
                    className="skeleton"
                    style={{ width: '60px', height: '14px' }}
                  />
                  <div
                    className="skeleton"
                    style={{ width: '100%', height: '160px' }}
                  />
                  <div>
                    <div
                      className="skeleton"
                      style={{
                        width: '40%',
                        height: '18px',
                        marginBottom: '14px',
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{
                        width: '85%',
                        height: '28px',
                        marginBottom: '12px',
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{
                        width: '55%',
                        height: '14px',
                        marginBottom: '16px',
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{ width: '100%', height: '60px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal-on-scroll visible">
              {papers
                .filter((p) => Boolean(p.slug))
                .map((paper, idx) => {
                  const title = tField(paper.title, lang)
                  return (
                    <Link
                      key={paper._id}
                      to="/research/$slug"
                      params={{ slug: paper.slug as string }}
                      className="research-item research-item-link stagger-child"
                    >
                      <div className="research-index">
                        № {String(idx + 1).padStart(3, '0')}
                      </div>
                      {paper.imageUrl ? (
                        <img
                          src={paper.imageUrl}
                          alt={title}
                          className="research-image"
                        />
                      ) : (
                        <div
                          className="research-image"
                          style={{
                            background: `linear-gradient(135deg, rgba(0, 112, 111, ${0.18 + (idx % 3) * 0.05}), rgba(217, 119, 87, ${0.1 + (idx % 2) * 0.06}))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--display)',
                              fontVariationSettings:
                                '"opsz" 96, "wdth" 90, "wght" 720',
                              fontSize: '2.4rem',
                              letterSpacing: '-0.05em',
                              textTransform: 'uppercase',
                              color: 'rgba(14, 23, 23, 0.18)',
                            }}
                          >
                            {t('research.placeholder')}
                          </span>
                        </div>
                      )}
                      <div className="research-body">
                        <div className="research-tags">
                          {paper.tags?.map((tag) => (
                            <span key={tag} className="editorial-badge">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h2 className="research-title">{title}</h2>
                        <p className="research-meta">
                          {paper.authors.join(' · ')}
                          {paper.publicationDate
                            ? ` — ${paper.publicationDate}`
                            : ''}
                        </p>
                        <p className="research-desc">
                          {tField(paper.description, lang)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
