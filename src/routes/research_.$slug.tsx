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
            <div className="page-header-content mx-auto max-w-[880px] text-center">
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
            <div className="page-header-content mx-auto max-w-[880px] text-center">
              <h1 className="page-title text-center">{t('research.detail.notFound')}</h1>
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
          <div className="page-header-content mx-auto max-w-[880px] text-center">
            <Link
              to="/research"
              className="mono-label inline-block self-start mb-6 text-left text-[var(--gb-warm)] no-underline hover:text-[var(--gb-ink)]"
            >
              ← {t('research.detail.back')}
            </Link>
            {paper.imageUrl && (
              <img
                src={paper.imageUrl}
                alt={title}
                className="mx-auto mb-8 block w-full max-h-[420px] border border-[var(--gb-rule)] object-cover [filter:grayscale(0.4)_contrast(1.05)]"
              />
            )}
            <h1 className="page-title text-center">{title}</h1>
            <p className="research-meta mb-4 text-center">
              {paper.authors.join(' · ')}
              {paper.publicationDate ? ` — ${paper.publicationDate}` : ''}
            </p>
            {paper.tags && paper.tags.length > 0 && (
              <div className="research-tags justify-center">
                {paper.tags.map((tag) => (
                  <span key={tag} className="editorial-badge">{tag}</span>
                ))}
              </div>
            )}
            <p className="page-lead mx-auto max-w-[64ch] text-center">
              {tField(paper.description, lang)}
            </p>
          </div>
        </div>
      </div>

      <section className="section-spacing">
        <div className="site-container mx-auto max-w-[880px]">
          {body && <MarkdownBody>{body}</MarkdownBody>}

          {paper.url && (
            <div className="my-10 text-center">
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
            <div className="mt-14 text-center">
              <h2 className="mono-label mb-4 block">— {t('research.detail.gallery')}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {paper.galleryImageUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-[4/3] w-full border border-[var(--gb-rule)] object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
