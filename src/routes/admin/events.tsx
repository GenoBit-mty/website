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
  FieldCheckbox,
  FieldGallery,
  FieldImageUpload,
  FieldText,
  FormSection,
} from '@/components/admin/fields'

export const Route = createFileRoute('/admin/events')({
  component: AdminEventsPage,
})

const bilingual = z.object({
  es: z.string().min(1, 'Requerido'),
  en: z.string().min(1, 'Requerido'),
})

const eventSchema = z.object({
  category: z.string().optional(),
  title: bilingual,
  description: bilingual,
  date: z.string().min(1, 'Requerido'),
  location: z.string().min(1, 'Requerido'),
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  requiresRegistration: z.boolean().optional(),
  registrationUrl: z.string().optional(),
  isUpcoming: z.boolean().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

const defaultValues: EventFormValues = {
  category: '',
  title: { es: '', en: '' },
  description: { es: '', en: '' },
  date: '',
  location: '',
  imageUrl: '',
  galleryImageUrls: [],
  requiresRegistration: false,
  registrationUrl: '',
  isUpcoming: false,
}

const cleanOptional = (v: string | undefined) => (v && v.trim() ? v : undefined)

type EventDoc = {
  _id: Id<'events'>
  category?: string
  title: { es: string; en: string }
  description: { es: string; en: string }
  date: string
  location: string
  imageUrl?: string
  galleryImageUrls?: Array<string>
  requiresRegistration?: boolean
  registrationUrl?: string
  isUpcoming?: boolean
}

function AdminEventsPage() {
  const events = useQuery(api.events.get)
  const create = useMutation(api.events.create)
  const update = useMutation(api.events.update)
  const remove = useMutation(api.events.remove)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  if (editing !== null) {
    const ev = editing === 'new' ? null : events?.find((e) => e._id === editing)
    return (
      <EventForm
        initial={ev ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (values) => {
          const token = getAdminToken()
          if (!token) return
          const payload = {
            category: cleanOptional(values.category),
            title: values.title,
            description: values.description,
            date: values.date,
            location: values.location,
            imageUrl: cleanOptional(values.imageUrl),
            galleryImageUrls: values.galleryImageUrls?.length
              ? values.galleryImageUrls
              : undefined,
            requiresRegistration: values.requiresRegistration,
            registrationUrl: values.requiresRegistration
              ? cleanOptional(values.registrationUrl)
              : undefined,
            isUpcoming: values.isUpcoming,
          }
          try {
            if (ev) {
              await update({ sessionToken: token, id: ev._id, ...payload })
              toast.success('Evento actualizado')
            } else {
              await create({ sessionToken: token, ...payload })
              toast.success('Evento creado')
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
          <h1 className="admin-page-title">Eventos</h1>
          <p className="admin-page-sub">
            Talleres, conferencias y actividades.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => setEditing('new')}
        >
          + Nuevo evento
        </button>
      </div>

      {events === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : events.length === 0 ? (
        <p className="admin-empty">Aún no hay eventos.</p>
      ) : (
        events.map((e) => (
          <div key={e._id} className="admin-card">
            {e.imageUrl ? (
              <img src={e.imageUrl} alt="" className="admin-card-thumb" />
            ) : (
              <div className="admin-card-thumb-fallback">E</div>
            )}
            <div className="admin-card-body">
              <p className="admin-card-title">{e.title.es}</p>
              <p className="admin-card-meta">
                {e.date} · {e.location} {e.isUpcoming ? '· próximo' : ''}
              </p>
            </div>
            <div className="admin-card-actions">
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditing(e._id)}
                aria-label="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={async () => {
                  if (!confirm(`¿Eliminar evento "${e.title.es}"?`)) return
                  const token = getAdminToken()
                  if (!token) return
                  try {
                    await remove({ sessionToken: token, id: e._id })
                    toast.success('Evento eliminado')
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

function EventForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: EventDoc | null
  onSubmit: (v: EventFormValues) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: initial
      ? {
          category: initial.category ?? '',
          title: initial.title,
          description: initial.description,
          date: initial.date,
          location: initial.location,
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
          requiresRegistration:
            initial.requiresRegistration ?? Boolean(initial.registrationUrl),
          registrationUrl: initial.registrationUrl ?? '',
          isUpcoming: initial.isUpcoming ?? false,
        }
      : defaultValues,
  })

  return (
    <FormProvider {...form}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {initial ? 'Editar evento' : 'Nuevo evento'}
          </h1>
        </div>
      </div>
      <form className="admin-form-shell" onSubmit={form.handleSubmit(onSubmit)}>
        <FormSection title="Datos básicos">
          <FieldText<EventFormValues> name="category" label="Categoría" />
          <FieldBilingualText<EventFormValues>
            name="title"
            label="Título"
            required
          />
          <FieldText<EventFormValues>
            name="date"
            label="Fecha"
            placeholder="2026-04-12 · 18:00"
            required
          />
          <FieldText<EventFormValues> name="location" label="Lugar" required />
          <FieldCheckbox<EventFormValues>
            name="isUpcoming"
            label="Es un evento próximo"
          />
        </FormSection>
        <FormSection title="Contenido">
          <FieldBilingualTextarea<EventFormValues>
            name="description"
            label="Descripción"
            required
            rows={4}
          />
          <FieldImageUpload<EventFormValues>
            name="imageUrl"
            label="Imagen principal"
            control={form.control}
          />
        </FormSection>
        <FormSection title="Galería">
          <FieldGallery<EventFormValues>
            name="galleryImageUrls"
            label="Galería"
            control={form.control}
          />
        </FormSection>
        <FormSection title="Inscripción">
          <FieldCheckbox<EventFormValues>
            name="requiresRegistration"
            label="Requiere registro"
            description="Si está activado, se mostrará un botón de Registrarse con el enlace que indiques."
          />
          {form.watch('requiresRegistration') && (
            <FieldText<EventFormValues>
              name="registrationUrl"
              label="URL de registro"
            />
          )}
        </FormSection>
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}
