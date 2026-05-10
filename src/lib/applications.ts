export const APPLICATION_STATUSES = [
  'new',
  'under_review',
  'contacted',
  'interview_scheduled',
  'accepted',
  'rejected',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const TERMINAL_STATUSES: ReadonlyArray<ApplicationStatus> = [
  'accepted',
  'rejected',
]

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export const GROUPS = ['ndrg', 'proteomics', 'student-community'] as const
export type ApplicationGroup = (typeof GROUPS)[number]

export const STUDENT_COMMUNITY_SUB_AREAS = [
  'research',
  'finance',
  'logistics',
  'marketing',
  'social-responsibility',
  'education',
  'it-web',
] as const
export type StudentCommunitySubArea =
  (typeof STUDENT_COMMUNITY_SUB_AREAS)[number]

export function subAreaRequired(group: ApplicationGroup): boolean {
  return group === 'student-community'
}

export const CAREERS = [
  'IBT',
  'ITC',
  'IDM',
  'MC',
  'MSc BI',
  'Other',
] as const
export type Career = (typeof CAREERS)[number]

export const SEMESTERS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'graduate',
] as const
export type Semester = (typeof SEMESTERS)[number]

export type Application = {
  _id: string
  submittedAt: number
  fullName: string
  email: string
  phone: string
  career: Career
  careerOther?: string
  semester: Semester
  university: string
  group: ApplicationGroup
  subArea?: StudentCommunitySubArea
  motivation: string
  linkedinUrl?: string
  githubUrl?: string
  acceptsContact: boolean
  locale: 'es' | 'en'
  status: ApplicationStatus
  assigneeName?: string
  adminNotes?: string
}

export const CSV_COLUMNS = [
  'id',
  'submittedAt',
  'fullName',
  'email',
  'phone',
  'career',
  'careerOther',
  'semester',
  'university',
  'group',
  'subArea',
  'motivation',
  'linkedinUrl',
  'githubUrl',
  'acceptsContact',
  'locale',
  'status',
  'assigneeName',
  'adminNotes',
] as const

export function applicationToCsvRow(app: Application): Array<string> {
  return [
    app._id,
    new Date(app.submittedAt).toISOString(),
    app.fullName,
    app.email,
    app.phone,
    app.career,
    app.careerOther ?? '',
    app.semester,
    app.university,
    app.group,
    app.subArea ?? '',
    app.motivation,
    app.linkedinUrl ?? '',
    app.githubUrl ?? '',
    String(app.acceptsContact),
    app.locale,
    app.status,
    app.assigneeName ?? '',
    app.adminNotes ?? '',
  ]
}
