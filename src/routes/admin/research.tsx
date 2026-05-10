import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { slugify } from '../../../convex/lib/slug'
import type { Id } from '../../../convex/_generated/dataModel'
import { getAdminToken } from '@/lib/adminAuth'
import {
  FieldBilingualText,
  FieldBilingualTextarea,
  FieldGallery,
  FieldImageUpload,
  FieldStringList,
  FieldText,
  FormSection,
} from '@/components/admin/fields'

export const Route = createFileRoute('/admin/research')({
  component: AdminResearchPage,
})

const bilingual = z.object({
  es: z.string().min(1, 'Requerido'),
  en: z.string().min(1, 'Requerido'),
})

const researchSchema = z.object({
  title: bilingual,
  description: bilingual,
  body: bilingual.optional(),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  authors: z.array(z.string()).min(1, 'Al menos un autor'),
  publicationDate: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

type ResearchFormValues = z.infer<typeof researchSchema>

const defaultValues: ResearchFormValues = {
  title: { es: '', en: '' },
  description: { es: '', en: '' },
  body: { es: '', en: '' },
  slug: '',
  authors: [''],
  publicationDate: '',
  url: '',
  imageUrl: '',
  galleryImageUrls: [],
  tags: [],
}

const cleanOptional = (v: string | undefined) => (v && v.trim() ? v : undefined)
const cleanList = (l: Array<string> | undefined) =>
  l?.filter((x) => x.trim()) ?? []

type ResearchDoc = {
  _id: Id<'research'>
  title: { es: string; en: string }
  description: { es: string; en: string }
  body?: { es: string; en: string }
  slug?: string
  authors: Array<string>
  publicationDate?: string
  url?: string
  imageUrl?: string
  galleryImageUrls?: Array<string>
  tags?: Array<string>
}

function AdminResearchPage() {
  const papers = useQuery(api.research.get)
  const create = useMutation(api.research.create)
  const update = useMutation(api.research.update)
  const remove = useMutation(api.research.remove)
  const [editing, setEditing] = useState<'new' | string | null>(null)

  if (editing !== null) {
    const paper =
      editing === 'new' ? null : papers?.find((p) => p._id === editing)
    return (
      <ResearchForm
        initial={paper ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (values) => {
          const token = getAdminToken()
          if (!token) return
          const authors = cleanList(values.authors)
          if (!authors.length) {
            toast.error('Al menos un autor')
            return
          }
          const body =
            values.body && (values.body.es.trim() || values.body.en.trim())
              ? values.body
              : undefined
          const payload = {
            title: values.title,
            description: values.description,
            body,
            slug: values.slug.trim(),
            authors,
            publicationDate: cleanOptional(values.publicationDate),
            url: cleanOptional(values.url),
            imageUrl: cleanOptional(values.imageUrl),
            galleryImageUrls: values.galleryImageUrls?.length
              ? values.galleryImageUrls
              : undefined,
            tags: cleanList(values.tags).length
              ? cleanList(values.tags)
              : undefined,
          }
          try {
            if (paper) {
              await update({ sessionToken: token, id: paper._id, ...payload })
              toast.success('Investigación actualizada')
            } else {
              await create({ sessionToken: token, ...payload })
              toast.success('Investigación creada')
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
          <h1 className="admin-page-title">Investigación</h1>
          <p className="admin-page-sub">Papers y publicaciones.</p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => setEditing('new')}
        >
          + Nuevo paper
        </button>
      </div>

      {papers === undefined ? (
        <p className="admin-empty">Cargando…</p>
      ) : papers.length === 0 ? (
        <p className="admin-empty">Aún no hay publicaciones.</p>
      ) : (
        papers.map((p) => (
          <div key={p._id} className="admin-card">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="admin-card-thumb" />
            ) : (
              <div className="admin-card-thumb-fallback">P</div>
            )}
            <div className="admin-card-body">
              <p className="admin-card-title">{p.title.es}</p>
              <p className="admin-card-meta">
                {p.authors.join(' · ')}{' '}
                {p.publicationDate ? `— ${p.publicationDate}` : ''}
              </p>
            </div>
            <div className="admin-card-actions">
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditing(p._id)}
                aria-label="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={async () => {
                  if (!confirm(`¿Eliminar "${p.title.es}"?`)) return
                  const token = getAdminToken()
                  if (!token) return
                  try {
                    await remove({ sessionToken: token, id: p._id })
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

function ResearchForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: ResearchDoc | null
  onSubmit: (v: ResearchFormValues) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          body: initial.body ?? { es: '', en: '' },
          slug: initial.slug ?? '',
          authors: initial.authors.length ? initial.authors : [''],
          publicationDate: initial.publicationDate ?? '',
          url: initial.url ?? '',
          imageUrl: initial.imageUrl ?? '',
          galleryImageUrls: initial.galleryImageUrls ?? [],
          tags: initial.tags ?? [],
        }
      : defaultValues,
  })

  const [slugDirty, setSlugDirty] = useState(Boolean(initial?.slug))
  const titleEn = form.watch('title.en')
  const slugValue = form.watch('slug')

  useEffect(() => {
    if (!slugDirty) {
      const generated = slugify(titleEn ?? '')
      if (generated !== slugValue) {
        form.setValue('slug', generated, {
          shouldValidate: false,
          shouldDirty: false,
        })
      }
    }
  }, [titleEn, slugDirty, slugValue, form])

  return (
    <FormProvider {...form}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {initial ? 'Editar paper' : 'Nuevo paper'}
          </h1>
        </div>
      </div>
      <form className="admin-form-shell" onSubmit={form.handleSubmit(onSubmit)}>
        <FormSection title="Datos básicos">
          <FieldBilingualText<ResearchFormValues>
            name="title"
            label="Título"
            required
          />
          <FieldStringList<ResearchFormValues>
            name="authors"
            label="Autores"
            required
            control={form.control}
          />
          <FieldText<ResearchFormValues>
            name="publicationDate"
            label="Fecha de publicación"
            placeholder="2026"
          />
          <FieldText<ResearchFormValues> name="url" label="URL" />
          <div onInput={() => setSlugDirty(true)}>
            <FieldText<ResearchFormValues>
              name="slug"
              label="Slug (URL)"
              placeholder="ej. pipeline-somatic-variants"
              required
            />
          </div>
        </FormSection>

        <FormSection title="Contenido">
          <FieldBilingualTextarea<ResearchFormValues>
            name="description"
            label="Descripción"
            required
            rows={4}
          />
          <FieldBilingualTextarea<ResearchFormValues>
            name="body"
            label="Cuerpo (Markdown)"
            description="Markdown soportado: encabezados, listas, enlaces, imágenes."
            rows={16}
          />
          <FieldImageUpload<ResearchFormValues>
            name="imageUrl"
            label="Imagen"
            control={form.control}
          />
        </FormSection>

        <FormSection title="Galería">
          <FieldGallery<ResearchFormValues>
            name="galleryImageUrls"
            label="Galería"
            control={form.control}
          />
        </FormSection>

        <FormSection title="Etiquetas">
          <FieldStringList<ResearchFormValues>
            name="tags"
            label="Tags"
            control={form.control}
          />
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
