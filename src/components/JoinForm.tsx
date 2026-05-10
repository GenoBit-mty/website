import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import { ConvexError } from 'convex/values'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLang } from '@/i18n/LanguageProvider'
import {
  CAREERS,
  GROUPS,
  SEMESTERS,
  STUDENT_COMMUNITY_SUB_AREAS,
  subAreaRequired,
} from '@/lib/applications'
import type {
  ApplicationGroup,
  Career,
  Semester,
  StudentCommunitySubArea,
} from '@/lib/applications'
import type { StringKey } from '@/i18n/strings'

const formSchema = z
  .object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    career: z.enum(CAREERS),
    careerOther: z.string().optional(),
    semester: z.enum(SEMESTERS),
    group: z.enum(GROUPS),
    subArea: z.enum(STUDENT_COMMUNITY_SUB_AREAS).optional(),
    motivation: z.string().min(1).max(500),
    linkedinUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    acceptsContact: z.literal(true),
    website: z.string().optional(), // honeypot
  })
  .refine(
    (data) => (data.career === 'Other' ? !!data.careerOther?.trim() : true),
    { path: ['careerOther'], message: 'required' },
  )
  .refine(
    (data) => (subAreaRequired(data.group) ? !!data.subArea : true),
    { path: ['subArea'], message: 'required' },
  )

type FormValues = z.infer<typeof formSchema>

