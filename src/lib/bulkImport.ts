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
