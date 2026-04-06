import { HeadContent, Link, Outlet, Scripts, createRootRoute, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AnimatePresence, motion } from 'framer-motion'
import { ConvexClientProvider } from '../components/ConvexClientProvider'
import { useEffect, useState } from 'react'
import { SmoothScroll } from '../components/SmoothScroll'
import { CustomCursor } from '../components/CustomCursor'

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
        content: 'Impulsando el descubrimiento científico a través de la computación. Grupo estudiantil de bioinformática.',
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
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexClientProvider>
  )
}

function SiteNav() {
  const router = useRouter()
  const currentPath = router.state.location.pathname
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = () => setIsMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/team', label: 'Equipo' },
    { to: '/research', label: 'Investigación' },
    { to: '/events', label: 'Eventos' },
    { to: '/administrations', label: 'Archivo' },
  ] as const

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`site-nav ${isScrolled ? 'scrolled' : ''}`}
      >
        <nav className="site-nav-shell" aria-label="Navegación principal">
          <Link to="/" className="site-logo" aria-label="GenoBit - Inicio" onClick={() => setIsMenuOpen(false)}>
            <img src="/GenobitLogo.png" alt="Logo GenoBit" className="site-logo-mark" />
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

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="mobile-menu-btn"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
          >
            <motion.span animate={isMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} />
            <motion.span animate={isMenuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }} />
            <motion.span animate={isMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-menu-overlay"
          >
            <nav className="mobile-menu-panel" aria-label="Menu movil">
              {links.map((link, index) => (
                <motion.div
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
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-cta">
          <a href="mailto:genobit@university.edu">ÚNETE — HOY</a>
        </div>
        <div className="divider" />
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} GENOBIT</div>
          <div className="footer-links">
            <a href="https://github.com/genobit" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://instagram.com/genobit" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
          <div>BIOINFORMÁTICA · GENÓMICA</div>
        </div>
      </div>
    </footer>
  )
}

function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    // Observe after a short delay to let the page render
    const timeout = setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        observer.observe(el)
      })
    }, 100)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [])

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="site-noise" aria-hidden="true" />
        <CustomCursor />
        <SmoothScroll>
          <SiteNav />
          <ScrollRevealProvider>
            {children}
          </ScrollRevealProvider>
          <SiteFooter />
        </SmoothScroll>
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
