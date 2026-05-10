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
