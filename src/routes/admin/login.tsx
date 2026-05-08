import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { getAdminToken, setAdminToken } from '@/lib/adminAuth'

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const login = useMutation(api.admin.login)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (getAdminToken()) {
      navigate({ to: '/admin/team' })
    }
  }, [navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await login({ passcode })
      setAdminToken(result.token)
      navigate({ to: '/admin/team' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-card">
      <h1 className="admin-login-title">Panel de administración</h1>
      <p className="admin-login-sub">Introduce el código de acceso.</p>
      <form onSubmit={onSubmit} className="admin-login-form">
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="••••••••"
          className="admin-login-input"
          required
        />
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" className="admin-login-submit" disabled={submitting}>
          {submitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
