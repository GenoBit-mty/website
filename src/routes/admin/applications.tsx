import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Application, ApplicationStatus } from '@/lib/applications'
import { getAdminToken } from '@/lib/adminAuth'
import {
  APPLICATION_STATUSES,
  CSV_COLUMNS,
  GROUPS,
  applicationToCsvRow,
  isTerminalStatus,
} from '@/lib/applications'

export const Route = createFileRoute('/admin/applications')({
  component: AdminApplicationsPage,
})

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'Nuevo',
  under_review: 'En revisión',
  contacted: 'Contactado',
  interview_scheduled: 'Entrevista agendada',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const GROUP_LABEL: Record<string, string> = {
  ndrg: 'NDRG',
  proteomics: 'Proteomics',
  'student-community': 'Student Community',
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCsv(filename: string, rows: Array<Array<string>>) {
  const header = (CSV_COLUMNS as ReadonlyArray<string>).map(escapeCsv).join(',')
  const body = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
  const csv = `${header}\n${body}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function AdminApplicationsPage() {
  const token = getAdminToken()
  const applications = useQuery(
    api.applications.list,
    token ? { sessionToken: token } : 'skip',
  )
  const isOpen = useQuery(api.siteSettings.getApplicationsOpen)
  const setApplicationsOpen = useMutation(api.siteSettings.setApplicationsOpen)

  const [showArchived, setShowArchived] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const filtered = useMemo(() => {
    if (!applications) return []
    const q = search.trim().toLowerCase()
    return applications.filter((a) => {
      if (!showArchived && isTerminalStatus(a.status)) return false
      if (groupFilter && a.group !== groupFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      if (
        assigneeFilter &&
        (a.assigneeName ?? '').toLowerCase() !== assigneeFilter.toLowerCase()
      )
        return false
      if (q) {
        const hay = `${a.fullName} ${a.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    applications,
    showArchived,
    groupFilter,
    statusFilter,
    assigneeFilter,
    search,
  ])

  const assigneeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const a of applications ?? []) {
      if (a.assigneeName) set.add(a.assigneeName)
    }
    return Array.from(set).sort()
  }, [applications])

  const toggleOpen = async () => {
    if (!token) return
    try {
      await setApplicationsOpen({ sessionToken: token, open: !isOpen })
      toast.success(isOpen ? 'Aplicaciones cerradas' : 'Aplicaciones abiertas')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onExport = () => {
    const rows = filtered.map((a) =>
      // Cast: Convex Doc<'applications'> is structurally compatible with the
      // pure Application domain type used by applicationToCsvRow.
      applicationToCsvRow(a as unknown as Application),
    )
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`genobit-applications-${today}.csv`, rows)
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Aplicaciones</h1>
          <p className="admin-page-sub">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'aplicación' : 'aplicaciones'}
            {showArchived ? '' : ' activas'}
          </p>
        </div>
        <div className="admin-actions-row">
          <button
            type="button"
            className={`admin-btn ${isOpen ? 'is-open' : 'is-closed'}`}
            onClick={toggleOpen}
          >
            {isOpen ? '● Aplicaciones abiertas' : '○ Aplicaciones cerradas'}
          </button>
          <button type="button" className="admin-btn" onClick={onExport}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          className="admin-input"
          placeholder="Buscar por nombre o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-input"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">Todas las áreas</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABEL[g]}
            </option>
          ))}
        </select>
        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Cualquier estado</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          className="admin-input"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Cualquier responsable</option>
          {assigneeOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <label className="admin-toggle-inline">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Mostrar archivadas</span>
        </label>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Área</th>
            <th>Sub-área</th>
            <th>Estado</th>
            <th>Responsable</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a._id}>
              <td>
                <Link
                  to="/admin/applications/$id"
                  params={{ id: a._id }}
                  className="admin-table-link"
                >
                  {a.fullName}
                </Link>
                <div className="admin-table-sub">{a.email}</div>
              </td>
              <td>{GROUP_LABEL[a.group] ?? a.group}</td>
              <td>{a.subArea ?? '—'}</td>
              <td>{STATUS_LABEL[a.status]}</td>
              <td>{a.assigneeName ?? '—'}</td>
              <td suppressHydrationWarning>
                {new Date(a.submittedAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="admin-table-empty">
                Sin aplicaciones que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
