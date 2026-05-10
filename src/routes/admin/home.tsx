import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { getAdminToken } from '@/lib/adminAuth'

export const Route = createFileRoute('/admin/home')({
  component: AdminHomePage,
})

const SLOTS: Array<{
  key: 'research' | 'team' | 'events'
  label: string
  description: string
}> = [
  {
    key: 'research',
    label: 'Investigación',
    description:
      'Imagen mostrada junto al bloque de investigación en la portada.',
  },
  {
    key: 'team',
    label: 'Equipo',
    description: 'Imagen mostrada junto al bloque de equipo en la portada.',
  },
  {
    key: 'events',
    label: 'Eventos',
    description: 'Imagen mostrada junto al bloque de eventos en la portada.',
  },
]

function AdminHomePage() {
  const homeImages = useQuery(api.home.getAll)
  const setSlot = useMutation(api.home.setSlot)
  const clearSlot = useMutation(api.home.clearSlot)
  const generateUploadUrl = useMutation(api.content.generateUploadUrl)
  const resolveUploadedUrl = useMutation(api.content.resolveUploadedUrl)
  const [browsingSlot, setBrowsingSlot] = useState<string | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  const slotMap = new Map<string, string>()
  for (const row of homeImages ?? []) slotMap.set(row.slot, row.imageUrl)

  const onSelect = async (slot: string, url: string) => {
    const token = getAdminToken()
    if (!token) return
    try {
      await setSlot({ sessionToken: token, slot, imageUrl: url })
      toast.success('Imagen actualizada')
      setBrowsingSlot(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const onUpload = async (slot: string, file: File) => {
    const token = getAdminToken()
    if (!token) return
    setUploadingSlot(slot)
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken: token })
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error('Falló la subida')
      const { storageId } = (await res.json()) as { storageId: string }
      const { url } = await resolveUploadedUrl({
        sessionToken: token,
        storageId,
      })
      await setSlot({ sessionToken: token, slot, imageUrl: url })
      toast.success('Imagen subida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de subida')
    } finally {
      setUploadingSlot(null)
    }
  }

  const onClear = async (slot: string) => {
    const token = getAdminToken()
    if (!token) return
    try {
      await clearSlot({ sessionToken: token, slot })
      toast.success('Imagen quitada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Portada</h1>
          <p className="admin-page-sub">
            Selecciona las imágenes mostradas en los bloques de la página
            principal. Puedes subir nuevas o reutilizar imágenes ya cargadas.
          </p>
        </div>
      </div>

      {homeImages === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : (
        <div className="admin-form-shell">
          {SLOTS.map((slot) => {
            const current = slotMap.get(slot.key)
            const uploading = uploadingSlot === slot.key
            return (
              <div key={slot.key} className="admin-card">
                {current ? (
                  <img src={current} alt="" className="admin-card-thumb" />
                ) : (
                  <div className="admin-card-thumb-fallback">
                    {slot.label.charAt(0)}
                  </div>
                )}
                <div className="admin-card-body">
                  <p className="admin-card-title">{slot.label}</p>
                  <p className="admin-card-meta">{slot.description}</p>
                  <div
                    className="admin-form-actions"
                    style={{ marginTop: 12, justifyContent: 'flex-start' }}
                  >
                    <label
                      className="admin-btn admin-btn-secondary"
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) onUpload(slot.key, file)
                          e.target.value = ''
                        }}
                      />
                      {uploading ? 'Subiendo…' : 'Subir nueva'}
                    </label>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => setBrowsingSlot(slot.key)}
                    >
                      Elegir existente
                    </button>
                    {current && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={() => onClear(slot.key)}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {browsingSlot && (
        <BrowseModal
          slot={browsingSlot}
          onClose={() => setBrowsingSlot(null)}
          onSelect={(url) => onSelect(browsingSlot, url)}
        />
      )}
    </div>
  )
}

function BrowseModal({
  slot,
  onClose,
  onSelect,
}: {
  slot: string
  onClose: () => void
  onSelect: (url: string) => void
}) {
  const images = useQuery(api.home.listAvailableImages)
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 42, 58, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#faf8f5',
          padding: 24,
          borderRadius: 4,
          maxWidth: 960,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="admin-page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="admin-page-title" style={{ fontSize: 20 }}>
              Elegir imagen — {slot}
            </h2>
            <p className="admin-page-sub">Selecciona una imagen ya subida.</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        {images === undefined ? (
          <p className="admin-empty">Cargando…</p>
        ) : images.length === 0 ? (
          <p className="admin-empty">No hay imágenes subidas todavía.</p>
        ) : (
          <div
            className="admin-gallery"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {images.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => onSelect(url)}
                style={{
                  padding: 0,
                  border: '1px solid var(--gb-rule, rgba(16,42,58,0.12))',
                  background: '#fff',
                  cursor: 'pointer',
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
