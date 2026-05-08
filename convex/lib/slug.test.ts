import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips diacritics', () => {
    expect(slugify('Detección de variantes')).toBe('deteccion-de-variantes')
  })

  it('removes punctuation and collapses repeats', () => {
    expect(slugify('Foo!! ---  Bar??')).toBe('foo-bar')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  -hello-  ')).toBe('hello')
  })

  it('keeps numbers and hyphens', () => {
    expect(slugify('NGS-2026 v1')).toBe('ngs-2026-v1')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})
