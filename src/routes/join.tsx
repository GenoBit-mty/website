import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { JoinForm } from '@/components/JoinForm'
import { useT } from '@/i18n/LanguageProvider'

export const Route = createFileRoute('/join')({ component: JoinPage })

function JoinPage() {
  const t = useT()
  const isOpen = useQuery(api.siteSettings.getApplicationsOpen)

  return (
    <main className="join-page">
      <div className="site-container">
        <header className="join-header">
          <span className="mono-label">{t('join.header.eyebrow')}</span>
          <h1 className="section-display">{t('join.header.title')}</h1>
          <p className="section-copy">{t('join.header.lead')}</p>
          <div className="divider" />
        </header>

        {isOpen === undefined ? null : isOpen ? (
          <JoinForm />
        ) : (
          <section className="join-closed">
            <h2 className="section-display">{t('join.closed.title')}</h2>
            <p className="section-copy">{t('join.closed.body')}</p>
            <a
              href="https://instagram.com/genobit.mty"
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-btn"
            >
              {t('join.closed.cta')}
            </a>
          </section>
        )}
      </div>
    </main>
  )
}
