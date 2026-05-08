import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { getAdminToken } from '@/lib/adminAuth'
import {
  FieldBilingualTextarea,
  FieldGallery,
  FieldImageUpload,
  FieldText,
} from '@/components/admin/fields'

export const Route = createFileRoute('/admin/admins')({
  component: AdminAdminsPage,
})

const bilingual = z.object({ es: z.string().min(1, 'Requerido'), en: z.string().min(1, 'Requerido') })

const memberSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  role: bilingual,
  imageUrl: z.string().optional(),
})

const adminSchema = z.object({
  period: z.string().min(1, 'Requerido'),
  presidentName: z.string().min(1, 'Requerido'),
  description: z.object({ es: z.string(), en: z.string() }).optional(),
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  members: z.array(memberSchema),
})

type AdminFormValues = z.infer<typeof adminSchema>

const defaultValues: AdminFormValues = {
  period: '',
  presidentName: '',
  description: { es: '', en: '' },
  imageUrl: '',
  galleryImageUrls: [],
  members: [],
}

const cleanOptional = (v: string | undefined) => (v && v.trim() ? v : undefined)
const cleanBilingual = (b: { es?: string; en?: string } | undefined) =>
  !b || (!b.es && !b.en) ? undefined : { es: b.es ?? '', en: b.en ?? '' }

type AdminDoc = {
  _id: Id<'pastAdministrations'>
  period: string
  presidentName: string
  description?: { es: string; en: string }
  imageUrl?: string
  galleryImageUrls?: Array<string>
  members: Array<{ name: string; role: { es: string; en: string }; imageUrl?: string }>
}

function AdminAdminsPage() {
  const admins = useQuery(api.pastAdmin.get)
  const create = useMutation(api.pastAdmin.create)
  const update = useMutation(api.pastAdmin.update)
  const remove = useMutation(api.pastAdmin.remove)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  if (editing !== null) {
    const adm = editing === 'new' ? null : admins?.find((a) => a._id === editing)
    return (
      <AdminForm
        initial={adm ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (values) => {
          const token = getAdminToken()
          if (!token) return
          const payload = {
            period: values.period,
            presidentName: values.presidentName,
            description: cleanBilingual(values.description),
            imageUrl: cleanOptional(values.imageUrl),
            galleryImageUrls: values.galleryImageUrls?.length ? values.galleryImageUrls : undefined,
            members: values.members.map((m) => ({
              name: m.name,
              role: m.role,
              imageUrl: cleanOptional(m.imageUrl),
            })),
          }
          try {
            if (adm) {
              await update({ sessionToken: token, id: adm._id, ...payload })
              toast.success('Mesa actualizada')
            } else {
              await create({ sessionToken: token, ...payload })
              toast.success('Mesa creada')
            }
            setEditing(null)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al guardar')
          }
        }}
      />
    )
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Mesas pasadas</h1>
          <p className="admin-page-sub">Archivo histórico de mesas directivas.</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          + Nueva mesa
        </button>
      </div>

      {admins === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : admins.length === 0 ? (
        <p className="admin-empty">Aún no hay mesas archivadas.</p>
      ) : (
        admins.map((a) => (
          <div key={a._id} className="admin-card">
            {a.imageUrl ? (
              <img src={a.imageUrl} alt="" className="admin-card-thumb" />
            ) : (
              <div className="admin-card-thumb-fallback">{a.period.charAt(0)}</div>
            )}
            <div className="admin-card-body">
              <p className="admin-card-title">{a.period}</p>
              <p className="admin-card-meta">
                Presidencia: {a.presidentName} · {a.members.length} miembros
              </p>
            </div>
            <div className="admin-card-actions">
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditing(a._id)}
                aria-label="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={async () => {
                  if (!confirm(`¿Eliminar la mesa "${a.period}"?`)) return
                  const token = getAdminToken()
                  if (!token) return
                  try {
                    await remove({ sessionToken: token, id: a._id })
                    toast.success('Eliminada')
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Error')
                  }
                }}
                aria-label="Eliminar"
              >
                ×
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AdminForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: AdminDoc | null
  onSubmit: (v: AdminFormValues) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: initial
      ? {
          period: initial.period,
          presidentName: initial.presidentName,
          description: initial.description ?? { es: '', en: '' },
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
          members: initial.members.map((m) => ({
            name: m.name,
            role: m.role,
            imageUrl: m.imageUrl ?? '',
          })),
        }
      : defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members',
  })

  return (
    <FormProvider {...form}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{initial ? 'Editar mesa' : 'Nueva mesa'}</h1>
        </div>
      </div>
      <form className="admin-form-shell" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldText<AdminFormValues> name="period" label="Periodo" placeholder="2023-2024" required />
        <FieldText<AdminFormValues> name="presidentName" label="Nombre del presidente" required />
        <FieldBilingualTextarea<AdminFormValues> name="description" label="Descripción" rows={4} />
        <FieldImageUpload<AdminFormValues> name="imageUrl" label="Foto principal" control={form.control} />
        <FieldGallery<AdminFormValues> name="galleryImageUrls" label="Galería" control={form.control} />

        <div className="admin-members-section">
          <div className="admin-page-header" style={{ marginBottom: 12, paddingBottom: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Miembros</h2>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => append({ name: '', role: { es: '', en: '' }, imageUrl: '' })}
            >
              + Agregar miembro
            </button>
          </div>

          {fields.length === 0 && (
            <p className="admin-empty" style={{ padding: '24px 12px' }}>
              Sin miembros aún.
            </p>
          )}

          {fields.map((field, idx) => (
            <div key={field.id} className="admin-member-row">
              <label className="admin-field">
                <span className="admin-field-label">Nombre</span>
                <input
                  className="admin-input"
                  {...form.register(`members.${idx}.name`)}
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Rol (ES)</span>
                <input
                  className="admin-input"
                  {...form.register(`members.${idx}.role.es`)}
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Rol (EN)</span>
                <input
                  className="admin-input"
                  {...form.register(`members.${idx}.role.en`)}
                />
              </label>
              <Controller
                control={form.control}
                name={`members.${idx}.imageUrl`}
                render={({ field: imgField }) => (
                  <label className="admin-field">
                    <span className="admin-field-label">Imagen URL</span>
                    <input
                      className="admin-input"
                      value={imgField.value ?? ''}
                      onChange={imgField.onChange}
                      placeholder="https://…"
                    />
                  </label>
                )}
              />
              <div className="admin-member-actions">
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => remove(idx)}
                  aria-label="Quitar"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="admin-btn" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}
