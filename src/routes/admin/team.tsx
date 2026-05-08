import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
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
  FieldNumber,
  FieldSelect,
  FieldText,
} from '@/components/admin/fields'

export const Route = createFileRoute('/admin/team')({
  component: AdminTeamPage,
})

const bilingualSchema = z.object({
  es: z.string().min(1, 'Requerido'),
  en: z.string().min(1, 'Requerido'),
})

const optionalBilingualSchema = z
  .object({ es: z.string(), en: z.string() })
  .optional()

const teamSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  role: bilingualSchema,
  career: z.string().optional(),
  group: z.string().min(1, 'Requerido'),
  tenure: z.string().optional(),
  isFirstBoard: z.boolean().optional(),
  bio: optionalBilingualSchema,
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  email: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  order: z.number().optional(),
})

type TeamFormValues = z.infer<typeof teamSchema>

const GROUPS: Array<{ value: string; label: string }> = [
  { value: 'directives', label: 'Mesa Directiva' },
  { value: 'ndrg', label: 'NDRG' },
  { value: 'proteomics', label: 'Proteomics' },
  { value: 'student-community', label: 'Student Community' },
]

const GROUP_LABELS: Record<string, string> = Object.fromEntries(GROUPS.map((g) => [g.value, g.label]))

const defaultValues: TeamFormValues = {
  name: '',
  role: { es: '', en: '' },
  career: '',
  group: 'directives',
  tenure: '',
  isFirstBoard: false,
  bio: { es: '', en: '' },
  imageUrl: '',
  galleryImageUrls: [],
  email: '',
  linkedinUrl: '',
  githubUrl: '',
}

function cleanOptional(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined
}

function cleanBilingual(value: { es?: string; en?: string } | undefined) {
  if (!value) return undefined
  if (!value.es && !value.en) return undefined
  return { es: value.es ?? '', en: value.en ?? '' }
}

