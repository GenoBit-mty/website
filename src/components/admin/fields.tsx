import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Control, FieldValues, Path, PathValue } from 'react-hook-form'
import { getAdminToken } from '@/lib/adminAuth'

type BaseFieldProps<TForm extends FieldValues> = {
  name: Path<TForm>
  label: string
  description?: string
  required?: boolean
}

function FieldShell({
  label,
  description,
  required,
  error,
  children,
}: {
  label: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="admin-field">
      <label className="admin-field-label">
        {label}
        {required ? <span className="admin-field-required" aria-hidden="true">*</span> : null}
      </label>
      {description && <p className="admin-field-desc">{description}</p>}
      {children}
      {error && <p className="admin-field-error" role="alert">{error}</p>}
    </div>
  )
}

export function FieldText<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { placeholder?: string; type?: string },
) {
  const { register, formState } = useFormContext<TForm>()
  const error = (formState.errors[props.name as string] as { message?: string } | undefined)?.message
  return (
    <FieldShell label={props.label} description={props.description} required={props.required} error={error}>
      <input
        type={props.type ?? 'text'}
        placeholder={props.placeholder}
        className="admin-input"
        {...register(props.name)}
      />
    </FieldShell>
  )
}

export function FieldTextarea<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { rows?: number; placeholder?: string },
) {
  const { register, formState } = useFormContext<TForm>()
  const error = (formState.errors[props.name as string] as { message?: string } | undefined)?.message
  return (
    <FieldShell label={props.label} description={props.description} required={props.required} error={error}>
      <textarea
        rows={props.rows ?? 4}
        placeholder={props.placeholder}
        className="admin-textarea"
        {...register(props.name)}
      />
    </FieldShell>
  )
}

export function FieldNumber<TForm extends FieldValues>(props: BaseFieldProps<TForm>) {
  const { register, formState } = useFormContext<TForm>()
  const error = (formState.errors[props.name as string] as { message?: string } | undefined)?.message
  return (
    <FieldShell label={props.label} description={props.description} required={props.required} error={error}>
      <input
        type="number"
        className="admin-input"
        {...register(props.name, { valueAsNumber: true })}
      />
    </FieldShell>
  )
}

export function FieldCheckbox<TForm extends FieldValues>(
  props: BaseFieldProps<TForm>,
) {
  const { register } = useFormContext<TForm>()
  return (
    <div className="admin-field admin-field-inline">
      <label className="admin-checkbox-row">
        <input type="checkbox" {...register(props.name)} />
        <span>{props.label}</span>
      </label>
      {props.description && <p className="admin-field-desc">{props.description}</p>}
    </div>
  )
}

export function FieldSelect<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { options: Array<{ value: string; label: string }>; allowEmpty?: boolean },
) {
  const { register, formState } = useFormContext<TForm>()
  const error = (formState.errors[props.name as string] as { message?: string } | undefined)?.message
  return (
    <FieldShell label={props.label} description={props.description} required={props.required} error={error}>
      <select className="admin-input" {...register(props.name)}>
        {props.allowEmpty && <option value="">—</option>}
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FieldShell>
  )
}

export function FieldBilingualText<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { placeholder?: string },
) {
  const { register, formState } = useFormContext<TForm>()
  const errs = formState.errors[props.name as string] as
    | { es?: { message?: string }; en?: { message?: string }; message?: string }
    | undefined
  return (
    <FieldShell
      label={props.label}
      description={props.description}
      required={props.required}
      error={errs?.message}
    >
      <div className="admin-bilingual">
        <div className="admin-bilingual-row">
          <span className="admin-bilingual-tag">ES</span>
          <input
            type="text"
            placeholder={props.placeholder}
            className="admin-input"
            {...register(`${props.name}.es` as Path<TForm>)}
          />
        </div>
        {errs?.es?.message && <p className="admin-field-error">{errs.es.message}</p>}
        <div className="admin-bilingual-row">
          <span className="admin-bilingual-tag">EN</span>
          <input
            type="text"
            placeholder={props.placeholder}
            className="admin-input"
            {...register(`${props.name}.en` as Path<TForm>)}
          />
        </div>
        {errs?.en?.message && <p className="admin-field-error">{errs.en.message}</p>}
      </div>
    </FieldShell>
  )
}

export function FieldBilingualTextarea<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { rows?: number; placeholder?: string },
) {
  const { register, formState } = useFormContext<TForm>()
  const errs = formState.errors[props.name as string] as
    | { es?: { message?: string }; en?: { message?: string }; message?: string }
    | undefined
  return (
    <FieldShell
      label={props.label}
      description={props.description}
      required={props.required}
      error={errs?.message}
    >
      <div className="admin-bilingual">
        <div className="admin-bilingual-row">
          <span className="admin-bilingual-tag">ES</span>
          <textarea
            rows={props.rows ?? 3}
            placeholder={props.placeholder}
            className="admin-textarea"
            {...register(`${props.name}.es` as Path<TForm>)}
          />
        </div>
        {errs?.es?.message && <p className="admin-field-error">{errs.es.message}</p>}
        <div className="admin-bilingual-row">
          <span className="admin-bilingual-tag">EN</span>
          <textarea
            rows={props.rows ?? 3}
            placeholder={props.placeholder}
            className="admin-textarea"
            {...register(`${props.name}.en` as Path<TForm>)}
          />
        </div>
        {errs?.en?.message && <p className="admin-field-error">{errs.en.message}</p>}
      </div>
    </FieldShell>
  )
}

