# Join Applications Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the footer mailto CTA with a real applicant pipeline. Public `/join` form captures name, email, phone, career, semester, area (group + optional sub-area), motivation, and optional links. Admin gets a list + detail view to track each submission through a 6-state status pipeline, with CSV export, traceability via status history, and an org-wide open/closed toggle.

**Architecture:**
- Convex stores submissions in a new `applications` table and a one-row `siteSettings` table for the `applicationsOpen` boolean. Public `submit` mutation enforces a 24h-per-email rate limit and silently drops honeypot-positive submissions; admin mutations require a session token via the existing `requireAdmin` helper. The frontend stays in TanStack Router file routes: a public `/join`, a public `/privacy` stub, and two admin pages (`/admin/applications` list, `/admin/applications/$id` detail) nested under the existing admin layout. Form state uses `react-hook-form` + `zod` (already in the codebase). i18n is bilingual via the existing `src/i18n/strings.ts` dictionary.
- All non-trivial business rules (which careers/semesters/groups/sub-areas/statuses are valid; which group requires a sub-area; which statuses are terminal vs. active; CSV-row serialization) live in pure helpers under `src/lib/applications.ts` so they can be unit-tested with vitest. Convex code and React components stay untested at the unit level, matching the existing project convention (only `src/lib/*.test.ts` and `convex/lib/*.test.ts` exist).

**Tech Stack:** Convex (DB + mutations), React 19, TanStack Router (file-based routing), react-hook-form, zod, framer-motion, sonner (toasts), vitest, Tailwind v4 + project CSS in `src/styles.css`.

**Spec:** Captured in the conversation that produced this plan (no separate spec file). Key decisions:
- Areas: top-level group (NDRG / Proteomics / Student Community); only Student Community requires a sub-area (Research / Finance / Logistics / Marketing / Social Responsibility / Education / IT-Web).
- Status pipeline: `new → under_review → contacted → interview_scheduled → accepted | rejected`; terminal states are `accepted` and `rejected`.
- Anti-spam: invisible honeypot field + 24h rate-limit per email (server-side); duplicates within window show a friendly error, not silent acceptance.
- Privacy: route `/privacy` is stubbed with bilingual placeholder copy; real *aviso de privacidad* drafted later by board.
- No email notifications in v1.
- Admin list defaults to hiding terminal states; toggle reveals them. CSV export of the currently filtered view.

**Pre-flight:**

- After any change to `convex/schema.ts` or files in `convex/*.ts`, run `npx convex codegen --typecheck=disable` once to regenerate `convex/_generated/*`. Frontend imports break otherwise. (Alternative: keep `npx convex dev` running in a side terminal for auto-regeneration.)
- Baseline: `bun run test` should pass (currently 4 test files). Confirm before starting Task 1.
- Dev server: `bun run dev` serves on port 3000. Convex backend needs `npx convex dev` running separately.

---

## Task 1: Domain constants & helpers (TDD)

Pure module that owns every enum and validation rule for the applications feature. Anything that switches on a field value (career, group, sub-area, status) imports from here. Tested with vitest before any Convex or React code goes in.

**Files:**

- Create: `src/lib/applications.ts`
- Create: `src/lib/applications.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `src/lib/applications.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STATUSES,
  CAREERS,
  GROUPS,
  SEMESTERS,
  STUDENT_COMMUNITY_SUB_AREAS,
  applicationToCsvRow,
  isTerminalStatus,
  subAreaRequired,
} from './applications'

describe('subAreaRequired', () => {
  it('returns true only for student-community', () => {
    expect(subAreaRequired('student-community')).toBe(true)
    expect(subAreaRequired('ndrg')).toBe(false)
    expect(subAreaRequired('proteomics')).toBe(false)
  })
})

describe('isTerminalStatus', () => {
  it('returns true for accepted and rejected', () => {
    expect(isTerminalStatus('accepted')).toBe(true)
    expect(isTerminalStatus('rejected')).toBe(true)
  })

  it('returns false for active pipeline states', () => {
    expect(isTerminalStatus('new')).toBe(false)
    expect(isTerminalStatus('under_review')).toBe(false)
    expect(isTerminalStatus('contacted')).toBe(false)
    expect(isTerminalStatus('interview_scheduled')).toBe(false)
  })
})

describe('constants', () => {
  it('exposes the six application statuses in order', () => {
    expect(APPLICATION_STATUSES).toEqual([
      'new',
      'under_review',
      'contacted',
      'interview_scheduled',
      'accepted',
      'rejected',
    ])
  })

  it('exposes the three top-level groups', () => {
    expect(GROUPS).toEqual(['ndrg', 'proteomics', 'student-community'])
  })

  it('exposes the seven student-community sub-areas', () => {
    expect(STUDENT_COMMUNITY_SUB_AREAS).toEqual([
      'research',
      'finance',
      'logistics',
      'marketing',
      'social-responsibility',
      'education',
      'it-web',
    ])
  })

  it('exposes career codes including Other', () => {
    expect(CAREERS).toContain('IBT')
    expect(CAREERS).toContain('ITC')
    expect(CAREERS).toContain('IDM')
    expect(CAREERS).toContain('Other')
  })

  it('exposes ten numbered semesters plus a graduate marker', () => {
    expect(SEMESTERS).toHaveLength(11)
    expect(SEMESTERS[0]).toBe('1')
    expect(SEMESTERS[9]).toBe('10')
    expect(SEMESTERS[10]).toBe('graduate')
  })
})

