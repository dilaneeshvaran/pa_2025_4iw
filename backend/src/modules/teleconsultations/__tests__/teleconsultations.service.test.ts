import { TeleconsultationsService } from '../teleconsultations.service'
import prisma from '../../../config/database'
import { sendTeleconsultationParticipantJoinedEmail } from '../../../utils/email'
import { scheduleTeleconsultationJoinedEmail } from '../../../utils/teleconsultation-email-scheduler'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    teleconsultationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
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
}))

jest.mock('../../../utils/teleconsultation-email-scheduler', () => ({
  scheduleTeleconsultationJoinedEmail: jest.fn().mockResolvedValue(undefined),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = sendTeleconsultationParticipantJoinedEmail as jest.MockedFunction<
  typeof sendTeleconsultationParticipantJoinedEmail
>
const mockScheduleEmail = scheduleTeleconsultationJoinedEmail as jest.MockedFunction<
  typeof scheduleTeleconsultationJoinedEmail
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
