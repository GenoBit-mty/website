import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ConvexClientProvider } from '../components/ConvexClientProvider'
import { CustomCursor } from '../components/CustomCursor'
import { LanguageProvider, useLang } from '../i18n/LanguageProvider'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GenoBit — Grupo Estudiantil de Bioinformática',
      },
      {
        name: 'description',
        content:
          'Impulsando el descubrimiento científico a través de la computación. Grupo estudiantil de bioinformática.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
    ],
  }),

  component: RootComponent,
})

function RootComponent() {
  return (
    <ConvexClientProvider>
      <LanguageProvider>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </LanguageProvider>
    </ConvexClientProvider>
  )
}

function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
      <button
        type="button"
        className={`lang-toggle-btn ${lang === 'es' ? 'is-active' : ''}`}
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
      >
        ES
      </button>
      <span className="lang-toggle-sep" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className={`lang-toggle-btn ${lang === 'en' ? 'is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      {compact ? null : null}
    </div>
  )
}

function SiteNav() {
  const router = useRouter()
  const { t } = useLang()
  const currentPath = router.state.location.pathname
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = () => setIsMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/team', label: t('nav.team') },
    { to: '/research', label: t('nav.research') },
    { to: '/events', label: t('nav.events') },
    { to: '/administrations', label: t('nav.archive') },
  ] as const

  return (
    <>
      <m.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`site-nav ${isScrolled ? 'scrolled' : ''}`}
      >
        <nav className="site-nav-shell" aria-label={t('nav.main.label')}>
          <Link
            to="/"
            className="site-logo"
            aria-label={t('nav.logo.alt')}
            onClick={() => setIsMenuOpen(false)}
          >
            <img
              src="/GenobitLogo.png"
              alt={t('nav.logo.alt')}
              className="site-logo-mark"
            />
          </Link>

          <ul className="nav-links desktop-nav">
            {links.map((link, index) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="nav-link-item"
                  style={{
                    opacity: currentPath === link.to ? 1 : undefined,
                  }}
                >
                  <span className="nav-link-index">0{index + 1}</span>
                  {link.label.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <LangToggle />
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="mobile-menu-btn"
              aria-label={t('nav.menu.open')}
              aria-expanded={isMenuOpen}
            >
              <m.span
                animate={
                  isMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }
                }
              />
              <m.span
                animate={
                  isMenuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }
                }
              />
              <m.span
                animate={
                  isMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }
                }
              />
            </button>
          </div>
        </nav>
      </m.header>

      <AnimatePresence>
        {isMenuOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-menu-overlay"
          >
            <nav className="mobile-menu-panel" aria-label={t('nav.menu.label')}>
              {links.map((link, index) => (
                <m.div
                  key={link.to}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 14 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="mobile-menu-link"
                  >
                    <span className="nav-link-index">0{index + 1}</span>
                    {link.label}
                  </Link>
                </m.div>
              ))}
              <div className="mobile-menu-lang">
                <LangToggle />
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SiteFooter() {
  const { t } = useLang()
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-cta">
          <a href="mailto:genobit.mty@gmail.com">{t('footer.cta')}</a>
        </div>
        <div className="divider" />
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} GENOBIT</div>
          <div className="footer-links">
            <a
              href="https://github.com/orgs/GenoBit-mty"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://instagram.com/genobit.mty"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://linktr.ee/genobit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Linktree
            </a>
          </div>
          <div>{t('footer.tagline')}</div>
        </div>
      </div>
    </footer>
  )
}

function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 },
    )

    const observed = new WeakSet<Element>()
    const observe = (el: Element) => {
      if (observed.has(el)) return
      observed.add(el)
      intersectionObserver.observe(el)
    }

    const observeAll = () => {
      document.querySelectorAll('.reveal-on-scroll').forEach(observe)
    }

    observeAll()

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.classList.contains('reveal-on-scroll')) observe(node)
          node.querySelectorAll('.reveal-on-scroll').forEach(observe)
        }
      }
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      intersectionObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAdmin = router.state.location.pathname.startsWith('/admin')

  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <LazyMotion features={domAnimation} strict>
          {!isAdmin && <div className="site-noise" aria-hidden="true" />}
          {!isAdmin && <CustomCursor />}
          {!isAdmin && <SiteNav />}
          {isAdmin ? (
            children
          ) : (
            <ScrollRevealProvider>{children}</ScrollRevealProvider>
          )}
          {!isAdmin && <SiteFooter />}
        </LazyMotion>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
