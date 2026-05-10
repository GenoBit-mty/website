import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { BulkRow } from '@/lib/bulkImport'
import { getAdminToken } from '@/lib/adminAuth'
import { parseBulkRoster } from '@/lib/bulkImport'

type Phase = 'edit' | 'preview'

export function BulkImportModal({
  group,
  groupLabel,
  onClose,
  onImported,
}: {
  group: string
  groupLabel: string
  onClose: () => void
  onImported: () => void
}) {
  const [phase, setPhase] = useState<Phase>('edit')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bulkCreate = useMutation(api.team.bulkCreate)

  const result = useMemo(() => parseBulkRoster(text), [text])
  const validRows = result.rows.filter((r) => r.valid)

  const onCommit = async () => {
    const token = getAdminToken()
    if (!token) return
    setSubmitting(true)
    try {
      await bulkCreate({
        sessionToken: token,
        group,
        rows: validRows.map((r) => ({
          name: r.name,
          roleEs: r.roleEs,
          roleEn: r.roleEn,
          career: r.career,
        })),
      })
      toast.success(`${validRows.length} miembros añadidos`)
      onImported()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Importar lista — ${groupLabel}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Importar lista — {groupLabel}</h2>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {phase === 'edit' ? (
          <div className="admin-modal-body">
            <p className="admin-field-desc">
              Pega una persona por línea, en formato:{' '}
              <code>Nombre | Rol ES | Rol EN | Carrera (opcional)</code>
            </p>
            <p className="admin-field-desc">
              Las líneas vacías y las que empiezan con <code>#</code> se
              ignoran.
            </p>
            <textarea
              className="admin-textarea admin-bulk-textarea"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`# NDRG roster\nFedra Mandujano | Investigadora Principal | Principal Investigator | IDM\nRogelio Lara | Investigador | Researcher | IBT`}
            />
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={result.rows.length === 0}
                onClick={() => setPhase('preview')}
              >
                Vista previa →
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-modal-body">
            <table className="admin-bulk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Rol ES</th>
                  <th>Rol EN</th>
                  <th>Carrera</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r: BulkRow) => (
                  <tr
                    key={r.lineNumber}
                    className={r.valid ? '' : 'admin-bulk-row-invalid'}
                  >
                    <td>{r.lineNumber}</td>
                    <td>{r.name || <em>(vacío)</em>}</td>
                    <td>{r.roleEs || <em>(vacío)</em>}</td>
                    <td>{r.roleEn || <em>(vacío)</em>}</td>
                    <td>{r.career ?? '—'}</td>
                    <td>{r.valid ? '✓' : `✗ ${r.error}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setPhase('edit')}
              >
                ← Editar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={
                  result.hasErrors || validRows.length === 0 || submitting
                }
                onClick={onCommit}
              >
                {submitting
                  ? 'Importando…'
                  : `Crear ${validRows.length} miembros`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
