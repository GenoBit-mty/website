import { Link, createFileRoute } from '@tanstack/react-router'
import { useT } from '@/i18n/LanguageProvider'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

function PrivacyPage() {
  const t = useT()
  return (
    <main className="privacy-page">
      <div className="site-container">
        <Link to="/join" className="privacy-back">
          {t('privacy.back')}
        </Link>
        <h1 className="section-display">{t('privacy.title')}</h1>
        <p className="section-copy">{t('privacy.placeholder')}</p>
      </div>
    </main>
  )
}