export function JoinForm() {
  const { t, lang } = useLang()
  const submit = useMutation(api.applications.submit)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      career: 'IBT' as Career,
      careerOther: '',
      semester: '1' as Semester,
      group: 'ndrg' as ApplicationGroup,
      subArea: undefined,
      motivation: '',
      linkedinUrl: '',
      githubUrl: '',
      acceptsContact: false as unknown as true,
      website: '',
    },
  })

  const groupValue = methods.watch('group')
  const careerValue = methods.watch('career')

  const onSubmit = methods.handleSubmit(async (values) => {
    setServerError(null)
    try {
      await submit({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        career: values.career,
        careerOther:
          values.career === 'Other' ? values.careerOther || undefined : undefined,
        semester: values.semester,
        university: 'Tec de Monterrey',
        group: values.group,
        subArea: subAreaRequired(values.group)
          ? (values.subArea as StudentCommunitySubArea)
          : undefined,
        motivation: values.motivation,
        linkedinUrl: values.linkedinUrl || undefined,
        githubUrl: values.githubUrl || undefined,
        acceptsContact: values.acceptsContact,
        locale: lang,
        website: values.website,
      })
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string } | undefined
        if (data?.code === 'DUPLICATE_RECENT') {
          setServerError(t('join.error.duplicate'))
          return
        }
        if (data?.code === 'CLOSED') {
          setServerError(t('join.error.closed'))
          return
        }
      }
      setServerError(t('join.error.generic'))
    }
  })

  if (submitted) {
    return (
      <section className="join-success">
        <h2 className="section-display">{t('join.success.title')}</h2>
        <p className="section-copy">{t('join.success.body')}</p>
        <button
          type="button"
          className="editorial-btn"
          onClick={() => {
            methods.reset()
            setSubmitted(false)
          }}
        >
          {t('join.success.again')}
        </button>
      </section>
    )
  }

  const showSubArea = subAreaRequired(groupValue)
  const showCareerOther = careerValue === 'Other'

  return (
    <FormProvider {...methods}>
      <form className="join-form" onSubmit={onSubmit} noValidate>
        {/* Honeypot — visually hidden, autocomplete off */}
        <div className="join-honeypot" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...methods.register('website')}
            />
          </label>
        </div>

        <fieldset className="join-fieldset">
          <legend className="join-legend">{t('join.section.about')}</legend>

          <div className="join-field">
            <label className="join-label" htmlFor="fullName">
              {t('join.field.fullName')} *
            </label>
            <input
              id="fullName"
              className="join-input"
              placeholder={t('join.placeholder.fullName')}
              {...methods.register('fullName')}
            />
            {methods.formState.errors.fullName && (
              <p className="join-error">{t('join.validation.required')}</p>
            )}
          </div>

          <div className="join-field">
            <label className="join-label" htmlFor="email">
              {t('join.field.email')} *
            </label>
            <input
              id="email"
              type="email"
              className="join-input"
              placeholder={t('join.placeholder.email')}
              {...methods.register('email')}
            />
            {methods.formState.errors.email && (
              <p className="join-error">{t('join.validation.email')}</p>
            )}
          </div>

          <div className="join-field">
            <label className="join-label" htmlFor="phone">
              {t('join.field.phone')} *
            </label>
            <input
              id="phone"
              className="join-input"
              placeholder={t('join.placeholder.phone')}
              {...methods.register('phone')}
            />
            {methods.formState.errors.phone && (
              <p className="join-error">{t('join.validation.required')}</p>
            )}
          </div>

          <div className="join-field">
            <label className="join-label" htmlFor="career">
              {t('join.field.career')} *
            </label>
            <select
              id="career"
              className="join-input"
              {...methods.register('career')}
            >
              {CAREERS.map((c) => (
                <option key={c} value={c}>
                  {c === 'Other' ? t('join.career.other') : c}
                </option>
              ))}
            </select>
          </div>

          {showCareerOther && (
            <div className="join-field">
              <label className="join-label" htmlFor="careerOther">
                {t('join.field.careerOther')} *
              </label>
              <input
                id="careerOther"
                className="join-input"
                {...methods.register('careerOther')}
              />
              {methods.formState.errors.careerOther && (
                <p className="join-error">{t('join.validation.required')}</p>
              )}
            </div>
          )}

          <div className="join-field">
            <label className="join-label" htmlFor="semester">
              {t('join.field.semester')} *
            </label>
            <select
              id="semester"
              className="join-input"
              {...methods.register('semester')}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'graduate' ? t('join.semester.graduate') : s}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="join-fieldset">
          <legend className="join-legend">{t('join.section.interest')}</legend>

          <div className="join-field">
            <label className="join-label" htmlFor="group">
              {t('join.field.group')} *
            </label>
            <select
              id="group"
              className="join-input"
              {...methods.register('group')}
            >
              <option value="ndrg">{t('team.group.ndrg')}</option>
              <option value="proteomics">{t('team.group.proteomics')}</option>
              <option value="student-community">
                {t('team.group.studentCommunity')}
              </option>
            </select>
          </div>

          {showSubArea && (
            <div className="join-field">
              <label className="join-label" htmlFor="subArea">
                {t('join.field.subArea')} *
              </label>
              <select
                id="subArea"
                className="join-input"
                {...methods.register('subArea')}
                defaultValue=""
              >
                <option value="" disabled>
                  —
                </option>
                {STUDENT_COMMUNITY_SUB_AREAS.map((s) => (
                  <option key={s} value={s}>
                    {t(`join.subArea.${s}` as StringKey)}
                  </option>
                ))}
              </select>
              {methods.formState.errors.subArea && (
                <p className="join-error">{t('join.validation.required')}</p>
              )}
            </div>
          )}

          <div className="join-field">
            <label className="join-label" htmlFor="motivation">
              {t('join.field.motivation')} *
            </label>
            <textarea
              id="motivation"
              rows={5}
              className="join-input join-textarea"
              placeholder={t('join.placeholder.motivation')}
              maxLength={500}
              {...methods.register('motivation')}
            />
            {methods.formState.errors.motivation && (
              <p className="join-error">{t('join.validation.motivationMax')}</p>
            )}
          </div>
        </fieldset>

        <fieldset className="join-fieldset">
          <legend className="join-legend">{t('join.section.background')}</legend>

          <div className="join-field">
            <label className="join-label" htmlFor="linkedinUrl">
              {t('join.field.linkedinUrl')}
            </label>
            <input
              id="linkedinUrl"
              className="join-input"
              {...methods.register('linkedinUrl')}
            />
          </div>

          <div className="join-field">
            <label className="join-label" htmlFor="githubUrl">
              {t('join.field.githubUrl')}
            </label>
            <input
              id="githubUrl"
              className="join-input"
              {...methods.register('githubUrl')}
            />
          </div>
        </fieldset>

        <div className="join-consent">
          <label className="join-checkbox">
            <input type="checkbox" {...methods.register('acceptsContact')} />
            <span>{t('join.field.consent')}</span>
          </label>
          {methods.formState.errors.acceptsContact && (
            <p className="join-error">{t('join.validation.required')}</p>
          )}
          <p className="join-privacy-note">
            {t('join.field.privacy')}{' '}
            <Link to="/privacy" className="join-privacy-link">
              {t('join.field.privacy.link')}
            </Link>
            .
          </p>
        </div>

        {serverError && <p className="join-server-error">{serverError}</p>}

        <button
          type="submit"
          className="editorial-btn filled"
          disabled={methods.formState.isSubmitting}
        >
          {methods.formState.isSubmitting ? t('join.submitting') : t('join.submit')}
        </button>
      </form>
    </FormProvider>
  )
}
