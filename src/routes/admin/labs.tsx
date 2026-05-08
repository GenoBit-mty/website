import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { getAdminToken } from '@/lib/adminAuth'
import {
  FieldBilingualText,
  FieldBilingualTextarea,
  FieldGallery,
  FieldImageUpload,
  FieldStringList,
  FieldText,
} from '@/components/admin/fields'

export const Route = createFileRoute('/admin/labs')({
  component: AdminLabsPage,
})

const bilingual = z.object({ es: z.string().min(1, 'Requerido'), en: z.string().min(1, 'Requerido') })

const optionalBilingual = z.object({ es: z.string(), en: z.string() }).optional()

const labSchema = z.object({
  title: bilingual,
  summary: bilingual,
  description: optionalBilingual,
  focusAreas: z.array(z.string()).optional(),
  lead: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
})

type LabFormValues = z.infer<typeof labSchema>

const defaultValues: LabFormValues = {
  title: { es: '', en: '' },
  summary: { es: '', en: '' },
  description: { es: '', en: '' },
  focusAreas: [],
  lead: '',
  location: '',
  imageUrl: '',
  galleryImageUrls: [],
}

const cleanOptional = (v: string | undefined) => (v && v.trim() ? v : undefined)
const cleanList = (l: Array<string> | undefined) => l?.filter((x) => x.trim()) ?? []
const cleanBilingual = (b: { es?: string; en?: string } | undefined) =>
  !b || (!b.es && !b.en) ? undefined : { es: b.es ?? '', en: b.en ?? '' }

type LabDoc = {
  _id: Id<'labs'>
  title: { es: string; en: string }
  summary: { es: string; en: string }
  description?: { es: string; en: string }
  focusAreas?: Array<string>
  lead?: string
  location?: string
  imageUrl?: string
  galleryImageUrls?: Array<string>
}

function AdminLabsPage() {
  const labs = useQuery(api.labs.get)
  const create = useMutation(api.labs.create)
  const update = useMutation(api.labs.update)
  const remove = useMutation(api.labs.remove)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  if (editing !== null) {
    const lab = editing === 'new' ? null : labs?.find((l) => l._id === editing)
    return (
      <LabForm
        initial={lab ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (values) => {
          const token = getAdminToken()
          if (!token) return
          const payload = {
            title: values.title,
            summary: values.summary,
            description: cleanBilingual(values.description),
            focusAreas: cleanList(values.focusAreas).length ? cleanList(values.focusAreas) : undefined,
            lead: cleanOptional(values.lead),
            location: cleanOptional(values.location),
            imageUrl: cleanOptional(values.imageUrl),
            galleryImageUrls: values.galleryImageUrls?.length ? values.galleryImageUrls : undefined,
          }
          try {
            if (lab) {
              await update({ sessionToken: token, id: lab._id, ...payload })
              toast.success('Lab actualizado')
            } else {
              await create({ sessionToken: token, ...payload })
              toast.success('Lab creado')
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
          <h1 className="admin-page-title">Labs</h1>
          <p className="admin-page-sub">Grupos de investigación y áreas de trabajo.</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          + Nuevo lab
        </button>
      </div>

      {labs === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : labs.length === 0 ? (
        <p className="admin-empty">Aún no hay labs.</p>
      ) : (
        labs.map((l) => (
          <div key={l._id} className="admin-card">
            {l.imageUrl ? (
              <img src={l.imageUrl} alt="" className="admin-card-thumb" />
            ) : (
              <div className="admin-card-thumb-fallback">L</div>
            )}
            <div className="admin-card-body">
              <p className="admin-card-title">{l.title.es}</p>
              <p className="admin-card-meta">{l.summary.es}</p>
            </div>
            <div className="admin-card-actions">
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditing(l._id)}
                aria-label="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={async () => {
                  if (!confirm(`¿Eliminar "${l.title.es}"?`)) return
                  const token = getAdminToken()
                  if (!token) return
                  try {
                    await remove({ sessionToken: token, id: l._id })
                    toast.success('Eliminado')
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

function LabForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: LabDoc | null
  onSubmit: (v: LabFormValues) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          summary: initial.summary,
          description: initial.description ?? { es: '', en: '' },
          focusAreas: initial.focusAreas ?? [],
          lead: initial.lead ?? '',
          location: initial.location ?? '',
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
        }
      : defaultValues,
  })

  return (
    <FormProvider {...form}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{initial ? 'Editar lab' : 'Nuevo lab'}</h1>
        </div>
      </div>
      <form className="admin-form-shell" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldBilingualText<LabFormValues> name="title" label="Título" required />
        <FieldBilingualText<LabFormValues> name="summary" label="Resumen" required />
        <FieldBilingualTextarea<LabFormValues> name="description" label="Descripción" rows={4} />
        <FieldStringList<LabFormValues>
          name="focusAreas"
          label="Áreas de enfoque"
          control={form.control}
        />
        <FieldText<LabFormValues> name="lead" label="Líder" />
        <FieldText<LabFormValues> name="location" label="Ubicación" />
        <FieldImageUpload<LabFormValues> name="imageUrl" label="Imagen" control={form.control} />
        <FieldGallery<LabFormValues> name="galleryImageUrls" label="Galería" control={form.control} />
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
