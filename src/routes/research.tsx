import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/research')({
  component: ResearchPage,
})

function ResearchPage() {
  const papers = useQuery(api.research.get)
  const paperSkeletonKeys = ['paper-a', 'paper-b', 'paper-c']

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="sticky-type page-watermark">
            PAPERS
          </div>
          <div className="page-header-content">
            <span className="mono-label">Producción científica</span>
            <h1 className="page-title">Investigaciones</h1>
            <p className="page-lead">
              Nuestra contribución a la ciencia y bioinformática. Proyectos,
              publicaciones y colaboraciones.
            </p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {papers === undefined ? (
            <div>
              {paperSkeletonKeys.map((key) => (
                <div key={key} className="research-item">
                  <div className="skeleton" style={{ width: '200px', height: '140px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '80%', height: '24px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '50%', height: '14px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '60px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal-on-scroll">
              {papers.map((paper, idx) => (
                <div key={paper._id} className="research-item stagger-child">
                  {paper.imageUrl && (
                    <img
                      src={paper.imageUrl}
                      alt={paper.title}
                      className="research-image"
                    />
                  )}
                  {!paper.imageUrl && (
                    <div
                      className="research-image"
                      style={{
                        background: `linear-gradient(135deg, rgba(0, 112, 111, ${0.15 + (idx % 3) * 0.05}), rgba(61, 53, 139, ${0.1 + (idx % 2) * 0.05}))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: 'rgba(240, 249, 255, 0.2)',
                        }}
                      >
                        {String(idx + 1).padStart(3, '0')}
                      </span>
                    </div>
                  )}
                  <div className="research-body">
                    <div className="research-tags">
                      {paper.tags?.map((tag) => (
                        <span key={tag} className="editorial-badge">{tag}</span>
                      ))}
                    </div>
                    <h2 className="research-title">{paper.title}</h2>
                    <p className="research-meta">
                      Por: {paper.authors.join(', ')} · {paper.publicationDate}
                    </p>
                    <p className="research-desc">{paper.description}</p>
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="editorial-btn"
                        style={{ fontSize: '0.7rem', padding: '10px 24px' }}
                      >
                        Leer publicación ↗
                      </a>
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
