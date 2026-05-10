import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../../convex/_generated/api'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Id } from '../../../convex/_generated/dataModel'
import { getAdminToken } from '@/lib/adminAuth'
import { BulkImportModal } from '@/components/admin/BulkImportModal'
import {
  FieldBilingualText,
  FieldBilingualTextarea,
  FieldCheckbox,
  FieldGallery,
  FieldImageUpload,
  FieldNumber,
  FieldSelect,
  FieldText,
  FormSection,
} from '@/components/admin/fields'

const teamSearchSchema = z.object({
  group: z
    .enum(['directives', 'ndrg', 'proteomics', 'student-community'])
    .optional(),
})

export const Route = createFileRoute('/admin/team')({
  component: AdminTeamPage,
  validateSearch: teamSearchSchema,
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

const GROUP_LABELS: Record<string, string> = Object.fromEntries(
  GROUPS.map((g) => [g.value, g.label]),
)

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

  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const activeGroup = search.group ?? null

  const setActiveGroup = (next: string | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        group: (next as typeof search.group) ?? undefined,
      }),
      replace: true,
    })
  }

  const [editing, setEditing] = useState<'new' | string | null>(null)
  const [filter, setFilter] = useState('')
  const [bulkImportGroup, setBulkImportGroup] = useState<string | null>(null)

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

  const groupCounts = useMemo(() => {
    if (!members) {
      return {
        all: 0,
        directives: 0,
        ndrg: 0,
        proteomics: 0,
        'student-community': 0,
      }
    }
    const counts = {
      all: members.length,
      directives: 0,
      ndrg: 0,
      proteomics: 0,
      'student-community': 0,
    }
    for (const m of members) {
      const key = m.group ?? 'student-community'
      if (key in counts) counts[key as keyof typeof counts] += 1
    }
    return counts
  }, [members])

  const visibleGroups = activeGroup
    ? GROUPS.filter((g) => g.value === activeGroup)
    : GROUPS

  if (editing !== null) {
    const member =
      editing === 'new' ? null : members?.find((m) => m._id === editing)
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
            galleryImageUrls: values.galleryImageUrls?.length
              ? values.galleryImageUrls
              : undefined,
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
          <p className="admin-page-sub">
            Gestiona los miembros del equipo y su orden por grupo.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => setEditing('new')}
        >
          + Nuevo miembro
        </button>
      </div>

      <div
        className="admin-filter-chips"
        role="tablist"
        aria-label="Filtrar grupo"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeGroup === null}
          className={`admin-chip ${activeGroup === null ? 'is-active' : ''}`}
          onClick={() => setActiveGroup(null)}
        >
          Todos · {groupCounts.all}
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.value}
            type="button"
            role="tab"
            aria-selected={activeGroup === g.value}
            className={`admin-chip ${activeGroup === g.value ? 'is-active' : ''}`}
            onClick={() => setActiveGroup(g.value)}
          >
            {g.label} · {groupCounts[g.value as keyof typeof groupCounts]}
          </button>
        ))}
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
        visibleGroups.map((g) => (
          <SortableGroupSection
            key={g.value}
            group={g.value}
            groupLabel={g.label}
            members={grouped[g.value]}
            onEdit={(id) => setEditing(id)}
            onDelete={async (id, name) => {
              if (!confirm(`¿Eliminar a "${name}"?`)) return
              const token = getAdminToken()
              if (!token) return
              try {
                await remove({ sessionToken: token, id })
                toast.success('Miembro eliminado')
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : 'Error al eliminar',
                )
              }
            }}
            onOpenBulkImport={
              g.value !== 'directives'
                ? () => setBulkImportGroup(g.value)
                : null
            }
          />
        ))
      )}
      {bulkImportGroup ? (
        <BulkImportModal
          group={bulkImportGroup}
          groupLabel={GROUP_LABELS[bulkImportGroup] ?? bulkImportGroup}
          onClose={() => setBulkImportGroup(null)}
          onImported={() => {
            // Convex `useQuery` auto-revalidates, no manual refetch needed.
          }}
        />
      ) : null}
    </div>
  )
}

