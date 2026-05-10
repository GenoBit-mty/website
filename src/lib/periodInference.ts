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
