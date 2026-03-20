// Mock manuel du client Prisma généré — utilisé en environnement de test
// quand le client Prisma n'a pas été généré (npx prisma generate)

export const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
} as const

export const AppointmentType = {
  IN_PERSON: 'IN_PERSON',
  TELECONSULTATION: 'TELECONSULTATION',
} as const

export const UserRole = {
  PATIENT: 'PATIENT',
  PRACTITIONER: 'PRACTITIONER',
  STAFF: 'STAFF',
  CABINET_ADMIN: 'CABINET_ADMIN',
  ADMIN: 'ADMIN',
} as const

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOCKED: 'LOCKED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const

export const PrismaClient = jest.fn().mockImplementation(() => ({}))
