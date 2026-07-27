import 'dotenv/config'
import prisma from '../src/config/database'
import { Gender } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const E2E_PASSWORD = process.env.E2E_PASSWORD
if (!E2E_PASSWORD) {
  throw new Error('E2E_PASSWORD environment variable is required for the E2E seed')
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function clearDatabase() {
  await prisma.dataExportRequest.deleteMany()
  await prisma.dataDeletionRequest.deleteMany()
  await prisma.vaccinationRecord.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.virtualQueue.deleteMany()
  await prisma.teleconsultationSession.deleteMany()
  await prisma.campaignRecipient.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.review.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationUserSettings.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.document.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.sharedMedicalRecord.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.absence.deleteMany()
  await prisma.availability.deleteMany()
  await prisma.qualification.deleteMany()
  await prisma.practitionerSpecialty.deleteMany()
  await prisma.cabinetInvitation.deleteMany()
  await prisma.cabinetPractitioner.deleteMany()
  await prisma.cabinet.deleteMany()
  await prisma.contactRequest.deleteMany()
  await prisma.specialty.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.practitionerTodo.deleteMany()
  await prisma.practitioner.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.consent.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.emailVerificationToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemSetting.deleteMany()
}

async function main() {
  console.log('E2E seed: clearing database...')
  await clearDatabase()

  console.log('E2E seed: creating system settings...')
  await prisma.systemSetting.createMany({
    data: [
      { key: 'appointment_slot_duration', value: { minutes: 30 } },
      { key: 'appointment_reservation_timeout', value: { minutes: 10 } },
      { key: 'teleconsultation_enabled', value: { enabled: true } },
    ],
  })

  console.log('E2E seed: creating specialties...')
  await prisma.specialty.createMany({
    data: [
      { name: 'Médecine Générale', description: 'Soins primaires', icon: '🩺' },
      { name: 'Cardiologie', description: 'Maladies cardiovasculaires', icon: '❤️' },
      { name: 'Dermatologie', description: 'Maladies de la peau', icon: '🔬' },
    ],
  })
  const specialties = await prisma.specialty.findMany()
  const generalMedicine = specialties.find((s) => s.name === 'Médecine Générale')!
  const cardiology = specialties.find((s) => s.name === 'Cardiologie')!

  const passwordHash = await hashPassword(E2E_PASSWORD)

  console.log('E2E seed: creating users...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.fr',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@test.fr',
      password: passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+225 07 00 00 00 01',
      dateOfBirth: new Date('1990-01-15'),
      gender: Gender.MALE,
      city: 'Abidjan',
      address: 'Cocody, Riviera',
      country: "Côte d'Ivoire",
      bloodType: 'O+',
      allergies: [],
      chronicConditions: [],
      emergencyContactName: 'Marie Dupont',
      emergencyContactPhone: '+225 07 00 00 00 02',
    },
  })

  const practitionerUser = await prisma.user.create({
    data: {
      email: 'praticien@test.fr',
      password: passwordHash,
      role: 'PRACTITIONER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  const practitioner = await prisma.practitioner.create({
    data: {
      userId: practitionerUser.id,
      firstName: 'Marie',
      lastName: 'Martin',
      title: 'Dr.',
      phone: '+225 07 00 00 00 03',
      licenseNumber: 'E2E-PRACT-001',
      licenseVerified: true,
      licenseVerifiedAt: new Date(),
      yearsOfExperience: 12,
      bio: 'Médecin généraliste pour les tests E2E.',
      clinicName: 'Cabinet E2E Santé',
      city: 'Abidjan',
      address: 'Plateau, Avenue Chardy',
      country: "Côte d'Ivoire",
      consultationDuration: 30,
      teleconsultationEnabled: true,
      baseConsultationFee: 15000,
      teleconsultationFee: 10000,
      latitude: 5.3546,
      longitude: -4.0038,
      acceptsInsurance: true,
      acceptsNewPatients: true,
      isProfilePublic: true,
      messagingEnabled: true,
      acceptedPaymentMethods: ['CARD', 'MOBILE_MONEY', 'CASH'],
    },
  })

  await prisma.practitionerSpecialty.create({
    data: {
      practitionerId: practitioner.id,
      specialtyId: generalMedicine.id,
      isPrimary: true,
    },
  })

  const workDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  for (const day of workDays) {
    await prisma.availability.create({
      data: {
        practitionerId: practitioner.id,
        dayOfWeek: day as 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        isActive: true,
      },
    })
  }

  const pendingPractitionerUser = await prisma.user.create({
    data: {
      email: 'praticien-pending@test.fr',
      password: passwordHash,
      role: 'PRACTITIONER',
      status: 'PENDING_VERIFICATION',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  await prisma.practitioner.create({
    data: {
      userId: pendingPractitionerUser.id,
      firstName: 'Paul',
      lastName: 'EnAttente',
      title: 'Dr.',
      phone: '+225 07 00 00 00 04',
      licenseNumber: 'E2E-PENDING-001',
      licenseVerified: false,
      yearsOfExperience: 5,
      bio: 'Praticien en attente de validation.',
      clinicName: 'Cabinet En Attente',
      city: 'Abidjan',
      address: 'Marcory',
      country: "Côte d'Ivoire",
      consultationDuration: 30,
      teleconsultationEnabled: false,
      baseConsultationFee: 12000,
      acceptsInsurance: false,
      acceptsNewPatients: true,
      isProfilePublic: false,
      messagingEnabled: false,
    },
  })

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@test.fr',
      password: passwordHash,
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      practitionerId: practitioner.id,
      firstName: 'Sophie',
      lastName: 'Assistante',
      phone: '+225 07 00 00 00 05',
      position: 'Secrétaire médicale',
      canManageAppointments: true,
      canViewMedicalRecords: false,
      canManagePayments: true,
    },
  })

  const cabinet = await prisma.cabinet.create({
    data: {
      name: 'Cabinet E2E Plateau',
      address: 'Plateau, Abidjan',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      phone: '+225 07 00 00 00 06',
      adminContactName: 'Dr. Marie Martin',
      adminContactEmail: 'praticien@test.fr',
      adminContactPhone: '+225 07 00 00 00 03',
      isVerified: true,
      verifiedAt: new Date(),
      latitude: 5.3546,
      longitude: -4.0038,
    },
  })

  await prisma.cabinetPractitioner.create({
    data: {
      cabinetId: cabinet.id,
      practitionerId: practitioner.id,
    },
  })

  for (const userId of [adminUser.id, patientUser.id, practitionerUser.id, staffUser.id]) {
    await prisma.consent.create({
      data: {
        userId,
        consentType: 'privacy_policy',
        version: '1.0',
        accepted: true,
        ipAddress: '127.0.0.1',
      },
    })
  }

  console.log('E2E seed: creating appointments and related data...')

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(0, 0, 0, 0)

  const confirmedAppt = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      practitionerId: practitioner.id,
      appointmentDate: tomorrow,
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      type: 'IN_PERSON',
      status: 'CONFIRMED',
      reason: 'Consultation de suivi',
      consultationFee: 15000,
      earlierSlotAlertEnabled: false,
    },
  })

  const cancellableAppt = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      practitionerId: practitioner.id,
      appointmentDate: nextWeek,
      startTime: '14:00',
      endTime: '14:30',
      duration: 30,
      type: 'IN_PERSON',
      status: 'CONFIRMED',
      reason: 'Consultation générale',
      consultationFee: 15000,
      earlierSlotAlertEnabled: false,
    },
  })

  const teleconsultAppt = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      practitionerId: practitioner.id,
      appointmentDate: nextWeek,
      startTime: '16:00',
      endTime: '16:30',
      duration: 30,
      type: 'TELECONSULTATION',
      status: 'CONFIRMED',
      reason: 'Téléconsultation de suivi',
      consultationFee: 10000,
    },
  })

  const medicalRecord = await prisma.medicalRecord.create({
    data: {
      appointmentId: confirmedAppt.id,
      patientId: patient.id,
      practitionerId: practitioner.id,
      chiefComplaint: 'Fatigue',
      diagnosis: 'Stress modéré',
      treatmentPlan: 'Repos et hydratation',
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.7,
    },
  })

  await prisma.document.create({
    data: {
      medicalRecordId: medicalRecord.id,
      practitionerId: practitioner.id,
      type: 'MEDICAL_REPORT',
      title: 'Compte-rendu E2E',
      description: 'Document de test',
      fileName: 'compte_rendu_e2e.pdf',
      filePath: `/documents/patients/${patient.id}/compte_rendu_e2e.pdf`,
      fileSize: 102400,
      mimeType: 'application/pdf',
      isEncrypted: true,
    },
  })

  const conversation = await prisma.conversation.create({
    data: {
      patientId: patient.id,
      practitionerId: practitioner.id,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Bonjour docteur, question sur mon traitement.',
    },
  })

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderUserId: patientUser.id,
        content: 'Bonjour docteur, question sur mon traitement.',
        status: 'READ',
        readAt: new Date(),
      },
      {
        conversationId: conversation.id,
        senderUserId: practitionerUser.id,
        content: 'Bonjour, je suis à votre écoute.',
        status: 'READ',
        readAt: new Date(),
      },
    ],
  })

  await prisma.teleconsultationSession.create({
    data: {
      appointmentId: teleconsultAppt.id,
      patientId: patient.id,
      practitionerId: practitioner.id,
      roomId: `e2e-room-${Date.now()}`,
      roomName: 'Téléconsultation E2E',
      status: 'SCHEDULED',
      scheduledAt: nextWeek,
      recordingEnabled: false,
      recordingConsent: false,
    },
  })

  await prisma.practitionerSpecialty.create({
    data: {
      practitionerId: practitioner.id,
      specialtyId: cardiology.id,
      isPrimary: false,
    },
  })

  await prisma.contactRequest.create({
    data: {
      requestType: 'PRACTITIONER',
      status: 'PENDING',
      firstName: 'Nouveau',
      lastName: 'Praticien',
      email: 'nouveau.praticien@test.fr',
      phone: '+225 07 00 00 00 07',
      specialty: 'Dermatologie',
      orderNumber: 'E2E-ORDER-001',
      clinicAddress: 'Abidjan, Plateau',
    },
  })

  console.log('E2E seed completed.')
  console.log('Users: patient@test.fr, praticien@test.fr, admin@test.fr, staff@test.fr')
  console.log(`Password for all: ${E2E_PASSWORD}`)
  console.log(`Practitioner ID: ${practitioner.id}`)
  console.log(`Cancellable appointment ID: ${cancellableAppt.id}`)
}

main()
  .catch((error) => {
    console.error('E2E seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
