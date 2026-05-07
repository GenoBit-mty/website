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
          <div className="research-groups reveal-on-scroll">
            <article className="research-group-card stagger-child">
              <span className="mono-label">Research Group</span>
              <h2 className="research-group-title">Neurodegenerative Diseases Research Group</h2>
              <p className="research-group-body">
                The Neurodegenerative Diseases Research Group within GenoBit
                focuses on the application of computational methods to better
                understand, detect, and analyze neurological disorders, with a
                particular emphasis on Alzheimer's disease.
              </p>
              <p className="research-group-body">
                Our work integrates multimodal data sources, including 3D MRI
                neuroimaging and biomarkers derived from blood and cerebrospinal
                fluid (CSF). Through these datasets, we aim to capture both
                structural changes in the brain and underlying biological
                signals associated with disease progression.
              </p>
              <p className="research-group-body">
                Currently, we are developing and exploring modern techniques
                based on machine learning and deep learning to improve early
                diagnosis and classification of Alzheimer's. This includes
                working with volumetric brain imaging data to identify patterns
                of neurodegeneration, as well as leveraging biochemical markers
                to enhance predictive accuracy.
              </p>
              <p className="research-group-body">
                By combining these approaches, our goal is to contribute to more
                robust, data-driven diagnostic tools that can support early
                detection and advance research in neurodegenerative diseases.
              </p>
            </article>

            <article className="research-group-card stagger-child">
              <span className="mono-label">Research Group</span>
              <h2 className="research-group-title">Proteomics and Molecular Biology Group</h2>
              <p className="research-group-body">
                The Proteomics and Molecular Biology Group within GenoBit
                focuses on bridging molecular biology and computational tools
                through innovative, accessible learning experiences.
              </p>
              <p className="research-group-body">
                Our work centers on the development of educational technologies
                that introduce key concepts in protein structure and function,
                with a particular emphasis on the protein folding problem. To
                achieve this, we leverage advanced tools such as AlphaFold to
                explore how protein structures can be predicted and understood
                through computational methods.
              </p>
              <p className="research-group-body">
                We are currently designing a mobile application built in Swift,
                aimed at younger students and early-stage learners interested in
                bioengineering and related fields. This platform integrates
                interactive visualizations of protein structures with guided
                lessons in molecular biology and bioinformatics, allowing users
                to intuitively explore complex concepts through a hands-on
                approach.
              </p>
              <p className="research-group-body">
                By combining education, visualization, and cutting-edge
                computational tools, our goal is to make proteomics and
                bioinformatics more approachable, engaging, and inspiring for
                the next generation of engineers and scientists.
              </p>
            </article>
          </div>

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
