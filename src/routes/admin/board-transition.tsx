import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import { api } from '../../../convex/_generated/api'
import { getAdminToken } from '@/lib/adminAuth'
import {
  FieldBilingualTextarea,
  FieldGallery,
  FieldImageUpload,
  FormSection,
} from '@/components/admin/fields'
import { inferCurrentPeriod, nextPeriod } from '@/lib/periodInference'

export const Route = createFileRoute('/admin/board-transition')({
  component: BoardTransitionPage,
})

type Step = 1 | 2 | 3 | 4

type IncomingMember = {
  roleEs: string
  roleEn: string
  name: string
  career: string
  email: string
  linkedinUrl: string
  githubUrl: string
  imageUrl: string
  skip: boolean
}

type WizardState = {
  outgoingPeriod: string
  incomingPeriod: string
  presidentName: string
  description: { es: string; en: string }
  imageUrl: string
  galleryImageUrls: Array<string>
  incomingMembers: Array<IncomingMember>
}

function emptyIncoming(roleEs: string, roleEn: string): IncomingMember {
  return {
    roleEs,
    roleEn,
    name: '',
    career: '',
    email: '',
    linkedinUrl: '',
    githubUrl: '',
    imageUrl: '',
    skip: false,
  }
}

function findPresidentName(
  outgoing: ReadonlyArray<{ name: string; role: { es: string } }>,
): string {
  const president = outgoing.find((m) =>
    /^(presidenta|presidente)$/i.test(m.role.es.trim()),
  )
  if (president) return president.name
  return outgoing.length > 0 ? outgoing[0].name : ''
}

function BoardTransitionPage() {
  const navigate = useNavigate()
  const team = useQuery(api.team.get)
  const transitionBoard = useMutation(api.team.transitionBoard)

  const outgoing = useMemo(
    () =>
      (team ?? [])
        .filter((m) => m.group === 'directives')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [team],
  )

  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<WizardState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Initialise wizard state once team data is available.
  useEffect(() => {
    if (team === undefined || state !== null) return
    const detected = inferCurrentPeriod(team) ?? ''
    setState({
      outgoingPeriod: detected,
      incomingPeriod: detected ? (nextPeriod(detected) ?? '') : '',
      presidentName: findPresidentName(outgoing),
      description: { es: '', en: '' },
      imageUrl: '',
      galleryImageUrls: [],
      incomingMembers: outgoing.map((m) => emptyIncoming(m.role.es, m.role.en)),
    })
  }, [team, state, outgoing])

  if (team === undefined || state === null) {
    return <p className="admin-empty">Cargando…</p>
  }

  if (outgoing.length === 0) {
    return (
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Transición de mesa</h1>
          <p className="admin-page-sub">
            No hay directivos actuales para archivar. Crea la mesa entrante
            directamente desde Equipo.
          </p>
        </div>
      </div>
    )
  }

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => (prev ? { ...prev, ...patch } : prev))

  const onCommit = async () => {
    const token = getAdminToken()
    if (!token) return
    setSubmitting(true)
    try {
      const incoming = state.incomingMembers.map((m) => ({
        name: m.skip ? m.name || '(pendiente)' : m.name,
        role: { es: m.roleEs, en: m.roleEn },
        career: m.career.trim() || undefined,
        email: m.email.trim() || undefined,
        linkedinUrl: m.linkedinUrl.trim() || undefined,
        githubUrl: m.githubUrl.trim() || undefined,
        imageUrl: m.imageUrl.trim() || undefined,
      }))
      const { pastAdminId } = await transitionBoard({
        sessionToken: token,
        outgoingPeriod: state.outgoingPeriod,
        incomingPeriod: state.incomingPeriod,
        pastAdmin: {
          presidentName: state.presidentName,
          description:
            state.description.es || state.description.en
              ? state.description
              : undefined,
          imageUrl: state.imageUrl.trim() || undefined,
          galleryImageUrls: state.galleryImageUrls.length
            ? state.galleryImageUrls
            : undefined,
        },
        incomingMembers: incoming,
      })
      toast.success('Transición completada')
      navigate({
        to: '/admin/admins',
        search: { editId: pastAdminId } as never,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en la transición')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-wizard">
      <aside className="admin-wizard-rail" aria-label="Pasos">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`admin-wizard-step ${step === n ? 'is-active' : ''} ${step > n ? 'is-done' : ''}`}
          >
            <span className="admin-wizard-step-number">{n}</span>
            <span className="admin-wizard-step-label">
              {n === 1
                ? 'Confirmar'
                : n === 2
                  ? 'Mesa saliente'
                  : n === 3
                    ? 'Mesa entrante'
                    : 'Revisar'}
            </span>
          </div>
        ))}
      </aside>

      <main className="admin-wizard-main">
        <h1 className="admin-page-title">Transición de mesa</h1>

        {step === 1 ? (
          <Step1Confirm
            state={state}
            outgoing={outgoing}
            update={update}
            onCancel={() => navigate({ to: '/admin' })}
            onContinue={() => setStep(2)}
          />
        ) : step === 2 ? (
          <Step2Metadata
            state={state}
            update={update}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        ) : step === 3 ? (
          <Step3Roster
            state={state}
            update={update}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        ) : (
          <Step4Review
            state={state}
            outgoing={outgoing}
            submitting={submitting}
            onBack={() => setStep(3)}
            onCommit={onCommit}
          />
        )}
      </main>
    </div>
  )
}

