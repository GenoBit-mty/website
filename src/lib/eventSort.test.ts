import { describe, expect, it } from 'vitest'
import { dateKey, partitionEvents } from './eventSort'

type TestEvent = { _id: string; date: string; isUpcoming: boolean }

describe('dateKey', () => {
  it('extracts YYYY-MM-DD prefix', () => {
    expect(dateKey('2026-05-12 · 18:00')).toBe('2026-05-12')
  })

  it('returns the input untouched when shorter than 10 chars', () => {
    expect(dateKey('2026')).toBe('2026')
  })
})

describe('partitionEvents', () => {
  const events: TestEvent[] = [
    { _id: 'a', date: '2026-07-18 · 09:00', isUpcoming: true },
    { _id: 'b', date: '2026-05-12 · 18:00', isUpcoming: true },
    { _id: 'c', date: '2026-06-03 · 19:30', isUpcoming: true },
    { _id: 'd', date: '2026-03-22 · 17:00', isUpcoming: false },
    { _id: 'e', date: '2025-11-08 · 16:00', isUpcoming: false },
    { _id: 'f', date: '2026-02-14 · 10:00', isUpcoming: false },
  ]

  it('splits into upcoming and past arrays', () => {
    const { upcoming, past } = partitionEvents(events)
    expect(upcoming.map((e) => e._id)).toEqual(['b', 'c', 'a'])
    expect(past.map((e) => e._id)).toEqual(['d', 'f', 'e'])
  })

  it('sorts upcoming soonest-first', () => {
    const { upcoming } = partitionEvents(events)
    expect(upcoming[0]._id).toBe('b')
  })

  it('sorts past most-recent-first', () => {
    const { past } = partitionEvents(events)
    expect(past[0]._id).toBe('d')
  })

  it('handles empty arrays', () => {
    expect(partitionEvents([])).toEqual({ upcoming: [], past: [] })
  })
})
