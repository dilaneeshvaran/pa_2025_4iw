process.env.TZ = 'UTC'

import { TeleconsultationsService } from '../teleconsultations.service'
import prisma from '../../../config/database'
import {
  sendTeleconsultationParticipantJoinedEmail,
  sendPractitionerLateEmail,
  sendAppointmentCancelledByPractitionerEmail,
  sendNoShowEmail,
  sendAutoNoShowPractitionerNotification,
} from '../../../utils/email'
import { scheduleTeleconsultationJoinedEmail } from '../../../utils/teleconsultation-email-scheduler'
import { cancelAppointmentReminders } from '../../../utils/reminder-scheduler'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    appointment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    patient: {
      update: jest.fn(),
    },
    teleconsultationSession: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'room-uuid'),
}))

jest.mock('../../../utils/email', () => ({
  sendTeleconsultationParticipantJoinedEmail: jest.fn().mockResolvedValue(undefined),
  sendNoShowEmail: jest.fn().mockResolvedValue(undefined),
  sendAutoNoShowPractitionerNotification: jest.fn().mockResolvedValue(undefined),
  sendPractitionerAbsentNotification: jest.fn().mockResolvedValue(undefined),
  sendPractitionerLateEmail: jest.fn().mockResolvedValue(undefined),
  sendAppointmentCancelledByPractitionerEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../utils/teleconsultation-email-scheduler', () => ({
  scheduleTeleconsultationJoinedEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../utils/reminder-scheduler', () => ({
  cancelAppointmentReminders: jest.fn().mockResolvedValue(undefined),
}))


const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = sendTeleconsultationParticipantJoinedEmail as jest.MockedFunction<
  typeof sendTeleconsultationParticipantJoinedEmail
>
const mockScheduleEmail = scheduleTeleconsultationJoinedEmail as jest.MockedFunction<
  typeof scheduleTeleconsultationJoinedEmail
>
const mockSendPractitionerLateEmail = sendPractitionerLateEmail as jest.MockedFunction<
  typeof sendPractitionerLateEmail
>
const mockSendAppointmentCancelledByPractitionerEmail = sendAppointmentCancelledByPractitionerEmail as jest.MockedFunction<
  typeof sendAppointmentCancelledByPractitionerEmail
>