function Step1Confirm({
  state,
  outgoing,
  update,
  onCancel,
  onContinue,
}: {
  state: WizardState
  outgoing: Array<{
    _id: string
    name: string
    role: { es: string; en: string }
    imageUrl?: string
  }>
  update: (patch: Partial<WizardState>) => void
  onCancel: () => void
  onContinue: () => void
}) {
  const canContinue = state.outgoingPeriod && state.incomingPeriod
  return (
    <div className="admin-wizard-step-body">
      <p>
        Estás a punto de archivar la Mesa Directiva{' '}
        <strong>{state.outgoingPeriod || '—'}</strong>. Los {outgoing.length}{' '}
        directivos actuales se moverán a "Mesas pasadas" con su perfil completo.
      </p>

      <div className="admin-wizard-grid">
        {outgoing.map((m) => (
          <div key={m._id} className="admin-card admin-card-readonly">
            {m.imageUrl ? (
              <img src={m.imageUrl} alt="" className="admin-card-thumb" />
            ) : (
              <div className="admin-card-thumb-fallback">
                {m.name.charAt(0)}
              </div>
            )}
            <div className="admin-card-body">
              <p className="admin-card-title">{m.name}</p>
              <p className="admin-card-meta">
                {m.role.es} · {m.role.en}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-wizard-row">
        <label className="admin-field">
          <span className="admin-field-label">Periodo saliente</span>
          <input
            className="admin-input"
            value={state.outgoingPeriod}
            onChange={(e) => update({ outgoingPeriod: e.target.value })}
            placeholder="2025-2026"
          />
        </label>
        <label className="admin-field">
          <span className="admin-field-label">Periodo entrante</span>
          <input
            className="admin-input"
            value={state.incomingPeriod}
            onChange={(e) => update({ incomingPeriod: e.target.value })}
            placeholder="2026-2027"
          />
        </label>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="admin-btn"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

function Step2Metadata({
  state,
  update,
  onBack,
  onContinue,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onBack: () => void
  onContinue: () => void
}) {
  const form = useForm({
    defaultValues: {
      presidentName: state.presidentName,
      description: state.description,
      imageUrl: state.imageUrl,
      galleryImageUrls: state.galleryImageUrls,
    },
  })

  const submit = form.handleSubmit((values) => {
    update({
      presidentName: values.presidentName,
      description: values.description,
      imageUrl: values.imageUrl,
      galleryImageUrls: values.galleryImageUrls,
    })
    onContinue()
  })

  return (
    <FormProvider {...form}>
      <form className="admin-wizard-step-body" onSubmit={submit}>
        <p className="admin-field-desc">
          Datos para la nueva entrada de "Mesas pasadas". Todo es opcional —
          puedes completarlo después.
        </p>

        <FormSection title="Datos básicos">
          <label className="admin-field">
            <span className="admin-field-label">Nombre del presidente</span>
            <input
              className="admin-input"
              {...form.register('presidentName')}
            />
          </label>
          <FieldBilingualTextarea
            name="description"
            label="Descripción"
            rows={4}
          />
        </FormSection>

        <FormSection title="Foto y galería">
          <FieldImageUpload
            name="imageUrl"
            label="Foto grupal"
            control={form.control}
          />
          <FieldGallery
            name="galleryImageUrls"
            label="Galería"
            control={form.control}
          />
        </FormSection>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onBack}
          >
            ← Atrás
          </button>
          <button type="submit" className="admin-btn">
            Continuar →
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

function Step3Roster({
  state,
  update,
  onBack,
  onContinue,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onBack: () => void
  onContinue: () => void
}) {
  const form = useForm<{ members: Array<IncomingMember> }>({
    defaultValues: { members: state.incomingMembers },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members',
  })

  const submit = form.handleSubmit((values) => {
    update({ incomingMembers: values.members })
    onContinue()
  })

  const allValid = form
    .watch('members')
    .every(
      (m) => m.skip || (m.name.trim() && m.roleEs.trim() && m.roleEn.trim()),
    )

  return (
    <form className="admin-wizard-step-body" onSubmit={submit}>
      <p className="admin-field-desc">
        Una fila por puesto. Roles se autorrellenan desde la mesa saliente —
        edítalos si la estructura cambió.
      </p>

      {fields.map((f, idx) => (
        <div key={f.id} className="admin-wizard-roster-row">
          <div className="admin-wizard-roster-grid">
            <label className="admin-field">
              <span className="admin-field-label">Rol ES</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.roleEs`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Rol EN</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.roleEn`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Nombre</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.name`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Carrera</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.career`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Email</span>
              <input
                className="admin-input"
                type="email"
                {...form.register(`members.${idx}.email`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">LinkedIn</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.linkedinUrl`)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">GitHub</span>
              <input
                className="admin-input"
                {...form.register(`members.${idx}.githubUrl`)}
              />
            </label>
            <Controller
              control={form.control}
              name={`members.${idx}.imageUrl`}
              render={({ field }) => (
                <label className="admin-field">
                  <span className="admin-field-label">Foto URL</span>
                  <input
                    className="admin-input"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </label>
              )}
            />
          </div>
          <div className="admin-wizard-roster-actions">
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                {...form.register(`members.${idx}.skip`)}
              />
              <span>Llenar después</span>
            </label>
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => remove(idx)}
              aria-label="Quitar puesto"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        onClick={() => append(emptyIncoming('', ''))}
      >
        + Agregar puesto
      </button>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          ← Atrás
        </button>
        <button type="submit" className="admin-btn" disabled={!allValid}>
          Revisar →
        </button>
      </div>
    </form>
  )
}

function Step4Review({
  state,
  outgoing,
  submitting,
  onBack,
  onCommit,
}: {
  state: WizardState
  outgoing: Array<{
    _id: string
    name: string
    role: { es: string; en: string }
    imageUrl?: string
  }>
  submitting: boolean
  onBack: () => void
  onCommit: () => void
}) {
  return (
    <div className="admin-wizard-step-body">
      <div className="admin-wizard-review-cols">
        <section>
          <h3 className="admin-list-section-title">
            Archivando · {state.outgoingPeriod}
          </h3>
          {outgoing.map((m) => (
            <div key={m._id} className="admin-card admin-card-readonly">
              {m.imageUrl ? (
                <img src={m.imageUrl} alt="" className="admin-card-thumb" />
              ) : (
                <div className="admin-card-thumb-fallback">
                  {m.name.charAt(0)}
                </div>
              )}
              <div className="admin-card-body">
                <p className="admin-card-title">{m.name}</p>
                <p className="admin-card-meta">
                  {m.role.es} · {m.role.en}
                </p>
              </div>
            </div>
          ))}
        </section>
        <section>
          <h3 className="admin-list-section-title">
            Creando · {state.incomingPeriod}
          </h3>
          {state.incomingMembers.map((m, idx) => (
            <div key={idx} className="admin-card admin-card-readonly">
              {m.imageUrl ? (
                <img src={m.imageUrl} alt="" className="admin-card-thumb" />
              ) : (
                <div className="admin-card-thumb-fallback">
                  {(m.name || '?').charAt(0)}
                </div>
              )}
              <div className="admin-card-body">
                <p className="admin-card-title">
                  {m.name || <em>(pendiente)</em>}
                  {m.skip ? (
                    <span className="admin-pending-badge"> · pendiente</span>
                  ) : null}
                </p>
                <p className="admin-card-meta">
                  {m.roleEs} · {m.roleEn}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="admin-wizard-warning">
        Esto creará la mesa pasada <strong>{state.outgoingPeriod}</strong> y
        reemplazará los <strong>{outgoing.length}</strong> directivos actuales
        con la nueva mesa <strong>{state.incomingPeriod}</strong>. Esta acción
        no se puede deshacer fácilmente.
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
          disabled={submitting}
        >
          ← Atrás
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={onCommit}
          disabled={submitting}
        >
          {submitting ? 'Procesando…' : '✓ Confirmar transición'}
        </button>
      </div>
    </div>
  )
}
