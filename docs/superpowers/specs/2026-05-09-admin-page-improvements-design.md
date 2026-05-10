# Admin Page Improvements — Design

**Date:** 2026-05-09
**Status:** Approved by user, ready for implementation plan

## Goal

Make the admin section intuitive enough that a future non-technical board member (e.g. the next Marketing Director) can swap themselves in without breaking the public site, while still being fast for the developer (Eduardo) to operate annually. The triggering use case is the yearly Mesa Directiva turnover, but the polish applies across the whole admin section.

## Audience

Mixed:
- Developer (Eduardo) handles annual heavy lifting (board archival) and initial setup.
- Future non-technical board members handle day-to-day edits.

## Scope

**In scope**
- One-click board transition wizard for Mesa Directiva.
- Bulk-roster import for the three non-board groups (NDRG / Proteomics / Student Community).
- Schema upgrade so archived board members keep full profile fidelity.
- Admin dashboard at `/admin` (replaces the redirect to `/admin/team`).
- Sectioned forms across all admin pages (team / events / research / labs / past admins).
- Drag-and-drop reorder for the team list.
- Group-filter chips on the team list.
- Inline image upload for per-member photos in the past-admins form.

**Out of scope (deferred)**
- "Confirm by typing" destructive-action dialogs.
- Better empty-state copy.
- Public-facing past-admin detail pages (the schema change enables them, but rendering is not in this spec).
- Auto-translation of bilingual fields.
- A wizard for the non-board groups (research-group rosters don't have a single yearly cutover; bulk import is enough).

## Section 1 — Schema changes (Convex)

Extend `pastAdministrations.members` so each archived member stores everything a current `teamMembers` record stores (minus `order` and `group`, which don't apply to a frozen archive):

```ts
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
)
```

All new fields are optional, so existing `pastAdministrations` documents stay valid without migration. Convex's schema validator allows the additive change directly.

## Section 2 — `/admin` dashboard

Replace the current `redirect → /admin/team` with a real landing page.

**Layout**

- Page title `GenoBit · Admin`.
- Hero row with the current period (`Periodo actual: 2025-2026`) on the left and a primary CTA `[ Iniciar transición de mesa → ]` on the right. The CTA links to `/admin/board-transition` (Section 3).
- A 3×2 grid of tile cards, one per admin section: Equipo, Eventos, Investigación, Labs, Mesas pasadas. Each tile shows:
  - Section name.
  - One or two lines of stat counts derived from the existing Convex queries (e.g. `9 directivos · 13 NDRG · 6 Proteomics · 9 Community` for Equipo; `3 próximos · 8 pasados` for Eventos).
  - A `→ Gestionar` link to the section's existing route.

**Sidebar nav**

The existing sidebar gains a top "Inicio" link pointing at `/admin`. The other links (`Equipo / Eventos / Investigación / Labs / Mesas pasadas`) stay in their current order.

**Period detection**

"Current period" is read from the most-frequent `tenure` value among `teamMembers` whose `group === "directives"`. If no directives have a `tenure`, the dashboard shows `Periodo actual: —` and the wizard's outgoing-period field becomes a free text input.

## Section 3 — Board Transition Wizard

### Entry point

`/admin/board-transition`. Linked from the dashboard hero CTA. The wizard is a single page with a left progress rail (Steps 1-4). All state lives client-side until Step 4 commits.

### Step 1 — Confirm outgoing period

- Read-only grid of the 9 outgoing directives (photo + name + role) sourced from `teamMembers` where `group === "directives"`. Sorted by their existing `order`.
- Two text inputs:
  - **Periodo saliente** — defaults to the auto-detected current period. Editable in case the data has drifted.
  - **Periodo entrante** — defaults to the next period inferred by incrementing both years (`2025-2026` → `2026-2027`). Editable.
- Footer: `[Cancelar] [Continuar →]`. Cancel returns to `/admin`.

### Step 2 — Period metadata

Form for the `pastAdministrations` document being created. All fields optional except what already is required by the existing schema (`period`, `presidentName`).

- **Foto grupal** — `FieldImageUpload`, becomes the `imageUrl` on the new past-admin doc.
- **Descripción ES / EN** — bilingual textarea, becomes `description`.
- **Galería** — `FieldGallery`, becomes `galleryImageUrls`.
- `presidentName` is auto-filled from whichever outgoing directive has Spanish role exactly equal to `Presidente` or `Presidenta` (case-insensitive). If no match, falls back to the first outgoing directive's name and surfaces a small inline warning so the user can fix it before continuing.
- `period` is the **outgoing** period from Step 1.

Footer: `[← Atrás] [Continuar →]`.

### Step 3 — Set up the new board

Renders one row per outgoing role slot, in the same order. Each row:

- **Rol ES / EN** — pre-filled from the outgoing directive in that slot, editable in case the org renames a position.
- **Nombre** *(required unless "Skip — fill later" is on)*.
- **Carrera** *(optional)*.
- **Email / LinkedIn / GitHub** *(optional)*.
- **Foto** *(optional, `FieldImageUpload`)*.
- A **"Skip — fill later"** toggle on the right of the row. When on, only `name` and `role` are required; the slot still creates a `teamMembers` doc with placeholder data so the public site has the right number of directives. Toggling skip greys out the optional fields.

The user can also **add a slot** (button below the rows) or **remove a slot** (× per row) if the new board has a different headcount than the outgoing one. Removing a slot does not affect archival of the corresponding outgoing directive.

Footer: `[← Atrás] [Revisar →]`.

### Step 4 — Review & commit

Two columns:
- **Archivando** — list of the 9 outgoing directives (photo, name, role).
- **Creando** — list of the new directives from Step 3 (photo if provided, name, role, "(pendiente)" badge for any slot in skip mode).

Below: a yellow caution panel.

> Esto creará la mesa pasada **2025-2026** y reemplazará los **9** directivos actuales con la nueva mesa **2026-2027**. Esta acción no se puede deshacer fácilmente.

Primary button: `[ ✓ Confirmar transición ]` (disabled while submitting).

### Commit mutation

A single Convex mutation `team.transitionBoard` runs all writes inside one transaction:

1. Read all `teamMembers` where `group === "directives"`.
2. Insert a new `pastAdministrations` document with:
   - `period` = outgoing period.
   - `presidentName`, `description`, `imageUrl`, `galleryImageUrls` from Step 2.
   - `members` = full snapshots of the outgoing directives (every field allowed by the new schema in Section 1).
3. Delete each outgoing `teamMembers` document.
4. For each row in the incoming board (Step 3), insert a `teamMembers` document with:
   - `group: "directives"`.
   - `tenure` = incoming period.
   - `isFirstBoard: false`.
   - `order` = the slot index, so the new board renders in the same order the user typed.
   - All optional fields filled if the user provided them.

The mutation returns `{ pastAdminId }`. The UI shows a success toast and navigates to `/admin/admins` with the editor for the new past-admin doc opened (the existing `editing` state in `admins.tsx` accepts an id; the wizard sets it via a router state field on navigation).

### Failure mode

If the mutation throws, the wizard stays on Step 4 with the error toast. Because Convex mutations are atomic, no partial state is possible.

## Section 4 — Bulk roster import

### Entry point

On `/admin/team`, each of the three non-board group sections (NDRG, Proteomics, Student Community) gets a secondary button next to "+ Nuevo miembro": `Importar lista`. Mesa Directiva does **not** get this button (its flow is the wizard).

### Modal

Title: `Importar lista — <group label>`.

Body:

- Instruction text: `Pega una persona por línea, en formato:`
- Format guide: `Nombre | Rol ES | Rol EN | Carrera (opcional)`
- Worked example.
- A large monospace `<textarea>`.

Footer: `[Cancelar] [Vista previa →]`.

### Preview & commit

`Vista previa` parses the textarea client-side:

- Trim each line.
- Skip blank lines and lines starting with `#`.
- Split on `|` and trim each field.
- A row is valid if it has 3 or 4 non-empty fields.

The preview replaces the textarea with a table:

| # | Nombre | Rol ES | Rol EN | Carrera | Estado |
| - | ------ | ------ | ------ | ------- | ------ |
| 1 | …      | …      | …      | …       | ✓      |
| 2 | …      | (vacío) | …     | —       | ✗ Rol ES requerido |

If any rows are invalid, the commit button is disabled and the user is sent back to fix them (button changes to `← Editar`).

When all rows are valid, footer becomes `[← Editar] [Crear N miembros]`. Clicking calls a Convex mutation `team.bulkCreate({ group, rows })` which:

- Reads the maximum existing `order` value across all team members.
- Inserts each row as a `teamMembers` doc with `group: <argument>`, `name/role/career` from the row, `order` continuing from `max + 1, max + 2, …`.

The mutation is purely additive — no existing members are touched. On success the modal closes, a toast says `N miembros añadidos`, and the new members appear at the bottom of the group's section in the list.

## Section 5 — Form & list polish

### 5a. Sectioned forms

Introduce a small `<FormSection title>` component (no library, just a `<fieldset>`-like wrapper with a heading and consistent spacing).

**Team form (`/admin/team` editor)**:
- Datos básicos — nombre, rol, grupo, carrera, gestión, primera mesa directiva.
- Perfil — foto principal, biografía.
- Galería — gallery field.
- Contacto y orden — email, LinkedIn, GitHub, orden.

**Events form**:
- Datos básicos — categoría, título, fecha, lugar, próximo evento.
- Contenido — descripción, foto principal.
- Galería.
- Inscripción — requiere registro, URL.

**Research form**:
- Datos básicos — título, autores, fecha de publicación, URL externa, slug.
- Contenido — descripción, cuerpo, foto principal.
- Galería.
- Etiquetas.

**Labs form**:
- Datos básicos — título, lead, ubicación, áreas de enfoque.
- Contenido — resumen, descripción, foto principal.
- Galería.

**Past-admins form**:
- Datos básicos — periodo, presidente, descripción.
- Foto y galería.
- Miembros — the existing per-member array editor (now with image upload — see 5e).

All sections are expanded by default. They are visual groupings only; no collapse/expand interaction in this spec. (Collapsibility can be added later without changing the data model.)

### 5b. Drag-and-drop reorder

Add `@dnd-kit/core` and `@dnd-kit/sortable`. Each member card on `/admin/team` gets a left-side drag handle (`⋮⋮` icon). Dragging within a group reorders members; cross-group dragging is disabled (each group is its own sortable context).

A new `team.setOrder({ sessionToken, group, orderedIds })` mutation writes fresh `order` values for the entire group in one transaction. The existing `team.reorder` mutation is removed (no remaining callers once the arrows are gone). The arrows are removed; dnd-kit's built-in keyboard sensor (Space to pick up, arrow keys to move, Space to drop) covers the accessibility case.

### 5c. Group filter chips

Above the existing search input on `/admin/team`, a row of filter chips:

```
[ Todos · 37 ]  [ Mesa Directiva · 9 ]  [ NDRG · 13 ]  [ Proteomics · 6 ]  [ Community · 9 ]
```

Counts come from the same `members` array already in client state. The active chip filters which groups render below.

State persists in the URL via the `group` search param (`/admin/team?group=ndrg`). When `group` is unset, all groups render (current behavior).

### 5e. Inline image upload in past-admins member rows

Replace the plain text `Imagen URL` input in each member row of the past-admins form with the same `FieldImageUpload` component used by the team form. The wizard from Section 3 produces archived-member records with proper Convex-storage URLs, so this primarily helps when editing legacy past-admin entries by hand.

## Files affected

- `convex/schema.ts` — extend `pastAdministrations.members`.
- `convex/team.ts` — add `transitionBoard`, `bulkCreate`, `setOrder` (or extend `reorder`).
- `convex/pastAdmin.ts` — accept the wider `members` shape on create/update.
- `src/routes/admin.tsx` — add `Inicio` to sidebar nav.
- `src/routes/admin/index.tsx` — replace the redirect with the dashboard component.
- `src/routes/admin/board-transition.tsx` — **new**, the wizard.
- `src/routes/admin/team.tsx` — group-filter chips, drag-and-drop, sectioned form, bulk-import button + modal.
- `src/routes/admin/admins.tsx` — sectioned form, inline image upload in member rows.
- `src/routes/admin/events.tsx`, `research.tsx`, `labs.tsx` — sectioned forms.
- `src/components/admin/fields.tsx` — add `<FormSection>` wrapper.
- `src/components/admin/BulkImportModal.tsx` — **new**.
- `src/styles.css` — styles for dashboard tiles, wizard rail, drag handles, filter chips, form sections.
- `package.json` — add `@dnd-kit/core` and `@dnd-kit/sortable`.

## Risks

- **Bilingual content burden in the wizard.** Step 3 still requires bilingual roles (ES + EN) for every new directive, which is realistic friction for non-tech users. Mitigation: roles default to the outgoing slot's roles, so the common case (same position name year-over-year) is zero typing. Out of scope to add auto-translation here.
- **Drag-and-drop on touch devices.** dnd-kit's `TouchSensor` handles iPad, but the admin section is desktop-first. Acceptable.
- **Atomicity of `transitionBoard`.** Convex mutations are transactional; a partial failure is not possible. The mutation's read-then-write pattern is safe under Convex's serializable execution model.
