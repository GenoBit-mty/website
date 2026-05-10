import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, m, useScroll, useTransform } from 'framer-motion'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { DnaHelix } from '@/components/DnaHelix'
import { TechMarquee } from '@/components/TechMarquee'
import { useT } from '@/i18n/LanguageProvider'

const FALLBACK_IMAGES = {
  research:
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000',
  events:
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
} as const

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const t = useT()
  const homeImages = useQuery(api.home.getAll)
  const slotMap = new Map<string, string>()
  for (const row of homeImages ?? []) slotMap.set(row.slot, row.imageUrl)
  const heroImages = {
    research: slotMap.get('research') ?? FALLBACK_IMAGES.research,
    team: slotMap.get('team') ?? FALLBACK_IMAGES.team,
    events: slotMap.get('events') ?? FALLBACK_IMAGES.events,
  }
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.25])
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.9])
  const [dnaMode, setDnaMode] = useState<'hero' | 'content'>('hero')
  const [isBooting, setIsBooting] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('genobit-booted') !== '1'
  })

  useEffect(() => {
    if (!isBooting) return

    const timer = window.setTimeout(() => {
      setIsBooting(false)
      sessionStorage.setItem('genobit-booted', '1')
    }, 1650)

    return () => window.clearTimeout(timer)
  }, [isBooting])

  useEffect(() => {
    const handleScroll = () => {
      const scroll = window.pageYOffset
      const parallaxTexts = document.querySelectorAll('.parallax-text')
      parallaxTexts.forEach((text) => {
        const speed = text.getAttribute('data-speed')
        if (speed) {
          ;(text as HTMLElement).style.transform =
            `translateX(${scroll * parseFloat(speed) * 0.1}px)`
        }
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight * 0.8
      setDnaMode(window.scrollY < threshold ? 'hero' : 'content')
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <m.div
            className="boot-overlay"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.5, ease: 'easeInOut' },
            }}
          >
            <m.img
              src="/GenobitLogo.png"
              alt={t('boot.logo.alt')}
              className="boot-logo"
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
            <m.p
              className="boot-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {t('boot.tagline')}
            </m.p>
          </m.div>
        )}
      </AnimatePresence>

      <main>
        <div className={`dna-stage dna-${dnaMode}`}>
          <DnaHelix />
        </div>

        <m.section
          className="hero-section"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="hero-title-wrap reveal-on-scroll visible">
            <div className="hero-marker-row">
              <span className="dot" />
              <span>{t('hero.eyebrow')}</span>
            </div>

            <div className="hero-name">
              <span
                className="huge-type geno-mark parallax-text"
                data-speed="-0.6"
              >
                Geno
              </span>
              <span
                className="huge-type bit-mark parallax-text"
                data-speed="0.6"
              >
                bit
              </span>
            </div>

            <p className="hero-subtitle">{t('hero.subtitle')}</p>

            <div className="hero-actions">
              <Link
                to="/events"
                className="editorial-btn filled"
                data-cursor-hover
              >
                {t('hero.cta.events')}
              </Link>
              <Link to="/team" className="editorial-btn" data-cursor-hover>
                {t('hero.cta.team')}
              </Link>
            </div>
          </div>

          <div className="hero-meta-strip">
            <span>
              <strong>{t('hero.meta.lat')}</strong>
              {t('hero.meta.location')}
            </span>
            <span className="meta-right">
              <strong>{t('hero.meta.vol')}</strong>
              {t('hero.meta.sections')}
            </span>
          </div>
        </m.section>

        <section className="page-section">
          <div className="site-container reveal-on-scroll">
            <div className="intro-block">
              <span className="mono-label warm">
                {t('home.manifesto.label')}
              </span>
              <h2 className="intro-title">{t('home.manifesto.title')}</h2>
              <p className="intro-description">{t('home.manifesto.body')}</p>
            </div>
          </div>
        </section>

        <TechMarquee />

        <section className="page-section">
          <div className="site-container">
            <div className="sticky-type">{t('home.explore')}</div>

            <div className="content-row reveal-on-scroll">
              <div className="content-info">
                <span className="mono-label">{t('home.research.label')}</span>
                <h3 className="section-display">
                  <em>{t('home.research.title')}</em>
                </h3>
                <p className="section-copy">{t('home.research.body')}</p>
                <div className="divider" />
                <Link to="/research" className="editorial-btn">
                  {t('home.research.cta')}
                </Link>
              </div>
              <div className="content-media">
                <img
                  src={heroImages.research}
                  alt="Investigación en bioinformática"
                  className="content-image"
                />
                <div className="floating-label">adn</div>
              </div>
            </div>

            <div className="content-row reverse reveal-on-scroll">
              <div className="content-info">
                <span className="mono-label">{t('home.team.label')}</span>
                <h3 className="section-display">
                  <em>{t('home.team.title')}</em>
                </h3>
                <p className="section-copy">{t('home.team.body')}</p>
                <div className="divider" />
                <Link to="/team" className="editorial-btn">
                  {t('home.team.cta')}
                </Link>
              </div>
              <div className="content-media">
                <img
                  src={heroImages.team}
                  alt="Equipo colaborativo"
                  className="content-image"
                />
                <div className="floating-label floating-left">gen</div>
              </div>
            </div>

            <div className="content-row reveal-on-scroll">
              <div className="content-info">
                <span className="mono-label">{t('home.events.label')}</span>
                <h3 className="section-display">
                  <em>{t('home.events.title')}</em>
                </h3>
                <p className="section-copy">{t('home.events.body')}</p>
                <div className="divider" />
                <Link to="/events" className="editorial-btn">
                  {t('home.events.cta')}
                </Link>
              </div>
              <div className="content-media">
                <img
                  src={heroImages.events}
                  alt="Evento de bioinformática"
                  className="content-image"
                />
                <div className="floating-label">dato</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
