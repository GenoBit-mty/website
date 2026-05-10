export type Lang = 'es' | 'en'

export type Bilingual = { es: string; en: string }

export function tField(field: Bilingual | undefined, lang: Lang): string {
  if (!field) return ''
  return field[lang] || field.es || field.en || ''
}