describe('TeleconsultationsService - joinSession notifications', () => {
  let service: TeleconsultationsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeleconsultationsService()
  })

  const buildSession = (overrides = {}) => ({
    id: 'session-1',
    appointmentId: 'apt-1',
    patientId: 'patient-1',
    practitionerId: 'practitioner-1',
    roomId: 'room-1',
    roomName: 'room-name-1',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() - 1000),
    patientJoinedAt: null,
    practitionerJoinedAt: null,
    patient: {
      firstName: 'Marie',
      lastName: 'Curie',
      user: {
        id: 'user-patient-1',
        email: 'patient@example.com',
        notificationPreference: { emailNotifications: true },
      },
    },
    practitioner: {
      title: 'Dr.',
      firstName: 'Jean',
      lastName: 'Dupont',
      user: {
        id: 'user-practitioner-1',
        email: 'practitioner@example.com',
        notificationPreference: { emailNotifications: true },
      },
    },
    ...overrides,
  })

  it('devrait notifier le praticien si le patient se connecte en premier', async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-practitioner-1',
        type: 'SYSTEM_ALERT',
        title: 'Patient connecté',
        message: 'Marie Curie a rejoint la téléconsultation.',
        metadata: expect.objectContaining({
          targetPath: '/practitioner/teleconsultations?appointmentId=apt-1',
          appointmentId: 'apt-1',
          teleconsultation: true,
        }),
      }),
    })

    expect(mockSendEmail).toHaveBeenCalledWith('practitioner@example.com', {
      recipientName: 'Dr. Dupont',
      senderName: 'Marie Curie',
      appointmentId: 'apt-1',
      isRecipientPatient: false,
    })
  })

  it('devrait notifier le patient si le praticien se connecte en premier', async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      practitionerJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-practitioner-1')

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-patient-1',
        type: 'SYSTEM_ALERT',
        title: 'Praticien connecté',
        message: 'Votre praticien Dr. Dupont a rejoint la téléconsultation.',
        metadata: expect.objectContaining({
          targetPath: '/patient/teleconsultations?appointmentId=apt-1',
          appointmentId: 'apt-1',
          teleconsultation: true,
        }),
      }),
    })

    expect(mockSendEmail).toHaveBeenCalledWith('patient@example.com', {
      recipientName: 'Marie Curie',
      senderName: 'Dr. Dupont',
      appointmentId: 'apt-1',
      isRecipientPatient: true,
    })
  })

  it('ne devrait pas notifier le praticien si le praticien a déjà rejoint', async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: new Date(),
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('ne devrait pas renvoyer de notification si le patient se reconnecte (patientJoinedAt déjà défini)', async () => {
    const session = buildSession({
      patientJoinedAt: new Date(),
      practitionerJoinedAt: null,
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('ne devrait pas envoyer de mail si le destinataire a désactivé les notifications par email', async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
    })
    session.practitioner.user.notificationPreference.emailNotifications = false

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it("devrait envoyer l'in-app immédiatement mais programmer l'email si le patient rejoint avant l'heure de début de rendez-vous", async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
      scheduledAt: new Date(Date.now() + 5 * 60 * 1000),
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()

    expect(mockScheduleEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'practitioner@example.com',
        recipientName: 'Dr. Dupont',
        senderName: 'Marie Curie',
        appointmentId: 'apt-1',
        isRecipientPatient: false,
      }),
      expect.any(Number)
    )

    const delayArg = mockScheduleEmail.mock.calls[0][1]
    expect(delayArg).toBeGreaterThan(290000)
    expect(delayArg).toBeLessThan(301000)
  })

  it("ne devrait pas envoyer de notification si le patient se connecte après l'heure de fin de rendez-vous (trop tard)", async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
      scheduledAt: new Date(Date.now() - 35 * 60 * 1000),
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

describe('TeleconsultationsService - delaySession and cancelSession', () => {
  let service: TeleconsultationsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeleconsultationsService()
  })

  const buildSession = (overrides = {}) => ({
    id: 'session-1',
    appointmentId: 'apt-1',
    patientId: 'patient-1',
    practitionerId: 'practitioner-1',
    roomId: 'room-1',
    roomName: 'room-name-1',
    status: 'SCHEDULED',
    scheduledAt: new Date(),
    patientJoinedAt: null,
    practitionerJoinedAt: null,
    appointment: {
      appointmentDate: new Date(),
      startTime: '10:00',
    },
    patient: {
      firstName: 'Marie',
      lastName: 'Curie',
      user: {
        id: 'user-patient-1',
        email: 'patient@example.com',
        notificationPreference: { emailNotifications: true },
      },
    },
    practitioner: {
      title: 'Dr.',
      firstName: 'Jean',
      lastName: 'Dupont',
      userId: 'user-practitioner-1',
      user: {
        id: 'user-practitioner-1',
        email: 'practitioner@example.com',
      },
    },
    ...overrides,
  })

  describe('delaySession', () => {
    it('devrait envoyer une notification in-app et un email de retard', async () => {
      const session = buildSession()
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)

      await service.delaySession('session-1', 'user-practitioner-1', 15)

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-patient-1',
            type: 'SYSTEM_ALERT',
            title: 'Retard de votre praticien',
            message: expect.stringContaining('15 minutes'),
          }),
        })
      )

      expect(mockSendPractitionerLateEmail).toHaveBeenCalledWith(
        'patient@example.com',
        expect.objectContaining({
          patientName: 'Marie Curie',
          delayMinutes: 15,
        })
      )

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('devrait lever une erreur si la session n\'existe pas', async () => {
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(null)

      await expect(
        service.delaySession('session-not-found', 'user-practitioner-1', 15)
      ).rejects.toThrow('Session non trouvée')
    })

    it('devrait lever une erreur si le praticien n\'est pas l\'auteur de la consultation', async () => {
      const session = buildSession()
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)

      await expect(
        service.delaySession('session-1', 'user-practitioner-diff', 15)
      ).rejects.toThrow('Non autorisé')
    })
  })

  describe('cancelSession', () => {
    it('devrait annuler la session et le rendez-vous, et notifier le patient', async () => {
      const session = buildSession()
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
      mockPrisma.teleconsultationSession.update.mockResolvedValue({
        ...session,
        status: 'CANCELLED',
      } as any)

      await service.cancelSession('session-1', 'user-practitioner-1', 'Imprévu')

      expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          errorMessage: 'Imprévu',
        }),
      })

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledBy: 'user-practitioner-1',
          cancellationReason: 'Imprévu',
        }),
      })

      expect(cancelAppointmentReminders).toHaveBeenCalledWith('apt-1')

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-patient-1',
            type: 'APPOINTMENT_CANCELLATION',
            title: 'Téléconsultation annulée',
          }),
        })
      )

      expect(mockSendAppointmentCancelledByPractitionerEmail).toHaveBeenCalledWith(
        'patient@example.com',
        expect.objectContaining({
          patientName: 'Marie Curie',
          reason: 'Imprévu',
        })
      )

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('cleanupExpiredSessions', () => {
    const buildSession = (overrides = {}) => ({
      id: 'session-1',
      appointmentId: 'apt-1',
      patientId: 'patient-1',
      practitionerId: 'practitioner-1',
      roomId: 'room-1',
      roomName: 'room-name-1',
      status: 'SCHEDULED',
      scheduledAt: new Date('2026-07-08T09:05:00.000Z'),
      patientJoinedAt: null,
      practitionerJoinedAt: null,
      appointment: {
        id: 'apt-1',
        duration: 5,
        startTime: '09:05',
        endTime: '09:10',
        appointmentDate: new Date('2026-07-08T00:00:00.000Z'),
        reason: 'Consultation',
      },
      patient: {
        id: 'patient-1',
        firstName: 'Marie',
        lastName: 'Curie',
        noShowCount: 0,
        user: {
          id: 'user-patient-1',
          email: 'patient@example.com',
        },
      },
      practitioner: {
        id: 'practitioner-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        title: 'Dr.',
        user: {
          id: 'user-practitioner-1',
          email: 'practitioner@example.com',
        },
      },
      ...overrides,
    })

    it('devrait nettoyer la session si le temps local du client a depasse l heure de fin (avec offset)', async () => {
      const session = buildSession()
      mockPrisma.teleconsultationSession.findMany.mockResolvedValue([session] as any)

      // Supposons que now = 10:00:00 local (offset +02:00 -> -120), donc UTC = 08:00:00.
      // Si on passe offset -120, le temps local du client est de 10:00:00.
      // L'heure de fin du rdv est 09:10:00.
      // Donc le rdv est expire !
      const oldRealDate = global.Date
      const mockNow = new Date('2026-07-08T08:00:00.000Z') // 10:00 AM local (offset +02:00)
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length > 0) {
            super(...args)
            return this
          }
          return mockNow
        }
      } as any

      try {
        await service.cleanupExpiredSessions('-120')

        // Doit mettre a jour la session en FAILED / NO_SHOW (puisque personne n'a rejoint)
        expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'session-1' },
            data: expect.objectContaining({
              status: 'FAILED',
            }),
          })
        )
      } finally {
        global.Date = oldRealDate
      }
    })

    it('ne devrait pas nettoyer la session si le temps local du client n a pas encore depasse l heure de fin', async () => {
      const session = buildSession()
      mockPrisma.teleconsultationSession.findMany.mockResolvedValue([session] as any)

      // Supposons que now = 09:00:00 local (offset +02:00 -> -120), donc UTC = 07:00:00.
      // Si on passe offset -120, le temps local est 09:00:00.
      // L'heure de fin du rdv est 09:10:00.
      // Donc ce n'est pas encore expire !
      const oldRealDate = global.Date
      const mockNow = new Date('2026-07-08T07:00:00.000Z')
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length > 0) {
            super(...args)
            return this
          }
          return mockNow
        }
      } as any

      try {
        await service.cleanupExpiredSessions('-120')

        // Ne doit pas mettre a jour la session car non expiree
        expect(mockPrisma.teleconsultationSession.update).not.toHaveBeenCalled()
      } finally {
        global.Date = oldRealDate
      }
    })
  })
})

