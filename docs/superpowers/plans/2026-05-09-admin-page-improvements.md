# Admin Page Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the GenoBit admin section intuitive enough for a non-technical board member to swap themselves in once a year, while remaining fast for the developer to operate. Centerpiece is a one-click "Board Transition" wizard for Mesa Directiva, plus broad UX polish (dashboard, sectioned forms, drag-and-drop, group-filter chips, bulk-import).

**Architecture:** All persistence stays in Convex; one new transactional mutation (`team.transitionBoard`) atomically archives the outgoing Mesa Directiva and creates the incoming one. Pure helpers (period inference, bulk-import parsing) are extracted and unit-tested with vitest. UI is React + react-hook-form + zod, matching existing admin patterns. Drag-and-drop uses `@dnd-kit/core` + `@dnd-kit/sortable`.

**Tech Stack:** Convex (DB + mutations), React 19, TanStack Router (file-based routing), react-hook-form, zod, framer-motion, sonner (toasts), vitest, @dnd-kit.

**Spec:** `docs/superpowers/specs/2026-05-09-admin-page-improvements-design.md`

**Pre-flight:**

- After any change to `convex/schema.ts` or files in `convex/*.ts`, run `npx convex codegen --typecheck=disable` once to regenerate `convex/_generated/*`. Frontend imports break otherwise. (Alternative: keep `npx convex dev` running in a side terminal for auto-regeneration.)
- Baseline (already verified before plan execution): `npm run test` passes (12 tests across 2 files).

---

## Task 1: Extend `pastAdministrations.members` schema

Adds optional fields so archived board members keep full profile fidelity. Convex permits additive optional fields without migration.

**Files:**

- Modify: `convex/schema.ts`

- [ ] **Step 1: Update the `pastAdministrations` table definition**

Replace the `pastAdministrations` table block in `convex/schema.ts` (around lines 26–39) with:

```ts
  pastAdministrations: defineTable({
    period: v.string(),
    presidentName: v.string(),
    description: v.optional(bilingual),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    members: v.array(
      v.object({
        name: v.string(),
        role: bilingual,
        career: v.optional(v.string()),
        tenure: v.optional(v.string()),
        bio: v.optional(bilingual),
        imageUrl: v.optional(v.string()),
        galleryImageUrls: v.optional(v.array(v.string())),
        email: v.optional(v.string()),
        linkedinUrl: v.optional(v.string()),
        githubUrl: v.optional(v.string()),
      }),
    ),
  }),
```

- [ ] **Step 2: Verify Convex accepts the schema**

Run: `npx convex codegen --typecheck=disable`
Expected: completes without schema-validation errors and rewrites files under `convex/_generated/`. If it fails, fix syntax and retry.

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(convex): widen pastAdministrations.members for full profile snapshots"
```

---

## Task 2: Update `pastAdmin` mutations to accept the wider member shape

Mirror the schema change in `convex/pastAdmin.ts` so create/update accept the new optional fields.

**Files:**

- Modify: `convex/pastAdmin.ts`

- [ ] **Step 1: Replace the `memberValidator` constant**

Replace lines 7–11 (`const memberValidator = ...`) with:

```ts
const memberValidator = v.object({
  name: v.string(),
  role: bilingualValidator,
  career: v.optional(v.string()),
  tenure: v.optional(v.string()),
  bio: v.optional(bilingualValidator),
  imageUrl: v.optional(v.string()),
  galleryImageUrls: v.optional(v.array(v.string())),
  email: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  githubUrl: v.optional(v.string()),
})
```

- [ ] **Step 2: Verify type regeneration**

Run: `npx convex codegen --typecheck=disable`, then `npm run build`.
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add convex/pastAdmin.ts
git commit -m "feat(convex): accept full member profile in pastAdmin create/update"
```

---

## Task 3: Period inference helpers (pure, TDD)

Pure functions used by the dashboard and the wizard. `inferCurrentPeriod` reads tenures off the directives; `nextPeriod` increments a `YYYY-YYYY` string.

**Files:**

- Create: `src/lib/periodInference.ts`
- Test: `src/lib/periodInference.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/periodInference.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { inferCurrentPeriod, nextPeriod } from './periodInference'

describe('nextPeriod', () => {
  it('increments both years of a YYYY-YYYY period', () => {
    expect(nextPeriod('2025-2026')).toBe('2026-2027')
    expect(nextPeriod('1999-2000')).toBe('2000-2001')
  })

  it('returns null for malformed input', () => {
    expect(nextPeriod('')).toBeNull()
    expect(nextPeriod('2025')).toBeNull()
    expect(nextPeriod('abcd-efgh')).toBeNull()
  })
})

describe('inferCurrentPeriod', () => {
  type M = { group?: string; tenure?: string }

  it('returns the most-frequent tenure among directives', () => {
    const members: Array<M> = [
      { group: 'directives', tenure: '2025-2026' },
      { group: 'directives', tenure: '2025-2026' },
      { group: 'directives', tenure: '2024-2025' },
      { group: 'ndrg', tenure: '2020-2021' },
    ]
    expect(inferCurrentPeriod(members)).toBe('2025-2026')
  })

  it('returns null when no directives have a tenure', () => {
    const members: Array<M> = [
      { group: 'directives' },
      { group: 'ndrg', tenure: '2020-2021' },
    ]
    expect(inferCurrentPeriod(members)).toBeNull()
  })

  it('returns null when there are no directives', () => {
    const members: Array<M> = [{ group: 'ndrg', tenure: '2020-2021' }]
    expect(inferCurrentPeriod(members)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test -- periodInference`
Expected: failure with module-not-found.

- [ ] **Step 3: Create the implementation**

Create `src/lib/periodInference.ts`:

