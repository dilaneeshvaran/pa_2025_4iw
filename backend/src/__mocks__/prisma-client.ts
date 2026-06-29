// Mock manuel du client Prisma généré - utilisé en environnement de test
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
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const

export const NotificationType = {
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMATION: 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION: 'APPOINTMENT_CANCELLATION',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  DOCUMENT_SHARED: 'DOCUMENT_SHARED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  CAMPAIGN_MESSAGE: 'CAMPAIGN_MESSAGE',
  HEALTH_REMINDER: 'HEALTH_REMINDER',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const

export const HealthReminderStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const

export const HealthReminderRecurrenceType = {
  INTERVAL: 'INTERVAL',
  WEEKDAYS: 'WEEKDAYS',
} as const

export const HealthReminderIntervalUnit = {
  DAY: 'DAY',
  WEEK: 'WEEK',
} as const

export const HealthReminderDurationUnit = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
} as const

export class PrismaClientKnownRequestError extends Error {
  code: string
  clientVersion: string
  constructor(message: string, { code, clientVersion }: { code: string; clientVersion: string }) {
    super(message)
    this.name = 'PrismaClientKnownRequestError'
    this.code = code
    this.clientVersion = clientVersion
  }
}

export class PrismaClientUnknownRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrismaClientUnknownRequestError'
  }
}

export class PrismaClientRustPanicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrismaClientRustPanicError'
  }
}

export class PrismaClientInitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrismaClientInitializationError'
  }
}

export class PrismaClientValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrismaClientValidationError'
  }
}

export class Decimal {
  constructor(public value: number | string) {}
}

export const Prisma = {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  Decimal,
}

export const PrismaClient = jest.fn().mockImplementation(() => ({}))