describe('TeleconsultationsService - lifecycle', () => {
  let service: TeleconsultationsService

  const patient = {
    id: 'patient-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    user: { id: 'patient-user', email: 'ada@example.test' },
  }

  const practitioner = {
    id: 'practitioner-1',
    firstName: 'Grace',
    lastName: 'Hopper',
    title: 'Dr',
    user: { id: 'practitioner-user', email: 'grace@example.test' },
  }

  const buildSession = (overrides: Record<string, unknown> = {}) => ({
    id: 'session-1',
    appointmentId: 'appointment-1',
    patientId: patient.id,
    practitionerId: practitioner.id,
    roomId: 'room-1',
    roomName: 'telecons-room',
    status: 'SCHEDULED',
    scheduledAt: new Date('2026-07-08T10:00:00.000Z'),
    startedAt: null,
    endedAt: null,
    duration: null,
    connectionQuality: null,
    patientJoinedAt: null,
    practitionerJoinedAt: null,
    appointment: {
      id: 'appointment-1',
      appointmentDate: new Date('2026-07-08T00:00:00.000Z'),
      startTime: '10:00',
      endTime: '10:30',
      reason: 'Suivi',
      status: 'CONFIRMED',
      duration: 30,
    },
    patient,
    practitioner,
    ...overrides,
  })

  beforeEach(() => {
    service = new TeleconsultationsService()
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-07-08T09:55:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('createSession', () => {
    it('rejette un rendez-vous inexistant', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null)

      await expect(service.createSession('missing')).rejects.toThrow(
        'Rendez-vous non trouvé',
      )
    })

    it("rejette un rendez-vous qui n'est pas une téléconsultation", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-1',
        type: 'IN_PERSON',
        teleconsultationSession: null,
      } as any)

      await expect(service.createSession('appointment-1')).rejects.toThrow(
        "Ce rendez-vous n'est pas une téléconsultation",
      )
    })

    it('retourne la session existante si elle existe déjà', async () => {
      const existing = buildSession()
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-1',
        type: 'TELECONSULTATION',
        teleconsultationSession: existing,
      } as any)

      await expect(service.createSession('appointment-1')).resolves.toBe(existing)
      expect(mockPrisma.teleconsultationSession.create).not.toHaveBeenCalled()
    })

    it('crée une session planifiée à partir du rendez-vous', async () => {
      const created = buildSession({ roomId: 'room-uuid' })
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-1',
        type: 'TELECONSULTATION',
        patientId: patient.id,
        practitionerId: practitioner.id,
        appointmentDate: new Date('2026-07-08T00:00:00.000Z'),
        startTime: '10:15',
        teleconsultationSession: null,
      } as any)
      mockPrisma.teleconsultationSession.create.mockResolvedValue(created as any)

      const result = await service.createSession('appointment-1')

      expect(result).toBe(created)
      expect(mockPrisma.teleconsultationSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: 'appointment-1',
          patientId: patient.id,
          practitionerId: practitioner.id,
          roomId: 'room-uuid',
          status: 'SCHEDULED',
          scheduledAt: new Date('2026-07-08T10:15:00.000Z'),
        }),
      })
    })
  })

  describe('joinSession', () => {
    it("rejette un utilisateur qui n'est ni patient ni praticien de la session", async () => {
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(
        buildSession() as any,
      )
      mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)

      await expect(service.joinSession('session-1', 'other-user')).rejects.toThrow(
        'Non autorisé',
      )
    })

    it('passe une session SCHEDULED en WAITING au premier participant', async () => {
      const updated = buildSession({
        status: 'WAITING',
        patientJoinedAt: new Date('2026-07-08T09:55:00.000Z'),
      })
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(
        buildSession() as any,
      )
      mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
      mockPrisma.teleconsultationSession.update.mockResolvedValue(updated as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      const result = await service.joinSession('session-1', 'patient-user')

      expect(result).toBe(updated)
      expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          patientJoinedAt: new Date('2026-07-08T09:55:00.000Z'),
          status: 'WAITING',
        }),
      })
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'patient-user',
          metadata: { event: 'joined', role: 'patient' },
        }),
      })
    })

    it('passe en IN_PROGRESS quand le second participant rejoint', async () => {
      const base = buildSession({
        status: 'WAITING',
        patientJoinedAt: new Date('2026-07-08T09:50:00.000Z'),
      })
      const updated = buildSession({
        status: 'WAITING',
        patientJoinedAt: base.patientJoinedAt,
        practitionerJoinedAt: new Date('2026-07-08T09:55:00.000Z'),
      })
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(base as any)
      mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
      mockPrisma.teleconsultationSession.update.mockResolvedValue(updated as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      await service.joinSession('session-1', 'practitioner-user')

      expect(mockPrisma.teleconsultationSession.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'session-1' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date('2026-07-08T09:55:00.000Z'),
          waitingRoomTime: 300,
        },
      })
    })

    it('réinitialise une session terminée pour permettre une reconnexion', async () => {
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(
        buildSession({ status: 'COMPLETED', endedAt: new Date() }) as any,
      )
      mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
      mockPrisma.teleconsultationSession.update.mockResolvedValue(
        buildSession({ status: 'WAITING' }) as any,
      )
      mockPrisma.appointment.update.mockResolvedValue({} as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      await service.joinSession('session-1', 'patient-user')

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: {
          status: 'CONFIRMED',
          markedAsNoShow: false,
          noShowMarkedAt: null,
        },
      })
    })
  })

  describe('endSession et no-show', () => {
    it('termine une session et journalise la durée', async () => {
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(
        buildSession({
          status: 'IN_PROGRESS',
          startedAt: new Date('2026-07-08T09:40:00.000Z'),
        }) as any,
      )
      mockPrisma.teleconsultationSession.update.mockResolvedValue(
        buildSession({ status: 'COMPLETED', duration: 15 }) as any,
      )
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      const result = await service.endSession('session-1', 'patient-user')

      expect(result.status).toBe('COMPLETED')
      expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          duration: 15,
        }),
      })
    })

    it('marque un patient absent quand le praticien signale le no-show', async () => {
      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(
        buildSession() as any,
      )
      mockPrisma.teleconsultationSession.update.mockResolvedValue(
        buildSession({ status: 'NO_SHOW' }) as any,
      )
      mockPrisma.appointment.update.mockResolvedValue({} as any)
      mockPrisma.auditLog.create.mockResolvedValue({} as any)

      await service.markNoShow('session-1', 'practitioner-user')

      expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'NO_SHOW',
          errorMessage: 'Patient absent (no-show)',
        }),
      })
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: expect.objectContaining({
          status: 'NO_SHOW',
          markedAsNoShow: true,
        }),
      })
    })
  })

  describe('listes et nettoyage', () => {
    it('filtre les sessions du jour du praticien et formate la réponse', async () => {
      mockPrisma.teleconsultationSession.findMany.mockResolvedValue([
        buildSession(),
      ] as any)

      const result = await service.getTodaySessions('practitioner-1')

      expect(result).toEqual([
        expect.objectContaining({
          id: 'session-1',
          patientName: 'Ada Lovelace',
          scheduledAt: '2026-07-08T10:00:00.000Z',
          status: 'SCHEDULED',
        }),
      ])
      expect(mockPrisma.teleconsultationSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            practitionerId: 'practitioner-1',
            scheduledAt: {
              gte: new Date('2026-07-08T00:00:00.000Z'),
              lt: new Date('2026-07-09T00:00:00.000Z'),
            },
          }),
        }),
      )
    })

    it('construit les filtres de recherche et pagination pour l\'historique', async () => {
      mockPrisma.teleconsultationSession.findMany.mockResolvedValue([] as any)
      mockPrisma.teleconsultationSession.count.mockResolvedValue(12 as any)

      const result = await service.getHistory(
        'practitioner-1',
        2,
        5,
        'ada',
        'COMPLETED',
        '2026-07-01',
        '2026-07-08',
      )

      expect(result).toEqual({ data: [], total: 12, page: 2, limit: 5, totalPages: 3 })
      expect(mockPrisma.teleconsultationSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            practitionerId: 'practitioner-1',
            status: 'COMPLETED',
            patient: {
              OR: [
                { firstName: { contains: 'ada', mode: 'insensitive' } },
                { lastName: { contains: 'ada', mode: 'insensitive' } },
              ],
            },
          }),
          skip: 5,
          take: 5,
        }),
      )
    })

    it('nettoie une session expirée où le patient est absent et notifie les parties', async () => {
      jest.setSystemTime(new Date('2026-07-08T11:00:00.000Z'))
      mockPrisma.teleconsultationSession.findMany
        .mockResolvedValueOnce([
          buildSession({
            status: 'WAITING',
            practitionerJoinedAt: new Date('2026-07-08T09:55:00.000Z'),
            patient: { ...patient, noShowCount: 2 },
          }),
        ] as any)
        .mockResolvedValueOnce([] as any)
      mockPrisma.teleconsultationSession.update.mockResolvedValue({} as any)
      mockPrisma.appointment.update.mockResolvedValue({} as any)
      mockPrisma.patient.update.mockResolvedValue({} as any)

      await service.cleanupExpiredSessions()

      expect(mockPrisma.teleconsultationSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'NO_SHOW',
          errorMessage:
            'Patient absent - absence détectée automatiquement par le système',
        }),
      })
      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { id: patient.id },
        data: { noShowCount: { increment: 1 } },
      })
      expect(sendNoShowEmail).toHaveBeenCalledWith(
        'ada@example.test',
        expect.objectContaining({ noShowCount: 3 }),
      )
      expect(sendAutoNoShowPractitionerNotification).toHaveBeenCalled()
    })
  })
})