function AdminTeamPage() {
  const members = useQuery(api.team.get)
  const create = useMutation(api.team.create)
  const update = useMutation(api.team.update)
  const remove = useMutation(api.team.remove)
  const reorder = useMutation(api.team.reorder)

  const [editing, setEditing] = useState<'new' | string | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!members) return []
    const q = filter.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.es.toLowerCase().includes(q) ||
        m.role.en.toLowerCase().includes(q)
      )
    })
  }, [members, filter])

  const grouped = useMemo(() => {
    const result: Record<string, typeof filtered> = {
      directives: [],
      ndrg: [],
      proteomics: [],
      'student-community': [],
    }
    for (const m of filtered) {
      const key = m.group ?? 'student-community'
      const bucket = result[key] ?? (result[key] = [])
      bucket.push(m)
    }
    return result
  }, [filtered])

  if (editing !== null) {
    const member = editing === 'new' ? null : members?.find((m) => m._id === editing)
    return (
      <TeamForm
        initial={member ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (values) => {
          const token = getAdminToken()
          if (!token) return
          const payload = {
            name: values.name,
            role: values.role,
            career: cleanOptional(values.career),
            group: values.group,
            tenure: cleanOptional(values.tenure),
            isFirstBoard: values.isFirstBoard,
            bio: cleanBilingual(values.bio),
            imageUrl: cleanOptional(values.imageUrl),
            galleryImageUrls: values.galleryImageUrls?.length ? values.galleryImageUrls : undefined,
            email: cleanOptional(values.email),
            linkedinUrl: cleanOptional(values.linkedinUrl),
            githubUrl: cleanOptional(values.githubUrl),
            order: values.order,
          }
          try {
            if (member) {
              await update({ sessionToken: token, id: member._id, ...payload })
              toast.success('Miembro actualizado')
            } else {
              await create({ sessionToken: token, ...payload })
              toast.success('Miembro creado')
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
          <h1 className="admin-page-title">Equipo</h1>
          <p className="admin-page-sub">Gestiona los miembros del equipo y su orden por grupo.</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          + Nuevo miembro
        </button>
      </div>

      <input
        type="text"
        className="admin-filter-input"
        placeholder="Filtrar por nombre o rol…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {members === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : (
        GROUPS.map((g) => (
          <div key={g.value} className="admin-list-section">
            <h2 className="admin-list-section-title">{g.label}</h2>
            {grouped[g.value].length ? (
              grouped[g.value].map((m) => (
                <div key={m._id} className="admin-card">
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt="" className="admin-card-thumb" />
                  ) : (
                    <div className="admin-card-thumb-fallback">{m.name.charAt(0)}</div>
                  )}
                  <div className="admin-card-body">
                    <p className="admin-card-title">{m.name}</p>
                    <p className="admin-card-meta">
                      {m.role.es} · {m.role.en}
                    </p>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={async () => {
                        const token = getAdminToken()
                        if (!token) return
                        await reorder({ sessionToken: token, id: m._id, direction: 'up' })
                      }}
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={async () => {
                        const token = getAdminToken()
                        if (!token) return
                        await reorder({ sessionToken: token, id: m._id, direction: 'down' })
                      }}
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => setEditing(m._id)}
                      aria-label="Editar"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar a "${m.name}"?`)) return
                        const token = getAdminToken()
                        if (!token) return
                        try {
                          await remove({ sessionToken: token, id: m._id })
                          toast.success('Miembro eliminado')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Error al eliminar')
                        }
                      }}
                      aria-label="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-empty">Sin miembros en {GROUP_LABELS[g.value]}</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

type TeamMemberDoc = {
  _id: Id<'teamMembers'>
  name: string
  role: { es: string; en: string }
  career?: string
  group?: string
  tenure?: string
  isFirstBoard?: boolean
  bio?: { es: string; en: string }
  imageUrl?: string
  galleryImageUrls?: Array<string>
  email?: string
  linkedinUrl?: string
  githubUrl?: string
  order?: number
}

function TeamForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: TeamMemberDoc | null
  onSubmit: (values: TeamFormValues) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          role: initial.role,
          career: initial.career ?? '',
          group: initial.group ?? 'directives',
          tenure: initial.tenure ?? '',
          isFirstBoard: initial.isFirstBoard ?? false,
          bio: initial.bio ?? { es: '', en: '' },
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
          email: initial.email ?? '',
          linkedinUrl: initial.linkedinUrl ?? '',
          githubUrl: initial.githubUrl ?? '',
          order: initial.order,
        }
      : defaultValues,
  })

  return (
    <FormProvider {...form}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{initial ? 'Editar miembro' : 'Nuevo miembro'}</h1>
        </div>
      </div>
      <form
        className="admin-form-shell"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldText<TeamFormValues> name="name" label="Nombre" required />
        <FieldBilingualText<TeamFormValues> name="role" label="Rol" required />
        <FieldSelect<TeamFormValues>
          name="group"
          label="Grupo"
          required
          options={GROUPS}
        />
        <FieldText<TeamFormValues> name="career" label="Carrera" />
        <FieldText<TeamFormValues> name="tenure" label="Gestión" placeholder="2025-2026" />
        <FieldCheckbox<TeamFormValues> name="isFirstBoard" label="Primera Mesa Directiva" />
        <FieldBilingualTextarea<TeamFormValues> name="bio" label="Biografía" />
        <FieldImageUpload<TeamFormValues>
          name="imageUrl"
          label="Foto principal"
          control={form.control}
        />
        <FieldGallery<TeamFormValues>
          name="galleryImageUrls"
          label="Galería"
          control={form.control}
        />
        <FieldText<TeamFormValues> name="email" label="Email" type="email" />
        <FieldText<TeamFormValues> name="linkedinUrl" label="LinkedIn" />
        <FieldText<TeamFormValues> name="githubUrl" label="GitHub" />
        <FieldNumber<TeamFormValues> name="order" label="Orden" />
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