describe('applicationToCsvRow', () => {
  it('serializes an application to the documented column order', () => {
    const row = applicationToCsvRow({
      _id: 'abc',
      submittedAt: 1736208000000, // 2025-01-07T00:00:00Z
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+52 81 1234 5678',
      career: 'ITC',
      careerOther: undefined,
      semester: '5',
      university: 'Tec de Monterrey',
      group: 'student-community',
      subArea: 'it-web',
      motivation: 'I want to build things.',
      linkedinUrl: 'https://linkedin.com/in/ada',
      githubUrl: undefined,
      acceptsContact: true,
      locale: 'en',
      status: 'new',
      assigneeName: undefined,
      adminNotes: undefined,
    })
    expect(row).toEqual([
      'abc',
      '2025-01-07T00:00:00.000Z',
      'Ada Lovelace',
      'ada@example.com',
      '+52 81 1234 5678',
      'ITC',
      '',
      '5',
      'Tec de Monterrey',
      'student-community',
      'it-web',
      'I want to build things.',
      'https://linkedin.com/in/ada',
      '',
      'true',
      'en',
      'new',
      '',
      '',
    ])
  })

  it('falls back to careerOther column when career is Other', () => {
    const row = applicationToCsvRow({
      _id: 'x',
      submittedAt: 0,
      fullName: 'X',
      email: 'x@x.com',
      phone: '0',
      career: 'Other',
      careerOther: 'Architecture',
      semester: '1',
      university: 'Tec de Monterrey',
      group: 'ndrg',
      subArea: undefined,
      motivation: 'm',
      linkedinUrl: undefined,
      githubUrl: undefined,
      acceptsContact: true,
      locale: 'es',
      status: 'new',
      assigneeName: undefined,
      adminNotes: undefined,
    })
    expect(row[5]).toBe('Other')
    expect(row[6]).toBe('Architecture')
    expect(row[10]).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/applications.test.ts`
Expected: FAIL with "Failed to resolve import './applications'".

- [ ] **Step 3: Implement the module**

Create `src/lib/applications.ts`:

```ts
export const APPLICATION_STATUSES = [
  'new',
  'under_review',
  'contacted',
  'interview_scheduled',
  'accepted',
  'rejected',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const TERMINAL_STATUSES: ReadonlyArray<ApplicationStatus> = [
  'accepted',
  'rejected',
]

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export const GROUPS = ['ndrg', 'proteomics', 'student-community'] as const
export type ApplicationGroup = (typeof GROUPS)[number]

export const STUDENT_COMMUNITY_SUB_AREAS = [
  'research',
  'finance',
  'logistics',
  'marketing',
  'social-responsibility',
  'education',
  'it-web',
] as const
export type StudentCommunitySubArea =
  (typeof STUDENT_COMMUNITY_SUB_AREAS)[number]

export function subAreaRequired(group: ApplicationGroup): boolean {
  return group === 'student-community'
}

export const CAREERS = [
  'IBT',
  'ITC',
  'IDM',
  'MC',
  'MSc BI',
  'Other',
] as const
export type Career = (typeof CAREERS)[number]

export const SEMESTERS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'graduate',
] as const
export type Semester = (typeof SEMESTERS)[number]

export type Application = {
  _id: string
  submittedAt: number
  fullName: string
  email: string
  phone: string
  career: Career
  careerOther?: string
  semester: Semester
  university: string
  group: ApplicationGroup
  subArea?: StudentCommunitySubArea
  motivation: string
  linkedinUrl?: string
  githubUrl?: string
  acceptsContact: boolean
  locale: 'es' | 'en'
  status: ApplicationStatus
  assigneeName?: string
  adminNotes?: string
}

export const CSV_COLUMNS = [
  'id',
  'submittedAt',
  'fullName',
  'email',
  'phone',
  'career',
  'careerOther',
  'semester',
  'university',
  'group',
  'subArea',
  'motivation',
  'linkedinUrl',
  'githubUrl',
  'acceptsContact',
  'locale',
  'status',
  'assigneeName',
  'adminNotes',
] as const

export function applicationToCsvRow(app: Application): Array<string> {
  return [
    app._id,
    new Date(app.submittedAt).toISOString(),
    app.fullName,
    app.email,
    app.phone,
    app.career,
    app.careerOther ?? '',
    app.semester,
    app.university,
    app.group,
    app.subArea ?? '',
    app.motivation,
    app.linkedinUrl ?? '',
    app.githubUrl ?? '',
    String(app.acceptsContact),
    app.locale,
    app.status,
    app.assigneeName ?? '',
    app.adminNotes ?? '',
  ]
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test src/lib/applications.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Run the full test suite to verify nothing regressed**

Run: `bun run test`
Expected: PASS (all existing tests still green, new tests added).

- [ ] **Step 6: Commit**

```bash
git add src/lib/applications.ts src/lib/applications.test.ts
git commit -m "feat(applications): add domain constants and pure helpers"
```

---

## Task 2: Convex schema additions

Adds the `applications` and `siteSettings` tables. Additive schema changes don't need a migration.

**Files:**

- Modify: `convex/schema.ts`

- [ ] **Step 1: Append the two new tables**

Open `convex/schema.ts`. Inside the `defineSchema({ ... })` object, after the existing `homeImages` block (currently the last table, ending at line 93), add a comma and append:

```ts
  applications: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    career: v.string(),
    careerOther: v.optional(v.string()),
    semester: v.string(),
    university: v.string(),
    group: v.union(
      v.literal('ndrg'),
      v.literal('proteomics'),
      v.literal('student-community'),
    ),
    subArea: v.optional(v.string()),
    motivation: v.string(),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    acceptsContact: v.boolean(),
    locale: v.union(v.literal('es'), v.literal('en')),
    submittedAt: v.number(),
    status: v.union(
      v.literal('new'),
      v.literal('under_review'),
      v.literal('contacted'),
      v.literal('interview_scheduled'),
      v.literal('accepted'),
      v.literal('rejected'),
    ),
    assigneeName: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    statusHistory: v.array(
      v.object({
        status: v.string(),
        changedAt: v.number(),
      }),
    ),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_submittedAt', ['submittedAt']),

  siteSettings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index('by_key', ['key']),
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen --typecheck=disable`
Expected: completes silently; `convex/_generated/dataModel.d.ts` now references `applications` and `siteSettings`.

- [ ] **Step 3: Verify typecheck still passes**

Run: `bunx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(applications): add applications and siteSettings tables"
```

---

## Task 3: Public `submit` mutation with rate-limit + honeypot

The single endpoint that accepts a `/join` submission. Public (no auth). Validates input, drops honeypot positives silently with a normal-looking success, and rejects duplicate emails within 24h with a typed error.

**Files:**

- Create: `convex/applications.ts`

- [ ] **Step 1: Create the file with the submit mutation**

Create `convex/applications.ts`:

```ts
import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin } from './admin'

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

const groupValidator = v.union(
  v.literal('ndrg'),
  v.literal('proteomics'),
  v.literal('student-community'),
)

const statusValidator = v.union(
  v.literal('new'),
  v.literal('under_review'),
  v.literal('contacted'),
  v.literal('interview_scheduled'),
  v.literal('accepted'),
  v.literal('rejected'),
)

const localeValidator = v.union(v.literal('es'), v.literal('en'))

export const submit = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    career: v.string(),
    careerOther: v.optional(v.string()),
    semester: v.string(),
    university: v.string(),
    group: groupValidator,
    subArea: v.optional(v.string()),
    motivation: v.string(),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    acceptsContact: v.boolean(),
    locale: localeValidator,
    // honeypot — bots fill this, humans don't see it
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Honeypot: silently return success so bots don't probe for behavior.
    if (args.website && args.website.length > 0) {
      return { ok: true as const }
    }

    // Applications-closed gate
    const openSetting = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'applicationsOpen'))
      .unique()
    if (openSetting && openSetting.value !== 'true') {
      throw new ConvexError({ code: 'CLOSED' })
    }

    // Rate-limit: one submission per email per 24h.
    const normalizedEmail = args.email.trim().toLowerCase()
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
    const recent = await ctx.db
      .query('applications')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .collect()
    if (recent.some((r) => r.submittedAt >= cutoff)) {
      throw new ConvexError({ code: 'DUPLICATE_RECENT' })
    }

    // Server-side guard: sub-area required for student-community.
    if (args.group === 'student-community' && !args.subArea) {
      throw new ConvexError({ code: 'SUBAREA_REQUIRED' })
    }

    const now = Date.now()
    await ctx.db.insert('applications', {
      fullName: args.fullName.trim(),
      email: normalizedEmail,
      phone: args.phone.trim(),
      career: args.career,
      careerOther: args.careerOther?.trim() || undefined,
      semester: args.semester,
      university: args.university,
      group: args.group,
      subArea: args.subArea,
      motivation: args.motivation.trim(),
      linkedinUrl: args.linkedinUrl?.trim() || undefined,
      githubUrl: args.githubUrl?.trim() || undefined,
      acceptsContact: args.acceptsContact,
      locale: args.locale,
      submittedAt: now,
      status: 'new',
      statusHistory: [{ status: 'new', changedAt: now }],
    })
    return { ok: true as const }
  },
})

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Use a query (not mutation) — call requireAdmin via shared logic.
    // requireAdmin requires MutationCtx, so re-implement read-only check here.
    const session = await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .unique()
    if (!session) throw new Error('Unauthorized')
    if (session.expiresAt < Date.now()) throw new Error('Session expired')

    return await ctx.db
      .query('applications')
      .withIndex('by_submittedAt')
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { sessionToken: v.string(), id: v.id('applications') },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .unique()
    if (!session) throw new Error('Unauthorized')
    if (session.expiresAt < Date.now()) throw new Error('Session expired')
    return await ctx.db.get(args.id)
  },
})

export const updateStatus = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const app = await ctx.db.get(args.id)
    if (!app) throw new Error('Application not found')
    if (app.status === args.status) return null
    await ctx.db.patch(args.id, {
      status: args.status,
      statusHistory: [
        ...app.statusHistory,
        { status: args.status, changedAt: Date.now() },
      ],
    })
    return null
  },
})

export const updateAssignee = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    assigneeName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const trimmed = args.assigneeName.trim()
    await ctx.db.patch(args.id, {
      assigneeName: trimmed.length === 0 ? undefined : trimmed,
    })
    return null
  },
})

export const updateNotes = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('applications'),
    adminNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const trimmed = args.adminNotes.trim()
    await ctx.db.patch(args.id, {
      adminNotes: trimmed.length === 0 ? undefined : trimmed,
    })
    return null
  },
})

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id('applications') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    await ctx.db.delete(args.id)
    return null
  },
})
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen --typecheck=disable`
Expected: completes silently.

- [ ] **Step 3: Verify typecheck still passes**

Run: `bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add convex/applications.ts convex/_generated
git commit -m "feat(applications): add public submit + admin CRUD mutations"
```

---

## Task 4: `siteSettings` backend for `applicationsOpen` toggle

A tiny key/value singleton table. The first read seeds with `true`. Admin can flip it.

**Files:**

- Create: `convex/siteSettings.ts`

- [ ] **Step 1: Create the file**

Create `convex/siteSettings.ts`:

```ts
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAdmin } from './admin'

const APPLICATIONS_OPEN_KEY = 'applicationsOpen'

export const getApplicationsOpen = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', APPLICATIONS_OPEN_KEY))
      .unique()
    // Default: open. If no row exists yet, treat as open.
    if (!row) return true
    return row.value === 'true'
  },
})

export const setApplicationsOpen = mutation({
  args: { sessionToken: v.string(), open: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)
    const row = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', APPLICATIONS_OPEN_KEY))
      .unique()
    const value = args.open ? 'true' : 'false'
    if (row) {
      await ctx.db.patch(row._id, { value })
    } else {
      await ctx.db.insert('siteSettings', {
        key: APPLICATIONS_OPEN_KEY,
        value,
      })
    }
    return null
  },
})
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen --typecheck=disable`
Expected: completes silently.

- [ ] **Step 3: Commit**

```bash
git add convex/siteSettings.ts convex/_generated
git commit -m "feat(applications): add applicationsOpen site setting"
```

---

## Task 5: i18n string additions

All bilingual copy for `/join`, `/privacy`, and the admin applications screens. One large diff, then nothing in later tasks needs to touch strings unless we missed something.

**Files:**

- Modify: `src/i18n/strings.ts`

- [ ] **Step 1: Add the new keys**

Open `src/i18n/strings.ts`. Locate the `// Language toggle` comment block (currently ending around line 236 with `'lang.label'`). Insert the following keys **before** the closing `} as const satisfies ...` (i.e. append after the existing keys, before the final `}`). Place the new block immediately after the `'lang.label'` entry:

```ts
  // Join page
  'join.header.eyebrow': { es: 'Aplica · 2025', en: 'Apply · 2025' },
  'join.header.title': { es: 'Únete a GenoBit', en: 'Join GenoBit' },
  'join.header.lead': {
    es: 'Cuéntanos quién eres y dónde quieres sumarte. Una persona del equipo te contactará después de revisar tu aplicación.',
    en: 'Tell us who you are and where you want to plug in. A team member will reach out after reviewing your application.',
  },
  'join.closed.title': {
    es: 'Aplicaciones cerradas por ahora',
    en: 'Applications closed for now',
  },
  'join.closed.body': {
    es: 'No estamos recibiendo nuevas aplicaciones en este momento. Síguenos en Instagram para la próxima convocatoria.',
    en: 'We are not accepting new applications right now. Follow us on Instagram for the next call.',
  },
  'join.closed.cta': { es: 'Instagram', en: 'Instagram' },

  'join.section.about': { es: 'Sobre ti', en: 'About you' },
  'join.section.interest': { es: 'Tu interés', en: 'Your interest' },
  'join.section.background': { es: 'Tu trayectoria', en: 'Your background' },

  'join.field.fullName': { es: 'Nombre completo', en: 'Full name' },
  'join.field.email': { es: 'Correo electrónico', en: 'Email' },
  'join.field.phone': { es: 'Teléfono', en: 'Phone' },
  'join.field.career': { es: 'Carrera', en: 'Career' },
  'join.field.careerOther': {
    es: 'Carrera (especifica)',
    en: 'Career (specify)',
  },
  'join.field.semester': { es: 'Semestre', en: 'Semester' },
  'join.field.group': { es: 'Área', en: 'Area' },
  'join.field.subArea': { es: 'Sub-área', en: 'Sub-area' },
  'join.field.motivation': {
    es: '¿Por qué quieres unirte?',
    en: 'Why do you want to join?',
  },
  'join.field.linkedinUrl': { es: 'LinkedIn (opcional)', en: 'LinkedIn (optional)' },
  'join.field.githubUrl': { es: 'GitHub (opcional)', en: 'GitHub (optional)' },
  'join.field.consent': {
    es: 'Acepto ser contactado por GenoBit sobre mi aplicación.',
    en: 'I agree to be contacted by GenoBit about my application.',
  },
  'join.field.privacy': {
    es: 'Al enviar aceptas nuestro',
    en: 'By submitting you accept our',
  },
  'join.field.privacy.link': { es: 'aviso de privacidad', en: 'privacy notice' },

  'join.placeholder.fullName': { es: 'Tu nombre', en: 'Your name' },
  'join.placeholder.email': { es: 'tu@correo.com', en: 'you@email.com' },
  'join.placeholder.phone': { es: '+52 81 0000 0000', en: '+52 81 0000 0000' },
  'join.placeholder.motivation': {
    es: 'Comparte qué te interesa de GenoBit y qué te gustaría aportar.',
    en: 'Share what interests you about GenoBit and what you would bring.',
  },

  'join.semester.graduate': { es: 'Egresado/a', en: 'Graduate' },
  'join.career.other': { es: 'Otra', en: 'Other' },

  'join.subArea.research': { es: 'Investigación', en: 'Research' },
  'join.subArea.finance': { es: 'Finanzas', en: 'Finance' },
  'join.subArea.logistics': { es: 'Logística', en: 'Logistics' },
  'join.subArea.marketing': { es: 'Marketing', en: 'Marketing' },
  'join.subArea.social-responsibility': {
    es: 'Responsabilidad Social',
    en: 'Social Responsibility',
  },
  'join.subArea.education': { es: 'Educación', en: 'Education' },
  'join.subArea.it-web': { es: 'TI / Web', en: 'IT / Web' },

  'join.submit': { es: 'Enviar aplicación', en: 'Submit application' },
  'join.submitting': { es: 'Enviando…', en: 'Submitting…' },

  'join.success.title': { es: 'Aplicación recibida', en: 'Application received' },
  'join.success.body': {
    es: 'Gracias por aplicar a GenoBit. Una persona del equipo te contactará al correo que registraste.',
    en: 'Thanks for applying to GenoBit. A team member will reach out at the email you provided.',
  },
  'join.success.again': {
    es: 'Enviar otra aplicación',
    en: 'Submit another application',
  },

  'join.error.duplicate': {
    es: 'Ya recibimos una aplicación desde este correo recientemente. Si necesitas actualizar tu información, escríbenos a genobit.mty@gmail.com.',
    en: 'We already received an application from this email recently. If you need to update it, email genobit.mty@gmail.com.',
  },
  'join.error.closed': {
    es: 'Las aplicaciones están cerradas en este momento.',
    en: 'Applications are closed right now.',
  },
  'join.error.generic': {
    es: 'No se pudo enviar la aplicación. Intenta de nuevo.',
    en: 'Could not submit the application. Please try again.',
  },

  'join.validation.required': { es: 'Requerido', en: 'Required' },
  'join.validation.email': { es: 'Correo inválido', en: 'Invalid email' },
  'join.validation.motivationMax': {
    es: 'Máximo 500 caracteres',
    en: 'Max 500 characters',
  },

  // Privacy page
  'privacy.title': { es: 'Aviso de privacidad', en: 'Privacy notice' },
  'privacy.placeholder': {
    es: 'El aviso de privacidad completo se publicará pronto. Mientras tanto: los datos que compartas en la aplicación se usan únicamente para evaluar tu solicitud y contactarte sobre la misma. Para dudas, escríbenos a genobit.mty@gmail.com.',
    en: 'The full privacy notice will be published soon. In the meantime: the data you share in the application is used only to evaluate your request and contact you about it. For questions, email genobit.mty@gmail.com.',
  },
  'privacy.back': { es: '← Volver', en: '← Back' },

  // Home / join CTA section
  'home.join.label': { es: '— 04 / Aplica', en: '— 04 / Apply' },
  'home.join.title': { es: 'Únete', en: 'Join us' },
  'home.join.body': {
    es: 'Estudiantes de cualquier carrera, en cualquier semestre. Si te interesa la bioinformática o la genómica computacional, queremos conocerte.',
    en: 'Students from any major, any semester. If bioinformatics or computational genomics interests you, we want to meet you.',
  },
  'home.join.cta': { es: 'Aplicar ahora', en: 'Apply now' },
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `bunx tsc --noEmit`
Expected: PASS. The `satisfies Record<string, { es: string; en: string }>` constraint enforces shape.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "i18n(applications): add bilingual strings for join, privacy, admin"
```

---

## Task 6: `JoinForm` component

The actual form. Uses `react-hook-form` + `zod`, mirroring the admin form pattern in `src/routes/admin/team.tsx`. Plain `<input>` / `<select>` / `<textarea>` elements (no `admin-*` classes — those are admin-themed; this is a public page). Honeypot field rendered offscreen.

**Files:**

- Create: `src/components/JoinForm.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/JoinForm.tsx`:

```tsx
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ConvexError } from 'convex/values'
import { useMutation } from 'convex/react'
import { Link } from '@tanstack/react-router'
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
                    {t(`join.subArea.${s}` as const)}
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
            <input
              type="checkbox"
              {...methods.register('acceptsContact')}
            />
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/JoinForm.tsx
git commit -m "feat(applications): add JoinForm component with validation and honeypot"
```

---

## Task 7: `/join` route + footer CTA rewire

The public landing for the form. Reads `applicationsOpen`; renders the closed-state panel or the form. Replaces the footer mailto with a `<Link>`.

**Files:**

- Create: `src/routes/join.tsx`
- Modify: `src/routes/__root.tsx:238-240`

- [ ] **Step 1: Create the `/join` route**

Create `src/routes/join.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { JoinForm } from '@/components/JoinForm'
import { useT } from '@/i18n/LanguageProvider'

export const Route = createFileRoute('/join')({ component: JoinPage })

function JoinPage() {
  const t = useT()
  const isOpen = useQuery(api.siteSettings.getApplicationsOpen)

  return (
    <main className="join-page">
      <div className="site-container">
        <header className="join-header">
          <span className="mono-label">{t('join.header.eyebrow')}</span>
          <h1 className="section-display">{t('join.header.title')}</h1>
          <p className="section-copy">{t('join.header.lead')}</p>
          <div className="divider" />
        </header>

        {isOpen === undefined ? null : isOpen ? (
          <JoinForm />
        ) : (
          <section className="join-closed">
            <h2 className="section-display">{t('join.closed.title')}</h2>
            <p className="section-copy">{t('join.closed.body')}</p>
            <a
              href="https://instagram.com/genobit.mty"
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-btn"
            >
              {t('join.closed.cta')}
            </a>
          </section>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Rewire the footer CTA**

In `src/routes/__root.tsx`, find the `SiteFooter` component (around line 233). Replace these three lines (currently 238-240):

```tsx
        <div className="footer-cta">
          <a href="mailto:genobit.mty@gmail.com">{t('footer.cta')}</a>
        </div>
```

with:

```tsx
        <div className="footer-cta">
          <Link to="/join">{t('footer.cta')}</Link>
        </div>
```

`Link` is already imported at the top of `__root.tsx`.

- [ ] **Step 3: Regenerate route tree**

The route tree (`src/routeTree.gen.ts`) is regenerated automatically when `bun run dev` is running. If dev isn't running, force regeneration:

Run: `bun run build`
Expected: build completes or fails on something unrelated; route tree is updated either way.

If build fails because of incomplete admin pages we haven't built yet — that's expected; the route tree generation happens before bundling. Verify `src/routeTree.gen.ts` now contains a `/join` route entry: `grep -n "'/join'" src/routeTree.gen.ts` should return matches.

- [ ] **Step 4: Verify the route loads in dev**

Run: `bun run dev` (in one terminal) and `npx convex dev` (in another).
Visit: `http://localhost:3000/join`
Expected: the form renders. Filling and submitting writes to Convex (check `npx convex dashboard` → `applications` table).

Also visit `/` and verify the footer "JOIN — TODAY" link now navigates to `/join` instead of opening the mail client.

- [ ] **Step 5: Commit**

```bash
git add src/routes/join.tsx src/routes/__root.tsx src/routeTree.gen.ts
git commit -m "feat(applications): add /join route and rewire footer CTA"
```

---

## Task 8: `/privacy` route stub

Placeholder bilingual page. Real *aviso de privacidad* gets drafted by the board and pasted in later.

**Files:**

- Create: `src/routes/privacy.tsx`

- [ ] **Step 1: Create the route**

Create `src/routes/privacy.tsx`:

```tsx
import { Link, createFileRoute } from '@tanstack/react-router'
import { useT } from '@/i18n/LanguageProvider'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

function PrivacyPage() {
  const t = useT()
  return (
    <main className="privacy-page">
      <div className="site-container">
        <Link to="/join" className="privacy-back">
          {t('privacy.back')}
        </Link>
        <h1 className="section-display">{t('privacy.title')}</h1>
        <p className="section-copy">{t('privacy.placeholder')}</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify the route loads**

Visit: `http://localhost:3000/privacy` (with `bun run dev` running).
Expected: page renders with placeholder copy.

- [ ] **Step 3: Commit**

```bash
git add src/routes/privacy.tsx src/routeTree.gen.ts
git commit -m "feat(applications): add /privacy stub route"
```

---

## Task 9: Homepage CTA section

Adds a fourth content row on the homepage that points to `/join`. Mirrors the visual rhythm of the existing research/team/events rows.

**Files:**

- Modify: `src/routes/index.tsx:229-249` (insert a new row after the events row, before `</div>` closing `.content-rows`)

- [ ] **Step 1: Add the join row**

Open `src/routes/index.tsx`. Locate the events row that ends with `<div className="floating-label">dato</div>` followed by `</div>` and `</div>` (around lines 247-249). **After** the closing `</div>` of the events `content-row` (line 249), and **before** the `</div>` that closes `.content-rows` (line 250), insert:

```tsx
            <div className="content-row reverse reveal-on-scroll">
              <div className="content-info">
                <span className="mono-label">{t('home.join.label')}</span>
                <h3 className="section-display">
                  <em>{t('home.join.title')}</em>
                </h3>
                <p className="section-copy">{t('home.join.body')}</p>
                <div className="divider" />
                <Link to="/join" className="editorial-btn filled">
                  {t('home.join.cta')}
                </Link>
              </div>
              <div className="content-media">
                <img
                  src={heroImages.team}
                  alt=""
                  className="content-image"
                />
                <div className="floating-label">únete</div>
              </div>
            </div>
```

(Reuses `heroImages.team` rather than introducing a new image slot — keeps the change scoped. The board can later replace via the existing home-images admin if they want a dedicated image.)

- [ ] **Step 2: Verify in dev**

Visit `http://localhost:3000/`. Scroll past events. The "Únete" / "Join us" row should render with a filled "Aplicar ahora" / "Apply now" button that navigates to `/join`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat(applications): add join CTA section to home page"
```

---

## Task 10: Admin applications list page

Filterable table view at `/admin/applications`. Default view hides terminal (`accepted` + `rejected`) submissions; toggle reveals them. Filters: group, status, assignee, name/email search. CSV export of the current filtered view. `applicationsOpen` toggle lives in the page header.

**Files:**

- Create: `src/routes/admin/applications.tsx`
- Modify: `src/routes/admin.tsx:18-26` (add "Applications" to NAV)
- Modify: `src/routes/admin/index.tsx` (add an Applications tile)

- [ ] **Step 1: Create the list page**

Create `src/routes/admin/applications.tsx`:

```tsx
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { getAdminToken } from '@/lib/adminAuth'
import {
  APPLICATION_STATUSES,
  CSV_COLUMNS,
  GROUPS,
  applicationToCsvRow,
  isTerminalStatus,
} from '@/lib/applications'
import type { Application, ApplicationStatus } from '@/lib/applications'

export const Route = createFileRoute('/admin/applications')({
  component: AdminApplicationsPage,
})

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'Nuevo',
  under_review: 'En revisión',
  contacted: 'Contactado',
  interview_scheduled: 'Entrevista agendada',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const GROUP_LABEL: Record<string, string> = {
  ndrg: 'NDRG',
  proteomics: 'Proteomics',
  'student-community': 'Student Community',
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCsv(filename: string, rows: Array<Array<string>>) {
  const header = (CSV_COLUMNS as ReadonlyArray<string>).map(escapeCsv).join(',')
  const body = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
  const csv = `${header}\n${body}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function AdminApplicationsPage() {
  const token = getAdminToken()
  const applications = useQuery(
    api.applications.list,
    token ? { sessionToken: token } : 'skip',
  )
  const isOpen = useQuery(api.siteSettings.getApplicationsOpen)
  const setApplicationsOpen = useMutation(api.siteSettings.setApplicationsOpen)

  const [showArchived, setShowArchived] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const filtered = useMemo(() => {
    if (!applications) return []
    const q = search.trim().toLowerCase()
    return applications.filter((a) => {
      if (!showArchived && isTerminalStatus(a.status as ApplicationStatus))
        return false
      if (groupFilter && a.group !== groupFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      if (
        assigneeFilter &&
        (a.assigneeName ?? '').toLowerCase() !== assigneeFilter.toLowerCase()
      )
        return false
      if (q) {
        const hay = `${a.fullName} ${a.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    applications,
    showArchived,
    groupFilter,
    statusFilter,
    assigneeFilter,
    search,
  ])

  const assigneeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const a of applications ?? []) {
      if (a.assigneeName) set.add(a.assigneeName)
    }
    return Array.from(set).sort()
  }, [applications])

  const toggleOpen = async () => {
    if (!token) return
    try {
      await setApplicationsOpen({ sessionToken: token, open: !isOpen })
      toast.success(isOpen ? 'Aplicaciones cerradas' : 'Aplicaciones abiertas')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onExport = () => {
    const rows = filtered.map((a) =>
      applicationToCsvRow(a as unknown as Application),
    )
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`genobit-applications-${today}.csv`, rows)
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Aplicaciones</h1>
          <p className="admin-page-sub">
            {filtered.length} {filtered.length === 1 ? 'aplicación' : 'aplicaciones'}
            {showArchived ? '' : ' activas'}
          </p>
        </div>
        <div className="admin-actions-row">
          <button
            type="button"
            className={`admin-btn ${isOpen ? 'is-open' : 'is-closed'}`}
            onClick={toggleOpen}
          >
            {isOpen ? '● Aplicaciones abiertas' : '○ Aplicaciones cerradas'}
          </button>
          <button type="button" className="admin-btn" onClick={onExport}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          className="admin-input"
          placeholder="Buscar por nombre o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-input"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">Todas las áreas</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABEL[g]}
            </option>
          ))}
        </select>
        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Cualquier estado</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          className="admin-input"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Cualquier responsable</option>
          {assigneeOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <label className="admin-toggle-inline">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Mostrar archivadas</span>
        </label>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Área</th>
            <th>Sub-área</th>
            <th>Estado</th>
            <th>Responsable</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a._id}>
              <td>
                <Link
                  to="/admin/applications/$id"
                  params={{ id: a._id }}
                  className="admin-table-link"
                >
                  {a.fullName}
                </Link>
                <div className="admin-table-sub">{a.email}</div>
              </td>
              <td>{GROUP_LABEL[a.group] ?? a.group}</td>
              <td>{a.subArea ?? '—'}</td>
              <td>{STATUS_LABEL[a.status as ApplicationStatus]}</td>
              <td>{a.assigneeName ?? '—'}</td>
              <td>
                {new Date(a.submittedAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="admin-table-empty">
                Sin aplicaciones que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Add "Aplicaciones" to admin NAV**

In `src/routes/admin.tsx`, update the `NAV` constant (currently lines 18-26). After the line `{ to: '/admin/team', label: 'Equipo' },` add a new entry:

```ts
  { to: '/admin/applications', label: 'Aplicaciones' },
```

The NAV constant should now read:

```ts
const NAV = [
  { to: '/admin', label: 'Inicio', exact: true },
  { to: '/admin/team', label: 'Equipo' },
  { to: '/admin/applications', label: 'Aplicaciones' },
  { to: '/admin/events', label: 'Eventos' },
  { to: '/admin/research', label: 'Investigación' },
  { to: '/admin/labs', label: 'Labs' },
  { to: '/admin/admins', label: 'Mesas pasadas' },
  { to: '/admin/home', label: 'Portada' },
] as const
```

- [ ] **Step 3: Add an Applications tile to the admin dashboard**

In `src/routes/admin/index.tsx`, the dashboard renders a grid of tiles. After the closing `</Link>` of the existing `/admin/team` tile (currently ending around line 51), add a new tile **before** the events tile:

```tsx
        <Link to="/admin/applications" className="admin-tile">
          <h2 className="admin-tile-title">Aplicaciones</h2>
          <p className="admin-tile-stat">Pipeline de reclutamiento</p>
          <span className="admin-tile-cta">→ Ver aplicaciones</span>
        </Link>
```

(We don't show a count here to avoid a third query just for the dashboard — the list page is one click away.)

- [ ] **Step 4: Verify in dev**

Run dev server. Log into `/admin`. The sidebar shows the new "Aplicaciones" link. Click it, see the list. Submit a test application via `/join`, watch it appear in the table. Use the filters. Toggle "Aplicaciones abiertas/cerradas" and verify `/join` reacts.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/applications.tsx src/routes/admin.tsx src/routes/admin/index.tsx src/routeTree.gen.ts
git commit -m "feat(applications): add admin list view with filters and CSV export"
```

---

## Task 11: Admin applications detail page

`/admin/applications/$id` — read-only applicant data, editable status / assignee / notes, status-history log, hard-delete button.

**Files:**

- Create: `src/routes/admin/applications_.$id.tsx`

The underscore suffix (`applications_`) opts this route out of being nested under `applications.tsx`'s component while still nesting under the parent `admin` layout — same pattern as `events_.$eventId.tsx`.

- [ ] **Step 1: Create the detail page**

Create `src/routes/admin/applications_.$id.tsx`:

```tsx
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { getAdminToken } from '@/lib/adminAuth'
import { APPLICATION_STATUSES } from '@/lib/applications'
import type { ApplicationStatus } from '@/lib/applications'

export const Route = createFileRoute('/admin/applications_/$id')({
  component: AdminApplicationDetailPage,
})

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'Nuevo',
  under_review: 'En revisión',
  contacted: 'Contactado',
  interview_scheduled: 'Entrevista agendada',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

function AdminApplicationDetailPage() {
  const params = Route.useParams()
  const id = params.id as Id<'applications'>
  const navigate = useNavigate()
  const token = getAdminToken()

  const app = useQuery(
    api.applications.getById,
    token ? { sessionToken: token, id } : 'skip',
  )
  const updateStatus = useMutation(api.applications.updateStatus)
  const updateAssignee = useMutation(api.applications.updateAssignee)
  const updateNotes = useMutation(api.applications.updateNotes)
  const remove = useMutation(api.applications.remove)

  const [assigneeDraft, setAssigneeDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')

  useEffect(() => {
    if (app) {
      setAssigneeDraft(app.assigneeName ?? '')
      setNotesDraft(app.adminNotes ?? '')
    }
  }, [app])

  if (!app) {
    return (
      <div className="admin-loading">Cargando…</div>
    )
  }

  const onChangeStatus = async (next: ApplicationStatus) => {
    if (!token) return
    try {
      await updateStatus({ sessionToken: token, id, status: next })
      toast.success(`Estado: ${STATUS_LABEL[next]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onSaveAssignee = async () => {
    if (!token) return
    try {
      await updateAssignee({ sessionToken: token, id, assigneeName: assigneeDraft })
      toast.success('Responsable actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onSaveNotes = async () => {
    if (!token) return
    try {
      await updateNotes({ sessionToken: token, id, adminNotes: notesDraft })
      toast.success('Notas guardadas')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const onDelete = async () => {
    if (!token) return
    const ok = window.confirm(
      `¿Eliminar la aplicación de ${app.fullName}? Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    try {
      await remove({ sessionToken: token, id })
      toast.success('Aplicación eliminada')
      navigate({ to: '/admin/applications' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div>
      <Link to="/admin/applications" className="admin-back">
        ← Volver a aplicaciones
      </Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{app.fullName}</h1>
          <p className="admin-page-sub">
            {app.email} · {app.phone} · {app.locale.toUpperCase()}
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-danger" onClick={onDelete}>
          Eliminar
        </button>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-detail-card">
          <h2 className="admin-detail-title">Datos del aspirante</h2>
          <dl className="admin-dl">
            <dt>Carrera</dt>
            <dd>
              {app.career}
              {app.careerOther ? ` · ${app.careerOther}` : ''}
            </dd>
            <dt>Semestre</dt>
            <dd>{app.semester}</dd>
            <dt>Universidad</dt>
            <dd>{app.university}</dd>
            <dt>Área</dt>
            <dd>{app.group}</dd>
            <dt>Sub-área</dt>
            <dd>{app.subArea ?? '—'}</dd>
            <dt>LinkedIn</dt>
            <dd>
              {app.linkedinUrl ? (
                <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  {app.linkedinUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
            <dt>GitHub</dt>
            <dd>
              {app.githubUrl ? (
                <a href={app.githubUrl} target="_blank" rel="noopener noreferrer">
                  {app.githubUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
            <dt>Motivación</dt>
            <dd className="admin-dl-paragraph">{app.motivation}</dd>
            <dt>Recibida</dt>
            <dd>{new Date(app.submittedAt).toLocaleString('es-MX')}</dd>
          </dl>
        </section>

        <section className="admin-detail-card">
          <h2 className="admin-detail-title">Seguimiento</h2>

          <div className="admin-field">
            <label className="admin-field-label">Estado</label>
            <select
              className="admin-input"
              value={app.status}
              onChange={(e) => onChangeStatus(e.target.value as ApplicationStatus)}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Responsable</label>
            <div className="admin-inline-edit">
              <input
                type="text"
                className="admin-input"
                value={assigneeDraft}
                onChange={(e) => setAssigneeDraft(e.target.value)}
                placeholder="Nombre del responsable"
              />
              <button type="button" className="admin-btn" onClick={onSaveAssignee}>
                Guardar
              </button>
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Notas</label>
            <textarea
              rows={5}
              className="admin-textarea"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Notas internas, recordatorios, contexto…"
            />
            <button
              type="button"
              className="admin-btn"
              onClick={onSaveNotes}
              style={{ marginTop: 8 }}
            >
              Guardar notas
            </button>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">Historial</label>
            <ol className="admin-history">
              {app.statusHistory
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span className="admin-history-status">
                      {STATUS_LABEL[h.status as ApplicationStatus] ?? h.status}
                    </span>
                    <span className="admin-history-time">
                      {new Date(h.changedAt).toLocaleString('es-MX')}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in dev**

Click an application from the list. Detail page loads. Change status — toast confirms, history list updates after refetch. Edit assignee → save → toast. Edit notes → save → toast. Delete with confirmation → navigates back to list.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/admin/applications_.\$id.tsx" src/routeTree.gen.ts
git commit -m "feat(applications): add admin detail page with status/assignee/notes"
```

---

## Task 12: Styles

Add the CSS for the public `/join` page (form, success, closed state, privacy stub) and admin applications table extras. Reuses existing CSS variables (`--gb-ink`, `--gb-paper`, `--gb-rule`, `--gb-primary`, `--body`, `--mono`).

**Files:**

- Modify: `src/styles.css` (append a new block at the end)

- [ ] **Step 1: Append the new styles**

Open `src/styles.css`. Append at the bottom (after the last existing rule):

```css
/* ═══════════ JOIN PAGE ═══════════ */

.join-page {
  padding: 120px 0 80px;
  min-height: 100vh;
}

.join-header {
  max-width: 720px;
  margin: 0 auto 56px;
  text-align: left;
}

.join-form {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 40px;
}

.join-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 20px;
}

.join-legend {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gb-ink);
  margin-bottom: 12px;
  padding: 0;
}

.join-field {
  display: grid;
  gap: 8px;
}

.join-label {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--gb-ink);
  text-transform: uppercase;
}

.join-input {
  width: 100%;
  padding: 12px 14px;
  font-family: var(--body);
  font-size: 0.95rem;
  border: 1px solid var(--gb-rule);
  border-radius: 4px;
  background: transparent;
  color: var(--gb-ink);
  transition: border-color 0.2s ease;
}

.join-input:focus {
  outline: none;
  border-color: var(--gb-ink);
}

.join-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: var(--body);
}

.join-error {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: #b03030;
  margin: 0;
}

.join-server-error {
  font-family: var(--body);
  font-size: 0.9rem;
  color: #b03030;
  padding: 12px 16px;
  border: 1px solid #b03030;
  border-radius: 4px;
}

.join-honeypot {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.join-consent {
  display: grid;
  gap: 8px;
}

.join-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-family: var(--body);
  font-size: 0.92rem;
  cursor: pointer;
}

.join-privacy-note {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--gb-ink);
  opacity: 0.7;
  margin: 0;
}

.join-privacy-link {
  color: var(--gb-ink);
  text-decoration: underline;
}

.join-success {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  padding: 40px 0;
}

.join-closed {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  padding: 40px 0;
}

/* ═══════════ PRIVACY PAGE ═══════════ */

.privacy-page {
  padding: 120px 0 80px;
  min-height: 100vh;
}

.privacy-back {
  display: inline-block;
  margin-bottom: 32px;
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--gb-ink);
  text-decoration: none;
}

.privacy-back:hover {
  text-decoration: underline;
}

/* ═══════════ ADMIN APPLICATIONS ═══════════ */

.admin-filters {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.admin-toggle-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 0.82rem;
  white-space: nowrap;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--body);
  font-size: 0.9rem;
}

.admin-table th {
  text-align: left;
  font-family: var(--mono);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 12px 8px;
  border-bottom: 1px solid var(--gb-rule);
  color: var(--gb-ink);
}

.admin-table td {
  padding: 14px 8px;
  border-bottom: 1px solid var(--gb-rule);
  vertical-align: top;
}

.admin-table-link {
  font-weight: 500;
  color: var(--gb-ink);
  text-decoration: none;
}

.admin-table-link:hover {
  text-decoration: underline;
}

.admin-table-sub {
  font-family: var(--mono);
  font-size: 0.74rem;
  opacity: 0.65;
  margin-top: 2px;
}

.admin-table-empty {
  text-align: center;
  padding: 48px 8px;
  opacity: 0.6;
}

.admin-actions-row {
  display: flex;
  gap: 12px;
}

.admin-btn-danger {
  border-color: #b03030;
  color: #b03030;
}

.admin-btn-danger:hover {
  background: #b03030;
  color: #fff;
}

.admin-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .admin-detail-grid {
    grid-template-columns: 1fr;
  }
  .admin-filters {
    grid-template-columns: 1fr;
  }
}

.admin-detail-card {
  border: 1px solid var(--gb-rule);
  border-radius: 6px;
  padding: 24px;
}

.admin-detail-title {
  font-family: var(--mono);
  font-size: 0.86rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 20px;
}

.admin-dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  row-gap: 10px;
  margin: 0;
}

.admin-dl dt {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.7;
}

.admin-dl dd {
  margin: 0;
  font-family: var(--body);
  font-size: 0.92rem;
}

.admin-dl-paragraph {
  grid-column: 1 / -1;
  white-space: pre-wrap;
}

.admin-back {
  display: inline-block;
  margin-bottom: 24px;
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--gb-ink);
  text-decoration: none;
}

.admin-back:hover {
  text-decoration: underline;
}

.admin-inline-edit {
  display: flex;
  gap: 8px;
}

.admin-inline-edit .admin-input {
  flex: 1;
}

.admin-history {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
  font-family: var(--mono);
  font-size: 0.82rem;
}

.admin-history li {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--gb-rule);
  padding-bottom: 6px;
}

.admin-history-status {
  font-weight: 600;
}

.admin-history-time {
  opacity: 0.7;
}

.admin-btn.is-open {
  border-color: #2d8a4a;
  color: #2d8a4a;
}

.admin-btn.is-closed {
  border-color: #b03030;
  color: #b03030;
}
```

- [ ] **Step 2: Verify visually**

Reload `/join`, `/privacy`, `/admin/applications`, and `/admin/applications/<id>` (use a real id by submitting a test app first). Check that the form is laid out cleanly on both desktop and mobile width (drag browser narrower), the admin filters wrap, the detail grid collapses to one column on narrow screens.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style(applications): add styles for join page and admin views"
```

---

## Task 13: End-to-end verification

Walk the whole flow as a fresh user and as the admin. Confirm everything works together before declaring the feature done.

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`
Expected: PASS. New tests from Task 1 (7) + existing tests still green.

- [ ] **Step 2: Run typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run linter and formatter**

Run: `bun run check`
Expected: completes; fix any formatting auto-fixes that occur.

If `bun run check` made changes, commit them:

```bash
git add -A
git commit -m "chore: prettier/eslint auto-fixes for applications feature"
```

- [ ] **Step 4: Manual smoke test — happy path**

With `bun run dev` and `npx convex dev` running:

1. From `/`, click footer "JOIN — TODAY". Land on `/join`.
2. Switch language ES ↔ EN. Verify all form copy translates.
3. Fill in all required fields. Pick group = Student Community. Verify sub-area select appears and is required.
4. Pick career = Other. Verify careerOther input appears and is required.
5. Submit. See inline success.
6. Click "Submit another application". Form resets.
7. Try to submit the *same email* again. See friendly duplicate error.

- [ ] **Step 5: Manual smoke test — admin path**

1. Log into `/admin/login`. Navigate to "Aplicaciones".
2. The submission from Step 4 appears.
3. Click into detail. Change status `new → under_review`. Toast confirms. History shows two entries.
4. Set assignee = "Test". Save. Toast confirms.
5. Add notes. Save. Toast confirms.
6. Go back to list. Filter by group = Student Community → submission shows. Filter by status = under_review → still shows. Filter by status = new → hidden.
7. Toggle "Mostrar archivadas". Change submission status to "accepted". List view by default hides it now; toggling archived shows it.
8. Click "Exportar CSV". A `genobit-applications-YYYY-MM-DD.csv` downloads. Open it — header row + one data row, columns match `CSV_COLUMNS`.

- [ ] **Step 6: Manual smoke test — closed state**

1. In admin list, click the "Aplicaciones abiertas" button. It flips to "Aplicaciones cerradas".
2. Open `/join` in a new incognito window. See the "Aplicaciones cerradas por ahora" panel, Instagram CTA, no form.
3. Flip back to open. `/join` shows the form again.

- [ ] **Step 7: Manual smoke test — honeypot**

In the browser devtools, before submitting a fresh form, run:

```js
document.querySelector('.join-honeypot input').value = 'spam'
```

Submit. Server silently treats as success (returns `{ ok: true }`) — verify in Convex dashboard that NO new row was inserted in `applications`.

- [ ] **Step 8: Delete the test data**

In the admin detail page for each test submission, click "Eliminar" → confirm. List should be empty.

- [ ] **Step 9: Final commit (if anything residual)**

If any cleanup or style tweaks happened during smoke testing:

```bash
git add -A
git commit -m "chore(applications): final tweaks from smoke testing"
```

Otherwise nothing to commit.

---

## Self-review notes (filled in by plan author)

**Spec coverage check:**

| Spec item | Task |
|---|---|
| Entry: `/join` route + footer rewire + homepage CTA | 7, 9 |
| Form fields & validation | 6 |
| Bilingual copy | 5 |
| Honeypot + 24h rate-limit | 3, 6 |
| Friendly duplicate error | 3, 6 |
| `applicationsOpen` toggle + closed state | 4, 7, 10 |
| Privacy stub route | 8 |
| `applications` schema + indexes | 2 |
| Admin list with filters, archived-hidden default, CSV | 10 |
| Admin detail with status/assignee/notes/history/delete | 11 |
| Pure helpers tested | 1 |
| Reuse `react-hook-form` + `zod` + `sonner` (no new deps) | 6, 10, 11 |
| No email notifications | (intentionally absent) |

**Type-consistency check:**

- `ApplicationStatus` defined in Task 1, used identically in Tasks 3, 10, 11.
- `Application` shape in `applicationToCsvRow` (Task 1) matches the schema (Task 2) field-by-field.
- `subAreaRequired` helper (Task 1) used by both client validation (Task 6) and server validation (Task 3).
- CSV column order in `CSV_COLUMNS` matches positional output of `applicationToCsvRow` — verified by Task 1 test.
