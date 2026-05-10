export function normalizeExternalUrl(input: string | undefined | null): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:|^tel:/i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/+/, '')}`
}
