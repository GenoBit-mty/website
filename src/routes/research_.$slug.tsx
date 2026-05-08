import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import { tField } from '@/i18n/types'
import { MarkdownBody } from '@/components/MarkdownBody'

export const Route = createFileRoute('/research_/$slug')({
  component: ResearchDetailPage,
})

function ResearchDetailPage() {
  const { slug } = Route.useParams()
  const { lang, t } = useLang()
  const paper = useQuery(api.research.getBySlug, { slug })

  if (paper === undefined) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <div className="skeleton" style={{ width: '60%', height: '48px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '40%', height: '20px' }} />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (paper === null) {
    return (
      <main>
        <div className="page-header">
          <div className="site-container">
            <div className="page-header-content">
              <h1 className="page-title">{t('research.detail.notFound')}</h1>
              <Link to="/research" className="editorial-btn">
                ← {t('research.detail.back')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const title = tField(paper.title, lang)
  const body = paper.body ? tField(paper.body, lang) : ''

  return (
    <main>
      <div className="page-header">
        <div className="site-container">
          <div className="page-header-content">
            <Link to="/research" className="mono-label research-detail-back">
              ← {t('research.detail.back')}
            </Link>
            {paper.imageUrl && (
              <img src={paper.imageUrl} alt={title} className="research-detail-hero" />
            )}
            <h1 className="page-title">{title}</h1>
            <p className="research-meta research-detail-meta">
              {paper.authors.join(' · ')}
              {paper.publicationDate ? ` — ${paper.publicationDate}` : ''}
            </p>
            {paper.tags && paper.tags.length > 0 && (
              <div className="research-tags">
                {paper.tags.map((tag) => (
                  <span key={tag} className="editorial-badge">{tag}</span>
                ))}
              </div>
            )}
            <p className="page-lead">{tField(paper.description, lang)}</p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container">
          {body && <MarkdownBody>{body}</MarkdownBody>}

          {paper.url && (
            <div className="research-detail-actions">
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-btn"
              >
                {t('research.detail.readOriginal')}
              </a>
            </div>
          )}

          {paper.galleryImageUrls && paper.galleryImageUrls.length > 0 && (
            <div className="research-detail-gallery">
              <h2 className="mono-label">— {t('research.detail.gallery')}</h2>
              <div className="research-detail-gallery-grid">
                {paper.galleryImageUrls.map((url, i) => (
                  <img key={i} src={url} alt="" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
