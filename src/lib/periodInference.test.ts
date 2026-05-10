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
