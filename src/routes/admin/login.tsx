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
    <div className="w-full max-w-[380px] rounded-lg border border-[rgba(14,23,23,0.08)] bg-white px-10 py-12 shadow-[0_6px_24px_rgba(14,23,23,0.08)]">
      <h1 className="mb-1 text-xl font-semibold">Panel de administración</h1>
      <p className="mb-6 text-[13px] opacity-60">
        Introduce el código de acceso.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="••••••••"
          className="rounded border border-[rgba(14,23,23,0.15)] bg-white px-3 py-2.5 text-sm text-[#0e1717] focus:border-[#00706f] focus:outline-none"
          required
        />
        {error && (
          <p className="text-[13px] text-[#b03b2c]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="cursor-pointer rounded border-0 bg-[#00706f] px-4 py-2.5 text-sm text-white hover:bg-[#005958] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