export function FieldStringList<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { placeholder?: string; control: Control<TForm> },
) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        const value = (field.value as Array<string> | undefined) ?? []
        const update = (next: Array<string>) =>
          field.onChange(next as PathValue<TForm, Path<TForm>>)
        return (
          <FieldShell
            label={props.label}
            description={props.description}
            required={props.required}
            error={fieldState.error?.message}
          >
            <div className="admin-list">
              {value.map((item, idx) => (
                <div key={idx} className="admin-list-row">
                  <input
                    type="text"
                    className="admin-input"
                    value={item}
                    onChange={(e) => {
                      const next = [...value]
                      next[idx] = e.target.value
                      update(next)
                    }}
                    placeholder={props.placeholder}
                  />
                  <button
                    type="button"
                    className="admin-list-remove"
                    onClick={() => update(value.filter((_, i) => i !== idx))}
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-list-add"
                onClick={() => update([...value, ''])}
              >
                + Agregar
              </button>
            </div>
          </FieldShell>
        )
      }}
    />
  )
}

export function FieldImageUpload<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { control: Control<TForm> },
) {
  const generateUploadUrl = useMutation(api.content.generateUploadUrl)
  const resolveUploadedUrl = useMutation(api.content.resolveUploadedUrl)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? ''
        const onFile = async (file: File) => {
          const token = getAdminToken()
          if (!token) return
          setUploading(true)
          setUploadError(null)
          try {
            const uploadUrl = await generateUploadUrl({ sessionToken: token })
            const res = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': file.type },
              body: file,
            })
            if (!res.ok) throw new Error('Falló la subida')
            const { storageId } = (await res.json()) as { storageId: string }
            const { url } = await resolveUploadedUrl({ sessionToken: token, storageId })
            field.onChange(url as PathValue<TForm, Path<TForm>>)
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Error de subida')
          } finally {
            setUploading(false)
          }
        }
        return (
          <FieldShell
            label={props.label}
            description={props.description}
            required={props.required}
            error={fieldState.error?.message ?? uploadError ?? undefined}
          >
            <div className="admin-image-field">
              {value ? (
                <div className="admin-image-preview">
                  <img src={value} alt="" />
                  <button
                    type="button"
                    className="admin-image-clear"
                    onClick={() => field.onChange('' as PathValue<TForm, Path<TForm>>)}
                    aria-label="Quitar imagen"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="admin-image-empty">Sin imagen</div>
              )}
              <input
                type="text"
                className="admin-input"
                placeholder="URL de imagen"
                value={value}
                onChange={(e) => field.onChange(e.target.value as PathValue<TForm, Path<TForm>>)}
              />
              <label className="admin-image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFile(file)
                    e.target.value = ''
                  }}
                  disabled={uploading}
                />
                <span>{uploading ? 'Subiendo…' : 'Subir archivo'}</span>
              </label>
            </div>
          </FieldShell>
        )
      }}
    />
  )
}

export function FieldGallery<TForm extends FieldValues>(
  props: BaseFieldProps<TForm> & { control: Control<TForm> },
) {
  const generateUploadUrl = useMutation(api.content.generateUploadUrl)
  const resolveUploadedUrl = useMutation(api.content.resolveUploadedUrl)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        const value = (field.value as Array<string> | undefined) ?? []
        const update = (next: Array<string>) =>
          field.onChange(next as PathValue<TForm, Path<TForm>>)

        const onFiles = async (files: FileList) => {
          const token = getAdminToken()
          if (!token) return
          setUploading(true)
          setUploadError(null)
          try {
            const uploaded: Array<string> = []
            for (const file of Array.from(files)) {
              const uploadUrl = await generateUploadUrl({ sessionToken: token })
              const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
              })
              if (!res.ok) throw new Error('Falló la subida')
              const { storageId } = (await res.json()) as { storageId: string }
              const { url } = await resolveUploadedUrl({ sessionToken: token, storageId })
              uploaded.push(url)
            }
            update([...value, ...uploaded])
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Error de subida')
          } finally {
            setUploading(false)
          }
        }

        return (
          <FieldShell
            label={props.label}
            description={props.description}
            required={props.required}
            error={fieldState.error?.message ?? uploadError ?? undefined}
          >
            <div className="admin-gallery">
              {value.map((url, idx) => (
                <div key={idx} className="admin-gallery-tile">
                  <img src={url} alt="" />
                  <button
                    type="button"
                    className="admin-gallery-remove"
                    onClick={() => update(value.filter((_, i) => i !== idx))}
                    aria-label="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="admin-gallery-add">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) onFiles(e.target.files)
                    e.target.value = ''
                  }}
                  disabled={uploading}
                />
                <span>{uploading ? '…' : '+'}</span>
              </label>
            </div>
          </FieldShell>
        )
      }}
    />
  )
}