function SortableGroupSection({
  group,
  groupLabel,
  members,
  onEdit,
  onDelete,
  onOpenBulkImport,
}: {
  group: string
  groupLabel: string
  members: Array<TeamMemberDoc>
  onEdit: (id: Id<'teamMembers'>) => void
  onDelete: (id: Id<'teamMembers'>, name: string) => void
  onOpenBulkImport: (() => void) | null
}) {
  const setOrder = useMutation(api.team.setOrder)
  const [localOrder, setLocalOrder] = useState<Array<Id<'teamMembers'>>>(
    members.map((m) => m._id),
  )

  // Keep local order in sync if server data changes (e.g. after add/delete).
  useEffect(() => {
    setLocalOrder(members.map((m) => m._id))
  }, [members])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localOrder.indexOf(active.id as Id<'teamMembers'>)
    const newIndex = localOrder.indexOf(over.id as Id<'teamMembers'>)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(localOrder, oldIndex, newIndex)
    setLocalOrder(next)
    const token = getAdminToken()
    if (!token) return
    try {
      await setOrder({ sessionToken: token, group, orderedIds: next })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reordenar')
      setLocalOrder(members.map((m) => m._id))
    }
  }

  const orderedMembers = localOrder
    .map((id) => members.find((m) => m._id === id))
    .filter((m): m is TeamMemberDoc => Boolean(m))

  return (
    <div className="admin-list-section">
      <div className="admin-list-section-header">
        <h2 className="admin-list-section-title">{groupLabel}</h2>
        {onOpenBulkImport ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-small"
            onClick={onOpenBulkImport}
          >
            Importar lista
          </button>
        ) : null}
      </div>
      {orderedMembers.length === 0 ? (
        <p className="admin-empty">Sin miembros en {groupLabel}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={localOrder}
            strategy={verticalListSortingStrategy}
          >
            {orderedMembers.map((m) => (
              <SortableMemberCard
                key={m._id}
                member={m}
                onEdit={() => onEdit(m._id)}
                onDelete={() => onDelete(m._id, m.name)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function SortableMemberCard({
  member: m,
  onEdit,
  onDelete,
}: {
  member: TeamMemberDoc
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: m._id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="admin-card">
      <button
        type="button"
        className="admin-drag-handle"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
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
          onClick={onEdit}
          aria-label="Editar"
        >
          ✎
        </button>
        <button
          type="button"
          className="admin-icon-btn"
          onClick={onDelete}
          aria-label="Eliminar"
        >
          ×
        </button>
      </div>
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
          <h1 className="admin-page-title">
            {initial ? 'Editar miembro' : 'Nuevo miembro'}
          </h1>
        </div>
      </div>
      <form className="admin-form-shell" onSubmit={form.handleSubmit(onSubmit)}>
        <FormSection title="Datos básicos">
          <FieldText<TeamFormValues> name="name" label="Nombre" required />
          <FieldBilingualText<TeamFormValues>
            name="role"
            label="Rol"
            required
          />
          <FieldSelect<TeamFormValues>
            name="group"
            label="Grupo"
            required
            options={GROUPS}
          />
          <FieldText<TeamFormValues> name="career" label="Carrera" />
          <FieldText<TeamFormValues>
            name="tenure"
            label="Gestión"
            placeholder="2025-2026"
          />
          <FieldCheckbox<TeamFormValues>
            name="isFirstBoard"
            label="Primera Mesa Directiva"
          />
        </FormSection>

        <FormSection title="Perfil">
          <FieldImageUpload<TeamFormValues>
            name="imageUrl"
            label="Foto principal"
            control={form.control}
          />
          <FieldBilingualTextarea<TeamFormValues>
            name="bio"
            label="Biografía"
          />
        </FormSection>

        <FormSection title="Galería">
          <FieldGallery<TeamFormValues>
            name="galleryImageUrls"
            label="Galería"
            control={form.control}
          />
        </FormSection>

        <FormSection title="Contacto y orden">
          <FieldText<TeamFormValues> name="email" label="Email" type="email" />
          <FieldText<TeamFormValues> name="linkedinUrl" label="LinkedIn" />
          <FieldText<TeamFormValues> name="githubUrl" label="GitHub" />
          <FieldNumber<TeamFormValues> name="order" label="Orden" />
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
