/** Extracts the YYYY-MM-DD prefix from an ISO-prefixed date string. */
export function dateKey(s: string): string {
  return s.length >= 10 ? s.slice(0, 10) : s
}

/** Splits events into upcoming (asc) and past (desc). Requires `date` to start with YYYY-MM-DD. */
export function partitionEvents<T extends { date: string; isUpcoming?: boolean }>(
  events: ReadonlyArray<T>,
): { upcoming: Array<T>; past: Array<T> } {
  const upcoming: Array<T> = []
  const past: Array<T> = []
  for (const e of events) {
    if (e.isUpcoming) upcoming.push(e)
    else past.push(e)
  }
  upcoming.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
  past.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
  return { upcoming, past }
}
