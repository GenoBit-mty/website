import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { ApplicationStatus } from '@/lib/applications'
import { getAdminToken } from '@/lib/adminAuth'
import { APPLICATION_STATUSES } from '@/lib/applications'

export const Route = createFileRoute('/admin/applications_/$id')({
  component: AdminApplicationDetailPage,
})

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'Nuevo',
  under_review: 'En revisión',
  contacted: 'Contactado',
  interview_scheduled: 'Entrevista agendada',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

function AdminApplicationDetailPage() {
  const params = Route.useParams()
  const id = params.id as Id<'applications'>
  const navigate = useNavigate()
  const token = getAdminToken()

  const app = useQuery(
    api.applications.getById,
    token ? { sessionToken: token, id } : 'skip',
  )
  const updateStatus = useMutation(api.applications.updateStatus)
  const updateAssignee = useMutation(api.applications.updateAssignee)
  const updateNotes = useMutation(api.applications.updateNotes)
  const remove = useMutation(api.applications.remove)

  const [assigneeDraft, setAssigneeDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')

  useEffect(() => {
    if (app) {
      setAssigneeDraft(app.assigneeName ?? '')
      setNotesDraft(app.adminNotes ?? '')
    }
  }, [app])

  if (!app) {
    return <div className="admin-loading">Cargando…</div>
  }

  const onChangeStatus = async (next: ApplicationStatus) => {
    if (!token) return
    try {
      await updateStatus({ sessionToken: token, id, status: next })
      toast.success(`Estado: ${STATUS_LABEL[next]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onSaveAssignee = async () => {
    if (!token) return
    try {
      await updateAssignee({
        sessionToken: token,
        id,
        assigneeName: assigneeDraft,
      })
      toast.success('Responsable actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onSaveNotes = async () => {
    if (!token) return
    try {
      await updateNotes({ sessionToken: token, id, adminNotes: notesDraft })
      toast.success('Notas guardadas')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onDelete = async () => {
    if (!token) return
    const ok = window.confirm(
      `¿Eliminar la aplicación de ${app.fullName}? Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    try {
      await remove({ sessionToken: token, id })
      toast.success('Aplicación eliminada')
      navigate({ to: '/admin/applications' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div>
      <Link to="/admin/applications" className="admin-back">
        ← Volver a aplicaciones
      </Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{app.fullName}</h1>
          <p className="admin-page-sub">
            {app.email} · {app.phone} · {app.locale.toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={onDelete}
        >
          Eliminar
        </button>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-detail-card">
          <h2 className="admin-detail-title">Datos del aspirante</h2>
          <dl className="admin-dl">
            <dt>Carrera</dt>
            <dd>
              {app.career}
              {app.careerOther ? ` · ${app.careerOther}` : ''}
            </dd>
            <dt>Semestre</dt>
            <dd>{app.semester}</dd>
            <dt>Universidad</dt>
            <dd>{app.university}</dd>
            <dt>Área</dt>
            <dd>{app.group}</dd>
            <dt>Sub-área</dt>
            <dd>{app.subArea ?? '—'}</dd>
            <dt>LinkedIn</dt>
            <dd>
              {app.linkedinUrl ? (
                <a
                  href={app.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {app.linkedinUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
            <dt>GitHub</dt>
            <dd>
              {app.githubUrl ? (
                <a
                  href={app.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {app.githubUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
            <dt>Motivación</dt>
            <dd className="admin-dl-paragraph">{app.motivation}</dd>
            <dt>Recibida</dt>
            <dd>{new Date(app.submittedAt).toLocaleString('es-MX')}</dd>
          </dl>
        </section>

        <section className="admin-detail-card">
          <h2 className="admin-detail-title">Seguimiento</h2>

          <div className="admin-field">
            <label className="admin-field-label">Estado</label>
            <select
              className="admin-input"
              value={app.status}
              onChange={(e) =>
                onChangeStatus(e.target.value as ApplicationStatus)
              }
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Responsable</label>
            <div className="admin-inline-edit">
              <input
                type="text"
                className="admin-input"
                value={assigneeDraft}
                onChange={(e) => setAssigneeDraft(e.target.value)}
                placeholder="Nombre del responsable"
              />
              <button
                type="button"
                className="admin-btn"
                onClick={onSaveAssignee}
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Notas</label>
            <textarea
              rows={5}
              className="admin-textarea"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Notas internas, recordatorios, contexto…"
            />
            <button
              type="button"
              className="admin-btn"
              onClick={onSaveNotes}
              style={{ marginTop: 8 }}
            >
              Guardar notas
            </button>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Historial</label>
            <ol className="admin-history">
              {app.statusHistory
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span className="admin-history-status">
                      {STATUS_LABEL[h.status as ApplicationStatus]}
                    </span>
                    <span className="admin-history-time">
                      {new Date(h.changedAt).toLocaleString('es-MX')}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}
