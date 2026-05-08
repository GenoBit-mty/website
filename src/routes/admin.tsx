import { Link, Outlet, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Toaster } from 'sonner'
import { api } from '../../convex/_generated/api'
import { clearAdminToken, getAdminToken } from '@/lib/adminAuth'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

const NAV = [
  { to: '/admin/team', label: 'Equipo' },
  { to: '/admin/events', label: 'Eventos' },
  { to: '/admin/research', label: 'Investigación' },
  { to: '/admin/labs', label: 'Labs' },
  { to: '/admin/admins', label: 'Mesas pasadas' },
] as const

function AdminLayout() {
  const router = useRouter()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const session = useQuery(
    api.admin.checkSession,
    token ? { sessionToken: token } : 'skip',
  )
  const logout = useMutation(api.admin.logout)
  const path = router.state.location.pathname
  const isLogin = path === '/admin/login'

  useEffect(() => {
    setToken(getAdminToken())
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!checked) return
    if (isLogin) return
    if (!token) {
      navigate({ to: '/admin/login' })
      return
    }
    if (session && !session.valid) {
      clearAdminToken()
      setToken(null)
      navigate({ to: '/admin/login' })
    }
  }, [checked, token, session, isLogin, navigate])

  useEffect(() => {
    if (!checked) return
    if (path === '/admin' && token) {
      navigate({ to: '/admin/team' })
    }
  }, [path, token, checked, navigate])

  const onLogout = async () => {
    if (token) {
      try {
        await logout({ sessionToken: token })
      } catch {
        // ignore — clear locally regardless
      }
    }
    clearAdminToken()
    setToken(null)
    navigate({ to: '/admin/login' })
  }

  if (isLogin) {
    return (
      <div className="admin-shell admin-login-shell">
        <Outlet />
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  if (!checked || !token) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/" className="admin-brand-link">GenoBit · Admin</Link>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="admin-nav-link"
              activeProps={{ className: 'admin-nav-link is-active' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="admin-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
