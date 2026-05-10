import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STATUSES,
  CAREERS,
  GROUPS,
  SEMESTERS,
  STUDENT_COMMUNITY_SUB_AREAS,
  applicationToCsvRow,
  isTerminalStatus,
  subAreaRequired,
} from './applications'

describe('subAreaRequired', () => {
  it('returns true only for student-community', () => {
    expect(subAreaRequired('student-community')).toBe(true)
    expect(subAreaRequired('ndrg')).toBe(false)
    expect(subAreaRequired('proteomics')).toBe(false)
  })
})

describe('isTerminalStatus', () => {
  it('returns true for accepted and rejected', () => {
    expect(isTerminalStatus('accepted')).toBe(true)
    expect(isTerminalStatus('rejected')).toBe(true)
  })

  it('returns false for active pipeline states', () => {
    expect(isTerminalStatus('new')).toBe(false)
    expect(isTerminalStatus('under_review')).toBe(false)
    expect(isTerminalStatus('contacted')).toBe(false)
    expect(isTerminalStatus('interview_scheduled')).toBe(false)
  })
})

describe('constants', () => {
  it('exposes the six application statuses in order', () => {
    expect(APPLICATION_STATUSES).toEqual([
      'new',
      'under_review',
      'contacted',
      'interview_scheduled',
      'accepted',
      'rejected',
    ])
  })

  it('exposes the three top-level groups', () => {
    expect(GROUPS).toEqual(['ndrg', 'proteomics', 'student-community'])
  })

  it('exposes the seven student-community sub-areas', () => {
    expect(STUDENT_COMMUNITY_SUB_AREAS).toEqual([
      'research',
      'finance',
      'logistics',
      'marketing',
      'social-responsibility',
      'education',
      'it-web',
    ])
  })

  it('exposes career codes including Other', () => {
    expect(CAREERS).toContain('IBT')
    expect(CAREERS).toContain('ITC')
    expect(CAREERS).toContain('IDM')
    expect(CAREERS).toContain('Other')
  })

  it('exposes ten numbered semesters plus a graduate marker', () => {
    expect(SEMESTERS).toHaveLength(11)
    expect(SEMESTERS[0]).toBe('1')
    expect(SEMESTERS[9]).toBe('10')
    expect(SEMESTERS[10]).toBe('graduate')
  })
})

describe('applicationToCsvRow', () => {
  it('serializes an application to the documented column order', () => {
    const row = applicationToCsvRow({
      _id: 'abc',
      submittedAt: 1736208000000, // 2025-01-07T00:00:00Z
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+52 81 1234 5678',
      career: 'ITC',
      careerOther: undefined,
      semester: '5',
      university: 'Tec de Monterrey',
      group: 'student-community',
      subArea: 'it-web',
      motivation: 'I want to build things.',
      linkedinUrl: 'https://linkedin.com/in/ada',
      githubUrl: undefined,
      acceptsContact: true,
      locale: 'en',
      status: 'new',
      assigneeName: undefined,
      adminNotes: undefined,
    })
    expect(row).toEqual([
      'abc',
      '2025-01-07T00:00:00.000Z',
      'Ada Lovelace',
      'ada@example.com',
      '+52 81 1234 5678',
      'ITC',
      '',
      '5',
      'Tec de Monterrey',
      'student-community',
      'it-web',
      'I want to build things.',
      'https://linkedin.com/in/ada',
      '',
      'true',
      'en',
      'new',
      '',
      '',
    ])
  })

  it('falls back to careerOther column when career is Other', () => {
    const row = applicationToCsvRow({
      _id: 'x',
      submittedAt: 0,
      fullName: 'X',
      email: 'x@x.com',
      phone: '0',
      career: 'Other',
      careerOther: 'Architecture',
      semester: '1',
      university: 'Tec de Monterrey',
      group: 'ndrg',
      subArea: undefined,
      motivation: 'm',
      linkedinUrl: undefined,
      githubUrl: undefined,
      acceptsContact: true,
      locale: 'es',
      status: 'new',
      assigneeName: undefined,
      adminNotes: undefined,
    })
    expect(row[5]).toBe('Other')
    expect(row[6]).toBe('Architecture')
    expect(row[10]).toBe('')
  })
})
