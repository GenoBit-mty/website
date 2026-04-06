import { HeadContent, Scripts, createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexClientProvider } from '../components/ConvexClientProvider'
import { useEffect } from 'react'
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

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/team', label: 'Equipo' },
    { to: '/research', label: 'Investigación' },
    { to: '/events', label: 'Eventos' },
    { to: '/administrations', label: 'Archivo' },
  ] as const

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <Link to="/" className="logo" aria-label="GenoBit - Inicio">
        GENO<span>BIT</span>
      </Link>
      <ul className="nav-links">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              style={{
                opacity: currentPath === link.to ? 1 : undefined,
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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
