import { TeleconsultationsService } from '../teleconsultations.service'
import prisma from '../../../config/database'
import {
  sendTeleconsultationParticipantJoinedEmail,
  sendPractitionerLateEmail,
  sendAppointmentCancelledByPractitionerEmail,
} from '../../../utils/email'
import { scheduleTeleconsultationJoinedEmail } from '../../../utils/teleconsultation-email-scheduler'
import { cancelAppointmentReminders } from '../../../utils/reminder-scheduler'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    teleconsultationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/email', () => ({
  sendTeleconsultationParticipantJoinedEmail: jest.fn().mockResolvedValue(undefined),
  sendNoShowEmail: jest.fn(),
  sendAutoNoShowPractitionerNotification: jest.fn(),
  sendPractitionerAbsentNotification: jest.fn(),
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
    scheduledAt: new Date(Date.now() - 1000), // scheduled 1 second ago (definitely within the 30-min duration)
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

    // Verification in-app notification
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

    // Verification email notification
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

    // Verification in-app notification
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

    // Verification email notification
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

    // Pas de notification créée ni d'email envoyé car le praticien est déjà connecté
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
    // Désactive les mails pour le praticien
    session.practitioner.user.notificationPreference.emailNotifications = false

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    // L'in-app doit être créée
    expect(mockPrisma.notification.create).toHaveBeenCalled()
    // L'email ne doit pas être envoyé
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it("devrait envoyer l'in-app immédiatement mais programmer l'email si le patient rejoint avant l'heure de début de rendez-vous", async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
      scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // dans 5 minutes
    })

    mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(session as any)
    mockPrisma.appointment.findUnique.mockResolvedValue({ duration: 30 } as any)
    mockPrisma.teleconsultationSession.update.mockResolvedValue({
      ...session,
      patientJoinedAt: new Date(),
    } as any)

    await service.joinSession('session-1', 'user-patient-1')

    // L'in-app notification doit être créée immédiatement
    expect(mockPrisma.notification.create).toHaveBeenCalled()

    // L'email immédiat ne doit pas être envoyé
    expect(mockSendEmail).not.toHaveBeenCalled()

    // L'email doit être programmé via BullMQ avec un délai positif
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

    // Vérifier que le délai est proche de 5 minutes (300000 ms)
    const delayArg = mockScheduleEmail.mock.calls[0][1]
    expect(delayArg).toBeGreaterThan(290000)
    expect(delayArg).toBeLessThan(301000)
  })

  it("ne devrait pas envoyer de notification si le patient se connecte après l'heure de fin de rendez-vous (trop tard)", async () => {
    const session = buildSession({
      patientJoinedAt: null,
      practitionerJoinedAt: null,
      scheduledAt: new Date(Date.now() - 35 * 60 * 1000), // il y a 35 minutes (avec durée 30 min, c'est fini)
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