```ts
export function nextPeriod(period: string): string | null {
  const match = /^(\d{4})-(\d{4})$/.exec(period)
  if (!match) return null
  const start = Number(match[1])
  const end = Number(match[2])
  return `${start + 1}-${end + 1}`
}

type MemberLike = { group?: string; tenure?: string }

export function inferCurrentPeriod(
  members: ReadonlyArray<MemberLike>,
): string | null {
  const counts = new Map<string, number>()
  for (const m of members) {
    if (m.group !== 'directives') continue
    if (!m.tenure) continue
    counts.set(m.tenure, (counts.get(m.tenure) ?? 0) + 1)
  }
  let best: { tenure: string; count: number } | null = null
  for (const [tenure, count] of counts) {
    if (!best || count > best.count) best = { tenure, count }
  }
  return best?.tenure ?? null
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test -- periodInference`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/periodInference.ts src/lib/periodInference.test.ts
git commit -m "feat(team): add period inference helpers"
```

---

## Task 4: Bulk-import parser (pure, TDD)

Parses the textarea content for the bulk-import modal. Pure function with strict validation, returns either a list of rows or row-level errors.

**Files:**

- Create: `src/lib/bulkImport.ts`
- Test: `src/lib/bulkImport.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/bulkImport.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseBulkRoster } from './bulkImport'

describe('parseBulkRoster', () => {
  it('parses 3-field rows', () => {
    const text = 'Ana Smith | Investigadora | Researcher'
    const result = parseBulkRoster(text)
    expect(result.rows).toEqual([
      {
        lineNumber: 1,
        name: 'Ana Smith',
        roleEs: 'Investigadora',
        roleEn: 'Researcher',
        career: undefined,
        valid: true,
        error: null,
      },
    ])
    expect(result.hasErrors).toBe(false)
  })

  it('parses 4-field rows with optional career', () => {
    const text = 'Ana Smith | Investigadora | Researcher | IBT'
    const result = parseBulkRoster(text)
    expect(result.rows[0].career).toBe('IBT')
  })

  it('skips blank lines and # comments', () => {
    const text = `# Roster for NDRG\n\nAna | Investigadora | Researcher\n\n# end`
    const result = parseBulkRoster(text)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Ana')
  })

  it('flags rows with too few fields', () => {
    const text = 'Ana | Investigadora'
    const result = parseBulkRoster(text)
    expect(result.rows[0].valid).toBe(false)
    expect(result.rows[0].error).toMatch(/3 o 4 campos/)
    expect(result.hasErrors).toBe(true)
  })

  it('flags rows with too many fields', () => {
    const text = 'Ana | a | b | c | d'
    const result = parseBulkRoster(text)
    expect(result.rows[0].valid).toBe(false)
  })

  it('flags rows with empty required fields', () => {
    const text = ' | Investigadora | Researcher'
    const result = parseBulkRoster(text)
    expect(result.rows[0].valid).toBe(false)
    expect(result.rows[0].error).toMatch(/Nombre/)
  })

  it('preserves original line numbers when blanks/comments are skipped', () => {
    const text = '# header\n\nAna | a | b\n\n# mid\nBeto | c | d'
    const result = parseBulkRoster(text)
    expect(result.rows.map((r) => r.lineNumber)).toEqual([3, 6])
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test -- bulkImport`
Expected: failure with module-not-found.

- [ ] **Step 3: Create the implementation**

Create `src/lib/bulkImport.ts`:

```ts
export type BulkRow = {
  lineNumber: number
  name: string
  roleEs: string
  roleEn: string
  career: string | undefined
  valid: boolean
  error: string | null
}

export type BulkParseResult = {
  rows: Array<BulkRow>
  hasErrors: boolean
}

export function parseBulkRoster(text: string): BulkParseResult {
  const lines = text.split('\n')
  const rows: Array<BulkRow> = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    const parts = trimmed.split('|').map((p) => p.trim())
    const lineNumber = i + 1
    if (parts.length < 3 || parts.length > 4) {
      rows.push({
        lineNumber,
        name: parts[0] ?? '',
        roleEs: parts[1] ?? '',
        roleEn: parts[2] ?? '',
        career: parts[3],
        valid: false,
        error: 'Cada línea debe tener 3 o 4 campos separados por "|".',
      })
      continue
    }
    const [name, roleEs, roleEn, career] = parts
    if (!name) {
      rows.push({
        lineNumber,
        name,
        roleEs,
        roleEn,
        career,
        valid: false,
        error: 'Nombre requerido.',
      })
      continue
    }
    if (!roleEs) {
      rows.push({
        lineNumber,
        name,
        roleEs,
        roleEn,
        career,
        valid: false,
        error: 'Rol ES requerido.',
      })
      continue
    }
    if (!roleEn) {
      rows.push({
        lineNumber,
        name,
        roleEs,
        roleEn,
        career,
        valid: false,
        error: 'Rol EN requerido.',
      })
      continue
    }
    rows.push({
      lineNumber,
      name,
      roleEs,
      roleEn,
      career: career || undefined,
      valid: true,
      error: null,
    })
  }
  return { rows, hasErrors: rows.some((r) => !r.valid) }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test -- bulkImport`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bulkImport.ts src/lib/bulkImport.test.ts
git commit -m "feat(team): add bulk-roster parser with row-level validation"
```

---

## Task 5: Convex `team.bulkCreate` mutation

Inserts many `teamMembers` rows in one transaction.

**Files:**

- Modify: `convex/team.ts`

- [ ] **Step 1: Append the new mutation to `convex/team.ts`**

Add at the bottom of `convex/team.ts` (after `seedGenobitTeam`):

```ts
export const bulkCreate = mutation({
  args: {
    sessionToken: v.string(),
    group: v.string(),
    rows: v.array(
      v.object({
        name: v.string(),
        roleEs: v.string(),
        roleEn: v.string(),
        career: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ inserted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)

    const existing = await ctx.db.query('teamMembers').collect()
    let nextOrder =
      existing.reduce((max, m) => Math.max(max, m.order ?? -1), -1) + 1

    let inserted = 0
    for (const row of args.rows) {
      await ctx.db.insert('teamMembers', {
        name: row.name,
        role: { es: row.roleEs, en: row.roleEn },
        career: row.career,
        group: args.group,
        order: nextOrder++,
      })
      inserted++
    }
    return { inserted }
  },
})
```

- [ ] **Step 2: Verify type regeneration**

Run: `npx convex codegen --typecheck=disable`, then `npm run build`.
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add convex/team.ts
git commit -m "feat(convex): add team.bulkCreate mutation for bulk roster import"
```

---

## Task 6: Convex `team.setOrder` mutation, remove `team.reorder`

Replaces the swap-with-neighbor `reorder` with a "rewrite group order from a sorted id list" call. Makes drag-and-drop trivial; arrows go away in Task 14.

**Files:**

- Modify: `convex/team.ts`

- [ ] **Step 1: Replace the `reorder` export with `setOrder`**

In `convex/team.ts`, replace the entire `export const reorder = ...` block (around lines 127–157) with:

```ts
export const setOrder = mutation({
  args: {
    sessionToken: v.string(),
    group: v.string(),
    orderedIds: v.array(v.id('teamMembers')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)

    const all = await ctx.db.query('teamMembers').collect()
    const groupMembers = all.filter((m) => m.group === args.group)
    const groupIds = new Set(groupMembers.map((m) => m._id))

    for (const id of args.orderedIds) {
      if (!groupIds.has(id)) {
        throw new Error(`Member ${id} is not in group ${args.group}`)
      }
    }
    if (args.orderedIds.length !== groupMembers.length) {
      throw new Error(
        `Expected ${groupMembers.length} ids for group ${args.group}, got ${args.orderedIds.length}`,
      )
    }

    const otherMaxOrder = all
      .filter((m) => m.group !== args.group)
      .reduce((max, m) => Math.max(max, m.order ?? -1), -1)

    let nextOrder = otherMaxOrder + 1
    for (const id of args.orderedIds) {
      await ctx.db.patch(id, { order: nextOrder++ })
    }
    return null
  },
})
```

- [ ] **Step 2: Verify type regeneration**

Run: `npx convex codegen --typecheck=disable`, then `npm run build`. The build will fail in `src/routes/admin/team.tsx` because the old `reorder` mutation reference is gone; that is expected and gets fixed in Task 14. For now, fix the build error temporarily by commenting out the two `reorder({...})` calls and the `const reorder = useMutation(api.team.reorder)` line in `team.tsx`. Wrap them in `// TASK 14:` comments.

- [ ] **Step 3: Confirm build passes after the temporary stub**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add convex/team.ts src/routes/admin/team.tsx
git commit -m "feat(convex): replace team.reorder with team.setOrder; stub UI calls until DnD lands"
```

---

## Task 7: Convex `team.transitionBoard` mutation

The atomic board-transition mutation called by Step 4 of the wizard.

**Files:**

- Modify: `convex/team.ts`

- [ ] **Step 1: Append the mutation**

Add at the bottom of `convex/team.ts`:

```ts
export const transitionBoard = mutation({
  args: {
    sessionToken: v.string(),
    outgoingPeriod: v.string(),
    incomingPeriod: v.string(),
    pastAdmin: v.object({
      presidentName: v.string(),
      description: v.optional(bilingualValidator),
      imageUrl: v.optional(v.string()),
      galleryImageUrls: v.optional(v.array(v.string())),
    }),
    incomingMembers: v.array(
      v.object({
        name: v.string(),
        role: bilingualValidator,
        career: v.optional(v.string()),
        email: v.optional(v.string()),
        linkedinUrl: v.optional(v.string()),
        githubUrl: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ pastAdminId: v.id('pastAdministrations') }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken)

    const all = await ctx.db.query('teamMembers').collect()
    const outgoing = all.filter((m) => m.group === 'directives')

    const archivedMembers = outgoing.map((m) => ({
      name: m.name,
      role: m.role,
      career: m.career,
      tenure: m.tenure,
      bio: m.bio,
      imageUrl: m.imageUrl,
      galleryImageUrls: m.galleryImageUrls,
      email: m.email,
      linkedinUrl: m.linkedinUrl,
      githubUrl: m.githubUrl,
    }))

    const pastAdminId = await ctx.db.insert('pastAdministrations', {
      period: args.outgoingPeriod,
      presidentName: args.pastAdmin.presidentName,
      description: args.pastAdmin.description,
      imageUrl: args.pastAdmin.imageUrl,
      galleryImageUrls: args.pastAdmin.galleryImageUrls,
      members: archivedMembers,
    })

    for (const m of outgoing) {
      await ctx.db.delete(m._id)
    }

    const otherMaxOrder = all
      .filter((m) => m.group !== 'directives')
      .reduce((max, m) => Math.max(max, m.order ?? -1), -1)

    let nextOrder = otherMaxOrder + 1
    for (const incoming of args.incomingMembers) {
      await ctx.db.insert('teamMembers', {
        name: incoming.name,
        role: incoming.role,
        career: incoming.career,
        group: 'directives',
        tenure: args.incomingPeriod,
        isFirstBoard: false,
        email: incoming.email,
        linkedinUrl: incoming.linkedinUrl,
        githubUrl: incoming.githubUrl,
        imageUrl: incoming.imageUrl,
        order: nextOrder++,
      })
    }

    return { pastAdminId }
  },
})
```

- [ ] **Step 2: Verify regeneration and build**

Run: `npx convex codegen --typecheck=disable`, then `npm run build`.
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add convex/team.ts
git commit -m "feat(convex): add transactional team.transitionBoard mutation"
```

---

## Task 8: `<FormSection>` component

Lightweight visual wrapper that gives forms grouped headers without adding a dependency.

**Files:**

- Modify: `src/components/admin/fields.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add the component to `fields.tsx`**

Append to the bottom of `src/components/admin/fields.tsx`:

```tsx
export function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="admin-form-section">
      <legend className="admin-form-section-title">{title}</legend>
      <div className="admin-form-section-body">{children}</div>
    </fieldset>
  )
}
```

- [ ] **Step 2: Add the styles**

Append to `src/styles.css`:

```css
.admin-form-section {
  border: 1px solid #e6e1d7;
  border-radius: 12px;
  padding: 18px 20px 20px;
  margin: 0 0 20px 0;
  background: #fdfcf9;
}

.admin-form-section-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b665b;
  padding: 0 8px;
}

.admin-form-section-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
}
```

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/fields.tsx src/styles.css
git commit -m "feat(admin): add FormSection wrapper for grouped form headers"
```

---

## Task 9: `BulkImportModal` component

Reusable modal that hosts the textarea, parsing preview, and commit. Used by Task 12 from the team page.

**Files:**

- Create: `src/components/admin/BulkImportModal.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create the modal component**

Create `src/components/admin/BulkImportModal.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { getAdminToken } from '@/lib/adminAuth'
import { parseBulkRoster, type BulkRow } from '@/lib/bulkImport'

type Phase = 'edit' | 'preview'

export function BulkImportModal({
  group,
  groupLabel,
  onClose,
  onImported,
}: {
  group: string
  groupLabel: string
  onClose: () => void
  onImported: () => void
}) {
  const [phase, setPhase] = useState<Phase>('edit')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bulkCreate = useMutation(api.team.bulkCreate)

  const result = useMemo(() => parseBulkRoster(text), [text])
  const validRows = result.rows.filter((r) => r.valid)

  const onCommit = async () => {
    const token = getAdminToken()
    if (!token) return
    setSubmitting(true)
    try {
      await bulkCreate({
        sessionToken: token,
        group,
        rows: validRows.map((r) => ({
          name: r.name,
          roleEs: r.roleEs,
          roleEn: r.roleEn,
          career: r.career,
        })),
      })
      toast.success(`${validRows.length} miembros añadidos`)
      onImported()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Importar lista — ${groupLabel}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Importar lista — {groupLabel}</h2>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {phase === 'edit' ? (
          <div className="admin-modal-body">
            <p className="admin-field-desc">
              Pega una persona por línea, en formato:{' '}
              <code>Nombre | Rol ES | Rol EN | Carrera (opcional)</code>
            </p>
            <p className="admin-field-desc">
              Las líneas vacías y las que empiezan con <code>#</code> se
              ignoran.
            </p>
            <textarea
              className="admin-textarea admin-bulk-textarea"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`# NDRG roster\nFedra Mandujano | Investigadora Principal | Principal Investigator | IDM\nRogelio Lara | Investigador | Researcher | IBT`}
            />
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={result.rows.length === 0}
                onClick={() => setPhase('preview')}
              >
                Vista previa →
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-modal-body">
            <table className="admin-bulk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Rol ES</th>
                  <th>Rol EN</th>
                  <th>Carrera</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r: BulkRow) => (
                  <tr
                    key={r.lineNumber}
                    className={r.valid ? '' : 'admin-bulk-row-invalid'}
                  >
                    <td>{r.lineNumber}</td>
                    <td>{r.name || <em>(vacío)</em>}</td>
                    <td>{r.roleEs || <em>(vacío)</em>}</td>
                    <td>{r.roleEn || <em>(vacío)</em>}</td>
                    <td>{r.career ?? '—'}</td>
                    <td>{r.valid ? '✓' : `✗ ${r.error}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setPhase('edit')}
              >
                ← Editar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={
                  result.hasErrors || validRows.length === 0 || submitting
                }
                onClick={onCommit}
              >
                {submitting
                  ? 'Importando…'
                  : `Crear ${validRows.length} miembros`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add modal styles**

Append to `src/styles.css`:

```css
.admin-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 23, 23, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.admin-modal {
  background: #faf8f5;
  border-radius: 14px;
  width: min(720px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(14, 23, 23, 0.25);
  overflow: hidden;
}

.admin-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #e6e1d7;
}

.admin-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #0e1717;
}

.admin-modal-body {
  padding: 18px 22px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-bulk-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  min-height: 220px;
}

.admin-bulk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.admin-bulk-table th,
.admin-bulk-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #ece7dc;
  text-align: left;
}

.admin-bulk-table th {
  font-weight: 600;
  color: #6b665b;
  background: #f3eee3;
}

.admin-bulk-row-invalid {
  background: #fbe9e7;
}
```

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/BulkImportModal.tsx src/styles.css
git commit -m "feat(admin): add BulkImportModal with parse-preview-commit flow"
```

---

## Task 10: Replace `/admin/index.tsx` with the dashboard

Stop redirecting to `/admin/team`. Render a real dashboard with stat tiles + the wizard CTA.

**Files:**

- Modify: `src/routes/admin/index.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `index.tsx` entirely**

Replace `src/routes/admin/index.tsx` with:

```tsx
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { inferCurrentPeriod } from '@/lib/periodInference'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const team = useQuery(api.team.get)
  const events = useQuery(api.events.get)
  const research = useQuery(api.research.get)
  const labs = useQuery(api.labs.get)
  const pastAdmins = useQuery(api.pastAdmin.get)

  const currentPeriod = team ? inferCurrentPeriod(team) : null

  const directives = team?.filter((m) => m.group === 'directives').length ?? 0
  const ndrg = team?.filter((m) => m.group === 'ndrg').length ?? 0
  const proteomics = team?.filter((m) => m.group === 'proteomics').length ?? 0
  const community =
    team?.filter((m) => m.group === 'student-community').length ?? 0

  const upcomingEvents = events?.filter((e) => e.isUpcoming).length ?? 0
  const pastEvents = events?.filter((e) => !e.isUpcoming).length ?? 0

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">GenoBit · Admin</h1>
          <p className="admin-page-sub">
            Periodo actual: {currentPeriod ?? '—'}
          </p>
        </div>
        <Link to="/admin/board-transition" className="admin-btn">
          Iniciar transición de mesa →
        </Link>
      </div>

      <div className="admin-dashboard-grid">
        <Link to="/admin/team" className="admin-tile">
          <h2 className="admin-tile-title">Equipo</h2>
          <p className="admin-tile-stat">{directives} directivos</p>
          <p className="admin-tile-stat-sub">
            {ndrg} NDRG · {proteomics} Proteomics · {community} Community
          </p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/events" className="admin-tile">
          <h2 className="admin-tile-title">Eventos</h2>
          <p className="admin-tile-stat">{upcomingEvents} próximos</p>
          <p className="admin-tile-stat-sub">{pastEvents} pasados</p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/research" className="admin-tile">
          <h2 className="admin-tile-title">Investigación</h2>
          <p className="admin-tile-stat">
            {research?.length ?? 0} publicaciones
          </p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/labs" className="admin-tile">
          <h2 className="admin-tile-title">Labs</h2>
          <p className="admin-tile-stat">{labs?.length ?? 0} labs</p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/admins" className="admin-tile">
          <h2 className="admin-tile-title">Mesas pasadas</h2>
          <p className="admin-tile-stat">
            {pastAdmins?.length ?? 0} mesas archivadas
          </p>
          <span className="admin-tile-cta">→ Ver archivo</span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add dashboard styles**

Append to `src/styles.css`:

```css
.admin-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.admin-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px 20px;
  border-radius: 14px;
  border: 1px solid #e6e1d7;
  background: #fdfcf9;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.admin-tile:hover {
  border-color: #0e1717;
  transform: translateY(-1px);
}

.admin-tile-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b665b;
  margin: 0;
}

.admin-tile-stat {
  font-size: 22px;
  font-weight: 600;
  color: #0e1717;
  margin: 4px 0 0;
}

.admin-tile-stat-sub {
  font-size: 13px;
  color: #6b665b;
  margin: 0;
}

.admin-tile-cta {
  margin-top: auto;
  font-size: 13px;
  font-weight: 500;
  color: #0e1717;
  padding-top: 8px;
}
```

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Sanity check in the browser**

Run `npm run dev`, navigate to `/admin`, log in if needed. Confirm the dashboard renders with stats. Click each tile → it should navigate to the corresponding section. The "Iniciar transición de mesa" link will 404 until Task 15 — that is expected.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/index.tsx src/styles.css
git commit -m "feat(admin): replace redirect with stat-tile dashboard"
```

---

## Task 11: Add "Inicio" link to the admin sidebar

**Files:**

- Modify: `src/routes/admin.tsx`

- [ ] **Step 1: Update the `NAV` constant**

In `src/routes/admin.tsx`, replace the `NAV` constant (around lines 12–18):

```tsx
const NAV = [
  { to: '/admin', label: 'Inicio', exact: true },
  { to: '/admin/team', label: 'Equipo' },
  { to: '/admin/events', label: 'Eventos' },
  { to: '/admin/research', label: 'Investigación' },
  { to: '/admin/labs', label: 'Labs' },
  { to: '/admin/admins', label: 'Mesas pasadas' },
] as const
```

- [ ] **Step 2: Pass the `exact` flag to TanStack Link**

In the same file, update the `Link` rendering inside the `NAV.map(...)` block to use `activeOptions` so `Inicio` doesn't stay highlighted on every sub-route:

```tsx
{
  NAV.map((item) => (
    <Link
      key={item.to}
      to={item.to}
      className="admin-nav-link"
      activeProps={{ className: 'admin-nav-link is-active' }}
      activeOptions={item.exact ? { exact: true } : undefined}
    >
      {item.label}
    </Link>
  ))
}
```

Also remove the `path === '/admin'` redirect-to-team `useEffect` block (around lines 52–57) since `/admin` now renders a real page:

```tsx
// DELETE this whole block:
useEffect(() => {
  if (!checked) return
  if (path === '/admin' && token) {
    navigate({ to: '/admin/team' })
  }
}, [path, token, checked, navigate])
```

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser sanity check**

Reload `/admin`. The sidebar shows "Inicio" highlighted only when on `/admin` exactly.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin.tsx
git commit -m "feat(admin): add Inicio sidebar link, drop legacy /admin → /admin/team redirect"
```

---

## Task 12: Wire bulk-import button into the team page

Add the `Importar lista` button to the three non-board group sections, opening `BulkImportModal`.

**Files:**

- Modify: `src/routes/admin/team.tsx`

- [ ] **Step 1: Import the modal and add state**

At the top of `src/routes/admin/team.tsx`, add:

```tsx
import { BulkImportModal } from '@/components/admin/BulkImportModal'
```

Inside `AdminTeamPage`, add a new state hook near the existing `editing`/`filter` state (around line 95):

```tsx
const [bulkImportGroup, setBulkImportGroup] = useState<string | null>(null)
```

- [ ] **Step 2: Render the modal at the bottom of the list view**

Just before the closing `</div>` of the list view (around line 266, just inside the outermost `return (<div>…)` for the non-editing branch), add:

```tsx
{
  bulkImportGroup ? (
    <BulkImportModal
      group={bulkImportGroup}
      groupLabel={GROUP_LABELS[bulkImportGroup] ?? bulkImportGroup}
      onClose={() => setBulkImportGroup(null)}
      onImported={() => {
        // Convex `useQuery` auto-revalidates, no manual refetch needed.
      }}
    />
  ) : null
}
```

- [ ] **Step 3: Add the per-section button**

Inside the existing `GROUPS.map((g) => …)` rendering loop, add a header row above each section's cards. Find the JSX block:

```tsx
GROUPS.map((g) => (
  <div key={g.value} className="admin-list-section">
    <h2 className="admin-list-section-title">{g.label}</h2>
    {grouped[g.value].length ? (
```

Replace the title line with:

```tsx
<div className="admin-list-section-header">
  <h2 className="admin-list-section-title">{g.label}</h2>
  {g.value !== 'directives' ? (
    <button
      type="button"
      className="admin-btn admin-btn-secondary admin-btn-small"
      onClick={() => setBulkImportGroup(g.value)}
    >
      Importar lista
    </button>
  ) : null}
</div>
```

- [ ] **Step 4: Add styles for the new header layout and small button**

Append to `src/styles.css`:

```css
.admin-list-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.admin-btn-small {
  padding: 6px 12px;
  font-size: 12px;
}
```

- [ ] **Step 5: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Browser test**

Run `npm run dev`. On `/admin/team`, the NDRG / Proteomics / Student Community sections each show an `Importar lista` button next to the title; Mesa Directiva does not. Clicking the button opens the modal. Try pasting two valid rows + one invalid row and confirm the preview blocks commit until the bad row is fixed. After committing, the new members appear at the bottom of the section.

- [ ] **Step 7: Commit**

```bash
git add src/routes/admin/team.tsx src/styles.css
git commit -m "feat(admin): expose bulk-roster import on non-board team groups"
```

---

## Task 13: Group filter chips on `/admin/team`

Replace the implicit "show all groups stacked" with a chip row that filters and persists in the URL.

**Files:**

- Modify: `src/routes/admin/team.tsx`

- [ ] **Step 1: Read and write the URL search param**

At the top of `src/routes/admin/team.tsx`, replace the route definition with one that validates the `group` search param:

```tsx
import { z } from 'zod'

const teamSearchSchema = z.object({
  group: z
    .enum(['directives', 'ndrg', 'proteomics', 'student-community'])
    .optional(),
})

export const Route = createFileRoute('/admin/team')({
  component: AdminTeamPage,
  validateSearch: teamSearchSchema,
})
```

(Keep the existing `z` import if it already exists; otherwise the new import line above is what adds it.)

- [ ] **Step 2: Read the param in the page component**

Inside `AdminTeamPage`, add near the top of the function:

```tsx
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
```

- [ ] **Step 3: Compute counts and filter the visible groups**

Add right after the existing `grouped` `useMemo`:

```tsx
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
```

- [ ] **Step 4: Render the chip row above the search input**

Just above the existing `<input type="text" className="admin-filter-input" …>` in the list view, add:

```tsx
<div className="admin-filter-chips" role="tablist" aria-label="Filtrar grupo">
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
      {g.label} · {groupCounts[g.value as keyof typeof groupCounts] ?? 0}
    </button>
  ))}
</div>
```

Replace the `GROUPS.map(...)` call below with `visibleGroups.map(...)`.

- [ ] **Step 5: Add chip styles**

Append to `src/styles.css`:

```css
.admin-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 14px 0;
}

.admin-chip {
  border: 1px solid #d8d2c4;
  background: #fdfcf9;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #4d4940;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-chip:hover {
  border-color: #0e1717;
}

.admin-chip.is-active {
  background: #0e1717;
  color: #faf8f5;
  border-color: #0e1717;
}
```

- [ ] **Step 6: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 7: Browser test**

`/admin/team` should show 5 chips with counts. Clicking a chip filters the list and the URL becomes `?group=ndrg`. Reloading preserves the filter. Clicking Todos clears the param.

- [ ] **Step 8: Commit**

```bash
git add src/routes/admin/team.tsx src/styles.css
git commit -m "feat(admin): add group filter chips with URL persistence on team page"
```

---

## Task 14: Drag-and-drop reorder on `/admin/team`

Replace `↑/↓` arrows with dnd-kit drag handles. Each group is its own sortable context. Wires the `team.setOrder` mutation from Task 6.

**Files:**

- Modify: `package.json`
- Modify: `src/routes/admin/team.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Install dnd-kit**

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: install succeeds, `package.json` updated.

- [ ] **Step 2: Build a sortable group list section**

In `src/routes/admin/team.tsx`, near the other imports add:

```tsx
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

Inside `AdminTeamPage`, replace the entire `GROUPS.map(...)` (now `visibleGroups.map(...)`) block with:

```tsx
{
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
          toast.error(err instanceof Error ? err.message : 'Error al eliminar')
        }
      }}
      onOpenBulkImport={
        g.value !== 'directives' ? () => setBulkImportGroup(g.value) : null
      }
    />
  ))
}
```

Then remove the `reorder` references entirely from `AdminTeamPage` (the `const reorder = useMutation(api.team.reorder)` line and the temp-stubbed handlers from Task 6). The `setOrder` mutation is consumed inside the new `SortableGroupSection` component below — `AdminTeamPage` itself does not need a `setOrder` hook.

Now define the `SortableGroupSection` component below `AdminTeamPage` (above `TeamForm`):

```tsx
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
```

Add `useEffect` to the existing `react` import line if not already imported.

- [ ] **Step 3: Add drag handle styles**

Append to `src/styles.css`:

```css
.admin-drag-handle {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #b0a99a;
  padding: 0 6px;
  cursor: grab;
  user-select: none;
  line-height: 1;
}

.admin-drag-handle:active {
  cursor: grabbing;
}

.admin-drag-handle:hover {
  color: #0e1717;
}
```

- [ ] **Step 4: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Browser test**

`/admin/team`: each member card has a `⋮⋮` handle on the left. Drag one card up or down within a group → list reorders, change persists across reload. Cross-group drag should be blocked (separate `DndContext` per group). Tab to a handle, press Space, use arrow keys to move, Space to drop — keyboard reorder works.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/routes/admin/team.tsx src/styles.css
git commit -m "feat(admin): replace order arrows with dnd-kit drag handles"
```

(If the project uses `bun.lock` rather than `package-lock.json`, stage `bun.lock` instead.)

---

## Task 15: Board transition wizard

The flagship feature: a 4-step wizard that archives the outgoing Mesa Directiva and creates the new one in one mutation.

**Files:**

- Create: `src/routes/admin/board-transition.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create the route file with step state and Step 1**

Create `src/routes/admin/board-transition.tsx`:

```tsx
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
  return president?.name ?? outgoing[0]?.name ?? ''
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
```

- [ ] **Step 2: Add wizard styles**

Append to `src/styles.css`:

```css
.admin-wizard {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 28px;
}

.admin-wizard-rail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
}

.admin-wizard-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #6b665b;
}

.admin-wizard-step.is-active {
  background: #0e1717;
  color: #faf8f5;
}

.admin-wizard-step.is-done {
  color: #2a3a3a;
}

.admin-wizard-step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ece7dc;
  color: #4d4940;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.admin-wizard-step.is-active .admin-wizard-step-number {
  background: #faf8f5;
  color: #0e1717;
}

.admin-wizard-step-label {
  font-size: 13px;
  font-weight: 500;
}

.admin-wizard-main {
  min-width: 0;
}

.admin-wizard-step-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 14px;
}

.admin-wizard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.admin-wizard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.admin-card-readonly {
  pointer-events: none;
}

.admin-wizard-roster-row {
  border: 1px solid #e6e1d7;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.admin-wizard-roster-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.admin-wizard-roster-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.admin-wizard-review-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.admin-wizard-warning {
  background: #fff7e0;
  border: 1px solid #f0d99c;
  color: #6b4d00;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.admin-pending-badge {
  color: #b07a00;
  font-weight: 500;
}
```

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: End-to-end test in browser**

Run `npm run dev`. From `/admin`, click "Iniciar transición de mesa". You should see the 4-step wizard. With `team` already seeded (9 directives), Step 1 lists all 9, Step 2 form opens, Step 3 shows 9 pre-populated rows. Fill in just the names of the new president + one or two others, leave the rest with "Llenar después" toggled on. Click confirm in Step 4. Toast appears, you land on `/admin/admins?editId=…` (Task 16 wires the auto-open behavior; for now, the redirect happens but the editor may not auto-open until that task lands — verify visually that "Mesas pasadas" now contains the archived 2025-2026 entry, and `/admin/team` shows the new directives). After verifying, run a `git stash && git checkout HEAD~ -- convex` to restore data if needed, or use the Convex dashboard to revert; otherwise leave the test data as-is.

(If the data is not safe to mutate during testing, branch off Convex by setting up a dev deployment, or test against a freshly seeded local convex deployment.)

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/board-transition.tsx src/styles.css
git commit -m "feat(admin): add 4-step Mesa Directiva transition wizard"
```

---

## Task 16: Auto-open the new past-admin entry after the wizard

The wizard navigates to `/admin/admins` with `editId` in search; this task makes `/admin/admins` honor that param.

**Files:**

- Modify: `src/routes/admin/admins.tsx`

- [ ] **Step 1: Add `validateSearch` to the route**

At the top of `src/routes/admin/admins.tsx`, replace the `Route` definition with:

```tsx
import { z } from 'zod'

const adminsSearchSchema = z.object({
  editId: z.string().optional(),
})

export const Route = createFileRoute('/admin/admins')({
  component: AdminAdminsPage,
  validateSearch: adminsSearchSchema,
})
```

- [ ] **Step 2: Open the editor when `editId` is present**

Inside `AdminAdminsPage`, near the existing `editing` state, add:

```tsx
const search = Route.useSearch()
const navigate = Route.useNavigate()

useEffect(() => {
  if (search.editId && editing === null) {
    setEditing(search.editId)
    navigate({ search: () => ({}), replace: true })
  }
}, [search.editId, editing, navigate])
```

Add `useEffect` to the imports from `react` if not already present.

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser test**

Re-run the wizard end-to-end (or hand-craft the URL `/admin/admins?editId=<an-existing-past-admin-id>`). Confirm the editor opens directly with the matching past-admin doc loaded.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/admins.tsx
git commit -m "feat(admin): open Mesa pasada editor from URL param after transition"
```

---

## Task 17: Section the team form

Use `<FormSection>` to break the long team form into 4 grouped chunks. No logic changes.

**Files:**

- Modify: `src/routes/admin/team.tsx`

- [ ] **Step 1: Import `FormSection`**

Add to the existing field-component import block at the top of `src/routes/admin/team.tsx`:

```tsx
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
```

- [ ] **Step 2: Wrap the existing fields in sections**

Inside `TeamForm`, replace the inner `<form className="admin-form-shell">` body (the part containing all the `<FieldXxx />` calls) with:

```tsx
<FormSection title="Datos básicos">
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
  <FieldBilingualTextarea<TeamFormValues> name="bio" label="Biografía" />
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
```

Keep the `<div className="admin-form-actions">` block with the Cancelar/Guardar buttons exactly as it is.

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser check**

`/admin/team` → Editar a member → confirm 4 visible section frames with the right fields in each.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/team.tsx
git commit -m "refactor(admin): group team form fields under FormSection headings"
```

---

## Task 18: Section the events form

**Files:**

- Modify: `src/routes/admin/events.tsx`

- [ ] **Step 1: Open `src/routes/admin/events.tsx` and add `FormSection` to imports**

Add `FormSection` to the existing import from `@/components/admin/fields`.

- [ ] **Step 2: Group fields**

Wrap the form fields with these sections (preserve all existing field props/order within each section):

- **Datos básicos**: `category`, `title`, `date`, `location`, `isUpcoming` (checkbox).
- **Contenido**: `description`, `imageUrl` (FieldImageUpload).
- **Galería**: `galleryImageUrls` (FieldGallery).
- **Inscripción**: `requiresRegistration` (checkbox), `registrationUrl`.

Open the file, locate the form body inside the events-form component (it follows the same `<form className="admin-form-shell">` shape as team.tsx), and wrap the existing `<Field…>` JSX into the four `<FormSection title="…">…</FormSection>` blocks above. Keep the `admin-form-actions` block at the bottom unchanged.

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser check**

`/admin/events` → editor renders with 4 sections matching the grouping above.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/events.tsx
git commit -m "refactor(admin): group events form fields under FormSection headings"
```

---

## Task 19: Section the research form

**Files:**

- Modify: `src/routes/admin/research.tsx`

- [ ] **Step 1: Add `FormSection` import**

Same pattern as Task 18 — extend the existing `@/components/admin/fields` import.

- [ ] **Step 2: Group fields**

- **Datos básicos**: `title`, `authors` (FieldStringList), `publicationDate`, `url`, `slug`.
- **Contenido**: `description`, `body`, `imageUrl`.
- **Galería**: `galleryImageUrls`.
- **Etiquetas**: `tags`.

Wrap the existing JSX into four `<FormSection>` blocks. Preserve all field props.

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser check**

`/admin/research` → editor renders with 4 sections.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/research.tsx
git commit -m "refactor(admin): group research form fields under FormSection headings"
```

---

## Task 20: Section the labs form

**Files:**

- Modify: `src/routes/admin/labs.tsx`

- [ ] **Step 1: Add `FormSection` import**

Same as prior task.

- [ ] **Step 2: Group fields**

- **Datos básicos**: `title`, `lead`, `location`, `focusAreas`.
- **Contenido**: `summary`, `description`, `imageUrl`.
- **Galería**: `galleryImageUrls`.

Wrap existing JSX into three `<FormSection>` blocks.

- [ ] **Step 3: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Browser check**

`/admin/labs` → editor renders with 3 sections.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/labs.tsx
git commit -m "refactor(admin): group labs form fields under FormSection headings"
```

---

## Task 21: Section the past-admins form + inline image upload in member rows

Two changes in one file: section the form, and replace the per-member `Imagen URL` text input with `FieldImageUpload`.

**Files:**

- Modify: `src/routes/admin/admins.tsx`

- [ ] **Step 1: Extend imports**

Add `FormSection` to the existing `@/components/admin/fields` import.

- [ ] **Step 2: Section the top-level form**

Wrap the top-level fields of the past-admins form with these sections, preserving all field props:

- **Datos básicos**: `period`, `presidentName`, `description`.
- **Foto y galería**: `imageUrl` (FieldImageUpload), `galleryImageUrls` (FieldGallery).
- **Miembros**: the entire existing `<div className="admin-members-section">…</div>` block (which contains the per-member field array and the "Agregar miembro" button) goes inside this section.

- [ ] **Step 3: Replace the per-member URL text input with `FieldImageUpload`**

Inside the `fields.map((field, idx) => …)` block in the past-admins form, replace the existing `Controller` rendering an `Imagen URL` text input (around lines 261–275 of `admins.tsx` before edits) with:

```tsx
<FieldImageUpload<AdminFormValues>
  name={`members.${idx}.imageUrl` as const as keyof AdminFormValues & string}
  label="Foto"
  control={form.control}
/>
```

If the strict typing complains, fall back to:

```tsx
<Controller
  control={form.control}
  name={`members.${idx}.imageUrl`}
  render={({ field: imgField }) => (
    <FieldShellWithUpload
      value={(imgField.value as string | undefined) ?? ''}
      onChange={(v) => imgField.onChange(v)}
    />
  )}
/>
```

…where `FieldShellWithUpload` is a small inline helper appended to `admins.tsx`:

```tsx
import { useMutation } from 'convex/react'
// (already imported earlier in this file)

function FieldShellWithUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const generateUploadUrl = useMutation(api.content.generateUploadUrl)
  const resolveUploadedUrl = useMutation(api.content.resolveUploadedUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    const token = getAdminToken()
    if (!token) return
    setUploading(true)
    setError(null)
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken: token })
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error('Falló la subida')
      const { storageId } = (await res.json()) as { storageId: string }
      const { url } = await resolveUploadedUrl({
        sessionToken: token,
        storageId,
      })
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de subida')
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="admin-field">
      <span className="admin-field-label">Foto</span>
      <div className="admin-image-field">
        {value ? (
          <div className="admin-image-preview">
            <img src={value} alt="" />
            <button
              type="button"
              className="admin-image-clear"
              onClick={() => onChange('')}
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
          onChange={(e) => onChange(e.target.value)}
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
        {error ? <p className="admin-field-error">{error}</p> : null}
      </div>
    </label>
  )
}
```

Prefer the typed `FieldImageUpload` form first; if it fails type-check (because nested `members.N.imageUrl` paths often don't satisfy `FieldImageUpload`'s generic constraints), use the helper above. Keep `useState` imported (already present in the file).

- [ ] **Step 4: Confirm build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Browser check**

`/admin/admins` → Editar a mesa → form shows 3 sections; each member row now has a thumbnail + file picker (file upload writes a Convex storage URL on success). Add a member, upload a photo, save the mesa, reload the page, and confirm the photo persists.

- [ ] **Step 6: Commit**

```bash
git add src/routes/admin/admins.tsx
git commit -m "refactor(admin): section past-admins form, inline image upload per member"
```

---

## Final verification

- [ ] **Step 1: Run all tests**

Run: `npm run test`
Expected: all tests pass (including the new periodInference + bulkImport suites).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Smoke-test the user flows**

Run `npm run dev`. Walk through each entry point in the spec:

1. `/admin` — dashboard renders with stats and CTA.
2. `/admin/team` — chips filter, drag-and-drop reorders, sectioned editor opens.
3. `/admin/team` non-board groups — Importar lista button → modal → preview → commit.
4. `/admin/board-transition` — full 4-step wizard, ending with archived mesa visible at `/admin/admins` (auto-opened) and the new directives at `/admin/team`.
5. `/admin/events`, `/admin/research`, `/admin/labs`, `/admin/admins` — sectioned editors render correctly.

- [ ] **Step 5: Final commit if anything was missed**

If any small fix is required to make the smoke test pass:

```bash
git add -A
git commit -m "fix(admin): polish from final smoke test"
```

If nothing is required, this step is a no-op.
