import 'dotenv/config'
import prisma from '../src/config/database'
import { Gender } from '@prisma/client'
import * as bcrypt from 'bcrypt'

// const prisma = new PrismaClient(); // Removed in favor of imported instance

// Utility function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Utility function to generate fake TOTP secret (for demo purposes)
// Utility function to get environment variables safely
function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Utility function to generate fake TOTP secret (for demo purposes)
function generateFakeTOTPSecret(): string {
  return getEnv('BACKEND_SEED_TOTP_SECRET')
}

async function main() {
  console.log(' Starting database seeding...')

  // ============================================================================
  // CLEAR EXISTING DATA (for idempotent seeding)
  // ============================================================================
  console.log(' Clearing existing data...')

  // GDPR requests
  await prisma.dataExportRequest.deleteMany()
  await prisma.dataDeletionRequest.deleteMany()

  // Vaccination records
  await prisma.vaccinationRecord.deleteMany()

  // Invoices (must delete before payments)
  await prisma.invoice.deleteMany()

  // Virtual queue
  await prisma.virtualQueue.deleteMany()

  // Teleconsultation sessions (must delete before appointments)
  await prisma.teleconsultationSession.deleteMany()

  // Campaign data
  await prisma.campaignRecipient.deleteMany()
  await prisma.campaign.deleteMany()

  // Reviews
  await prisma.review.deleteMany()

  // Notifications
  await prisma.notification.deleteMany()

  // Payments
  await prisma.payment.deleteMany()

  // Messages
  await prisma.message.deleteMany()

  // Conversations
  await prisma.conversation.deleteMany()

  // Documents
  await prisma.document.deleteMany()

  // Prescriptions
  await prisma.prescription.deleteMany()

  // Shared medical records
  await prisma.sharedMedicalRecord.deleteMany()

  // Medical records
  await prisma.medicalRecord.deleteMany()

  // Appointments
  await prisma.appointment.deleteMany()

  // Absences
  await prisma.absence.deleteMany()

  // Availabilities
  await prisma.availability.deleteMany()

  // Qualifications
  await prisma.qualification.deleteMany()

  // Practitioner specialties
  await prisma.practitionerSpecialty.deleteMany()

  // Specialties
  await prisma.specialty.deleteMany()

  // Staff
  await prisma.staff.deleteMany()

  // Practitioner todos
  await prisma.practitionerTodo.deleteMany()

  // Practitioners
  await prisma.practitioner.deleteMany()

  // Patients
  await prisma.patient.deleteMany()

  // Consents
  await prisma.consent.deleteMany()

  // Audit logs
  await prisma.auditLog.deleteMany()

  // Tokens
  await prisma.passwordResetToken.deleteMany()
  await prisma.emailVerificationToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.session.deleteMany()

  // Users
  await prisma.user.deleteMany()

  // System settings
  await prisma.systemSetting.deleteMany()

  // ============================================================================
  // SYSTEM SETTINGS
  // ============================================================================
  console.log('⚙️  Creating system settings...')

  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'appointment_slot_duration',
        value: { minutes: 30 },
      },
      {
        key: 'appointment_reservation_timeout',
        value: { minutes: 10 },
      },
      {
        key: 'max_no_show_before_penalty',
        value: { count: 3 },
      },
      {
        key: 'penalty_duration_days',
        value: { days: 30 },
      },
      {
        key: 'reminder_24h_enabled',
        value: { enabled: true },
      },
      {
        key: 'reminder_1h_enabled',
        value: { enabled: true },
      },
      {
        key: 'teleconsultation_enabled',
        value: { enabled: true },
      },
      {
        key: 'mobile_money_providers',
        value: {
          providers: ['Orange Money', 'MTN Mobile Money', 'Moov Money'],
        },
      },
    ],
  })

  // ============================================================================
  // SPECIALTIES
  // ============================================================================
  console.log(' Creating medical specialties...')

  const specialties = await prisma.specialty.createMany({
    data: [
      {
        name: 'Médecine Générale',
        description: 'Soins de santé primaires',
        icon: '🩺',
      },
      {
        name: 'Cardiologie',
        description: 'Maladies du cœur et système cardiovasculaire',
        icon: '❤️',
      },
      { name: 'Dermatologie', description: 'Maladies de la peau', icon: '🔬' },
      { name: 'Pédiatrie', description: 'Santé des enfants', icon: '👶' },
      {
        name: 'Gynécologie',
        description: 'Santé reproductive féminine',
        icon: '👩‍⚕️',
      },
      { name: 'Ophtalmologie', description: 'Maladies des yeux', icon: '👁️' },
      { name: 'Dentisterie', description: 'Santé bucco-dentaire', icon: '🦷' },
      { name: 'Psychiatrie', description: 'Santé mentale', icon: '🧠' },
      {
        name: 'Orthopédie',
        description: 'Maladies des os et articulations',
        icon: '🦴',
      },
      { name: 'ORL', description: 'Oreilles, nez et gorge', icon: '👂' },
    ],
  })

  const allSpecialties = await prisma.specialty.findMany()

  // ============================================================================
  // ADMIN USER
  // ============================================================================
  console.log(' Creating admin user...')

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medicalapp.ci',
      password: await hashPassword(getEnv('BACKEND_ADMIN_PASSWORD')),
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  await prisma.consent.create({
    data: {
      userId: adminUser.id,
      consentType: 'privacy_policy',
      version: '1.0',
      accepted: true,
      ipAddress: '127.0.0.1',
    },
  })

  // ============================================================================
  // PATIENTS
  // ============================================================================
  console.log(' Creating patient accounts...')

  const patientUsers = []
  const patients = []

  const patientData = [
    {
      email: 'patient1@test.ci',
      firstName: 'Kouassi',
      lastName: 'Yao',
      phone: '+225 07 12 34 56 78',
      dateOfBirth: new Date('1990-05-15'),
      gender: Gender.MALE,
      city: 'Abidjan',
      address: 'Cocody, Riviera 2',
      bloodType: 'O+',
      allergies: ['Pénicilline'],
      chronicConditions: [],
    },
    {
      email: 'patient2@test.ci',
      firstName: 'Aya',
      lastName: 'Koné',
      phone: '+225 05 23 45 67 89',
      dateOfBirth: new Date('1985-08-20'),
      gender: Gender.FEMALE,
      city: 'Abidjan',
      address: 'Marcory, Zone 4',
      bloodType: 'A+',
      allergies: [],
      chronicConditions: ['Hypertension', 'Diabète type 2'],
    },
    {
      email: 'patient3@test.ci',
      firstName: 'Mamadou',
      lastName: 'Traoré',
      phone: '+225 07 98 76 54 32',
      dateOfBirth: new Date('2000-12-10'),
      gender: Gender.MALE,
      city: 'Yamoussoukro',
      address: 'Quartier Commerce',
      bloodType: 'B+',
      allergies: ['Arachides'],
      chronicConditions: [],
    },
    {
      email: 'patient4@test.ci',
      firstName: 'Fatoumata',
      lastName: 'Diabaté',
      phone: '+225 01 11 22 33 44',
      dateOfBirth: new Date('1995-03-25'),
      gender: Gender.FEMALE,
      city: 'Bouaké',
      address: 'Dar Es Salam',
      bloodType: 'AB+',
      allergies: [],
      chronicConditions: ['Asthme'],
    },
  ]

  for (const data of patientData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await hashPassword(getEnv('BACKEND_PATIENT_PASSWORD')),
        role: 'PATIENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        twoFactorEnabled: false,
      },
    })

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        city: data.city,
        address: data.address,
        country: "Côte d'Ivoire",
        bloodType: data.bloodType,
        allergies: data.allergies,
        chronicConditions: data.chronicConditions,
        emergencyContactName: 'Contact Urgence',
        emergencyContactPhone: '+225 07 00 00 00 00',
      },
    })

    await prisma.consent.create({
      data: {
        userId: user.id,
        consentType: 'privacy_policy',
        version: '1.0',
        accepted: true,
        ipAddress: '127.0.0.1',
      },
    })

    patientUsers.push(user)
    patients.push(patient)
  }

  // ============================================================================
  // PRACTITIONERS
  // ============================================================================
  console.log(' Creating practitioner accounts...')

  const practitionerUsers = []
  const practitioners = []

  const practitionerData = [
    {
      email: 'dr.koffi@clinic.ci',
      firstName: 'Emmanuel',
      lastName: 'Koffi',
      title: 'Dr.',
      phone: '+225 07 55 66 77 88',
      licenseNumber: 'CI-MED-2015-001234',
      yearsOfExperience: 10,
      bio: "Médecin généraliste avec 10 ans d'expérience. Spécialisé dans la médecine familiale et les soins préventifs.",
      clinicName: 'Clinique Sainte Marie',
      city: 'Abidjan',
      address: 'Plateau, Avenue Chardy',
      baseConsultationFee: 15000,
      teleconsultationFee: 10000,
      teleconsultationEnabled: true,
      specialtyNames: ['Médecine Générale'],
    },
    {
      email: 'dr.toure@hospital.ci',
      firstName: 'Aminata',
      lastName: 'Touré',
      title: 'Dr.',
      phone: '+225 05 44 33 22 11',
      licenseNumber: 'CI-MED-2012-005678',
      yearsOfExperience: 13,
      bio: 'Cardiologue expérimentée. Consultation des maladies cardiovasculaires, hypertension, insuffisance cardiaque.',
      clinicName: 'CHU de Cocody',
      city: 'Abidjan',
      address: 'Cocody, Boulevard Latrille',
      baseConsultationFee: 25000,
      teleconsultationFee: 20000,
      teleconsultationEnabled: true,
      specialtyNames: ['Cardiologie'],
    },
    {
      email: 'dr.bamba@derma.ci',
      firstName: 'Sekou',
      lastName: 'Bamba',
      title: 'Pr.',
      phone: '+225 07 88 99 00 11',
      licenseNumber: 'CI-MED-2008-009876',
      yearsOfExperience: 17,
      bio: 'Professeur en dermatologie. Traitement des maladies de peau, acné, eczéma, infections cutanées.',
      clinicName: 'Centre Dermatologique',
      city: 'Abidjan',
      address: 'Marcory, Zone 4',
      baseConsultationFee: 20000,
      teleconsultationFee: 15000,
      teleconsultationEnabled: true,
      specialtyNames: ['Dermatologie'],
    },
    {
      email: 'dr.ouattara@pediatrie.ci',
      firstName: 'Mariam',
      lastName: 'Ouattara',
      title: 'Dr.',
      phone: '+225 01 22 33 44 55',
      licenseNumber: 'CI-MED-2016-012345',
      yearsOfExperience: 9,
      bio: 'Pédiatre spécialisée dans les soins des nourrissons et enfants. Vaccination, suivi de croissance.',
      clinicName: 'Polyclinique Les Hirondelles',
      city: 'Abidjan',
      address: 'Deux-Plateaux, Vallon',
      baseConsultationFee: 18000,
      teleconsultationFee: 12000,
      teleconsultationEnabled: false,
      specialtyNames: ['Pédiatrie'],
    },
  ]

  for (const data of practitionerData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await hashPassword(getEnv('BACKEND_PRACTITIONER_PASSWORD')),
        role: 'PRACTITIONER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        twoFactorEnabled: false,
      },
    })

    const practitioner = await prisma.practitioner.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseVerified: true,
        licenseVerifiedAt: new Date(),
        yearsOfExperience: data.yearsOfExperience,
        bio: data.bio,
        clinicName: data.clinicName,
        city: data.city,
        address: data.address,
        country: "Côte d'Ivoire",
        consultationDuration: 30,
        teleconsultationEnabled: data.teleconsultationEnabled,
        baseConsultationFee: data.baseConsultationFee,
        teleconsultationFee: data.teleconsultationFee,
        acceptsInsurance: true,
        acceptsNewPatients: true,
      },
    })

    // Assign specialties
    for (const specialtyName of data.specialtyNames) {
      const specialty = allSpecialties.find((s) => s.name === specialtyName)
      if (specialty) {
        await prisma.practitionerSpecialty.create({
          data: {
            practitionerId: practitioner.id,
            specialtyId: specialty.id,
            isPrimary: true,
          },
        })
      }
    }

    // Create availabilities (Monday to Friday, 9am-5pm)
    const workDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    for (const day of workDays) {
      await prisma.availability.create({
        data: {
          practitionerId: practitioner.id,
          dayOfWeek: day as any,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          breakStartTime: '12:00',
          breakEndTime: '13:00',
          isActive: true,
        },
      })
    }

    await prisma.consent.create({
      data: {
        userId: user.id,
        consentType: 'privacy_policy',
        version: '1.0',
        accepted: true,
        ipAddress: '127.0.0.1',
      },
    })

    practitionerUsers.push(user)
    practitioners.push(practitioner)
  }

  // ============================================================================
  // STAFF MEMBERS
  // ============================================================================
  console.log(' Creating staff accounts...')

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@clinic.ci',
      password: await hashPassword(getEnv('BACKEND_STAFF_PASSWORD')),
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      practitionerId: practitioners[0].id, // Assigned to Dr. Koffi
      firstName: 'Marie',
      lastName: 'Kouadio',
      phone: '+225 07 11 22 33 44',
      position: 'Secrétaire Médicale',
      canManageAppointments: true,
      canViewMedicalRecords: false,
      canManagePayments: true,
    },
  })

  await prisma.consent.create({
    data: {
      userId: staffUser.id,
      consentType: 'privacy_policy',
      version: '1.0',
      accepted: true,
      ipAddress: '127.0.0.1',
    },
  })

  // ============================================================================
  // APPOINTMENTS
  // ============================================================================
  console.log(' Creating appointments...')

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const appointments = []

  // Completed appointment (last week)
  const completedAppt = await prisma.appointment.create({
    data: {
      patientId: patients[0].id,
      practitionerId: practitioners[0].id,
      appointmentDate: lastWeek,
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      type: 'IN_PERSON',
      status: 'COMPLETED',
      reason: 'Consultation de routine',
      consultationFee: 15000,
    },
  })
  appointments.push(completedAppt)

  // Confirmed appointment (tomorrow)
  const confirmedAppt = await prisma.appointment.create({
    data: {
      patientId: patients[0].id,
      practitionerId: practitioners[1].id,
      appointmentDate: tomorrow,
      startTime: '14:00',
      endTime: '14:30',
      duration: 30,
      type: 'IN_PERSON',
      status: 'CONFIRMED',
      reason: 'Contrôle cardiaque',
      consultationFee: 25000,
    },
  })
  appointments.push(confirmedAppt)

  // Pending appointment (next week)
  const pendingAppt = await prisma.appointment.create({
    data: {
      patientId: patients[1].id,
      practitionerId: practitioners[2].id,
      appointmentDate: nextWeek,
      startTime: '09:30',
      endTime: '10:00',
      duration: 30,
      type: 'TELECONSULTATION',
      status: 'PENDING',
      reason: 'Problème de peau',
      consultationFee: 15000,
    },
  })
  appointments.push(pendingAppt)

  // Cancelled appointment
  const cancelledAppt = await prisma.appointment.create({
    data: {
      patientId: patients[2].id,
      practitionerId: practitioners[0].id,
      appointmentDate: tomorrow,
      startTime: '11:00',
      endTime: '11:30',
      duration: 30,
      type: 'IN_PERSON',
      status: 'CANCELLED',
      reason: 'Consultation générale',
      consultationFee: 15000,
      cancelledAt: new Date(),
      cancelledBy: patients[2].userId,
      cancellationReason: 'Empêchement de dernière minute',
    },
  })
  appointments.push(cancelledAppt)

  // ============================================================================
  // MEDICAL RECORDS
  // ============================================================================
  console.log(' Creating medical records...')

  const medicalRecord = await prisma.medicalRecord.create({
    data: {
      appointmentId: completedAppt.id,
      patientId: patients[0].id,
      practitionerId: practitioners[0].id,
      chiefComplaint: 'Fatigue chronique et maux de tête',
      historyOfIllness: 'Symptômes depuis 2 semaines, aggravés le matin',
      examination:
        'Tension artérielle: 130/85 mmHg, Auscultation cardiaque normale',
      diagnosis: 'Hypertension artérielle légère, stress',
      treatmentPlan: 'Repos, régime pauvre en sel, contrôle dans 1 mois',
      bloodPressure: '130/85',
      heartRate: 78,
      temperature: 36.8,
      weight: 75.5,
      height: 175.0,
      additionalData: {
        symptoms: ['fatigue', 'headache'],
        severity: 'moderate',
      },
    },
  })

  // ============================================================================
  // PRESCRIPTIONS
  // ============================================================================
  console.log(' Creating prescriptions...')

  await prisma.prescription.create({
    data: {
      medicalRecordId: medicalRecord.id,
      patientId: patients[0].id,
      practitionerId: practitioners[0].id,
      medications: [
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: '1 fois par jour',
          duration: '30 jours',
          instructions: "À prendre le matin avec un verre d'eau",
        },
        {
          name: 'Paracétamol',
          dosage: '500mg',
          frequency: 'Si besoin',
          duration: '15 jours',
          instructions: 'Maximum 3 prises par jour',
        },
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  // ============================================================================
  // SHARED MEDICAL RECORDS
  // ============================================================================
  console.log(' Creating shared medical records...')

  await prisma.sharedMedicalRecord.create({
    data: {
      medicalRecordId: medicalRecord.id,
      patientId: patients[0].id,
      practitionerId: practitioners[1].id, // Shared with cardiologist
      canView: true,
      canEdit: false,
    },
  })

  // ============================================================================
  // CONVERSATIONS & MESSAGES
  // ============================================================================
  console.log('💬 Creating conversations and messages...')

  // Conversation 1: Patient 0 <-> Practitioner 0
  const conversation1 = await prisma.conversation.create({
    data: {
      patientId: patients[0].id,
      practitionerId: practitioners[0].id,
      lastMessageAt: new Date(),
      lastMessagePreview:
        "Bonjour Docteur, j'ai une question concernant mon traitement.",
    },
  })

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderUserId: patientUsers[0].id,
        content:
          "Bonjour Docteur, j'ai une question concernant mon traitement.",
        status: 'READ',
        readAt: new Date(),
      },
      {
        conversationId: conversation1.id,
        senderUserId: patientUsers[0].id,
        content:
          'Est-ce que je peux prendre le médicament le soir au lieu du matin?',
        status: 'READ',
        readAt: new Date(),
      },
      {
        conversationId: conversation1.id,
        senderUserId: practitionerUsers[0].id,
        content:
          "Oui, vous pouvez prendre le médicament le soir. N'oubliez pas de le prendre après le repas.",
        status: 'READ',
        readAt: new Date(),
      },
    ],
  })

  // Conversation 2: Patient 1 <-> Practitioner 2
  const conversation2 = await prisma.conversation.create({
    data: {
      patientId: patients[1].id,
      practitionerId: practitioners[2].id,
      lastMessageAt: new Date(),
      lastMessagePreview:
        'Docteur, les démangeaisons persistent malgré la crème.',
    },
  })

  await prisma.message.create({
    data: {
      conversationId: conversation2.id,
      senderUserId: patientUsers[1].id,
      content: 'Docteur, les démangeaisons persistent malgré la crème.',
      status: 'DELIVERED',
    },
  })

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  console.log(' Creating payments...')

  await prisma.payment.create({
    data: {
      appointmentId: completedAppt.id,
      patientId: patients[0].id,
      practitionerId: practitioners[0].id,
      amount: 15000,
      currency: 'XOF',
      method: 'MOBILE_MONEY',
      status: 'COMPLETED',
      mobileMoneyRef: 'MM-' + Date.now(),
      invoiceNumber: 'INV-2025-001',
      paidAt: new Date(),
    },
  })

  await prisma.payment.create({
    data: {
      appointmentId: confirmedAppt.id,
      patientId: patients[0].id,
      practitionerId: practitioners[1].id,
      amount: 25000,
      currency: 'XOF',
      method: 'CARD',
      status: 'PENDING',
      invoiceNumber: 'INV-2025-002',
    },
  })

  // ============================================================================
  // REVIEWS
  // ============================================================================
  console.log(' Creating reviews...')

  await prisma.review.create({
    data: {
      practitionerId: practitioners[0].id,
      patientId: patients[0].id,
      appointmentId: completedAppt.id,
      rating: 5,
      comment:
        "Excellent médecin, très à l'écoute. Consultation très professionnelle.",
    },
  })

  // Update practitioner rating
  await prisma.practitioner.update({
    where: { id: practitioners[0].id },
    data: {
      averageRating: 5.0,
      totalReviews: 1,
    },
  })

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  console.log(' Creating notifications...')

  await prisma.notification.createMany({
    data: [
      {
        userId: patientUsers[0].id,
        type: 'APPOINTMENT_REMINDER',
        channel: 'EMAIL',
        title: 'Rappel de rendez-vous',
        message: 'Votre rendez-vous avec Dr. Touré est demain à 14:00',
        metadata: { appointmentId: confirmedAppt.id },
        sent: true,
        sentAt: new Date(),
      },
      {
        userId: patientUsers[0].id,
        type: 'MESSAGE_RECEIVED',
        channel: 'IN_APP',
        title: 'Nouveau message',
        message: 'Vous avez reçu une réponse du Dr. Koffi',
        sent: true,
        sentAt: new Date(),
        read: false,
      },
      {
        userId: practitionerUsers[0].id,
        type: 'APPOINTMENT_CONFIRMATION',
        channel: 'EMAIL',
        title: 'Nouveau rendez-vous',
        message: 'Un patient a pris rendez-vous pour demain',
        sent: true,
        sentAt: new Date(),
        read: true,
        readAt: new Date(),
      },
    ],
  })

  // ============================================================================
  // PREVENTION CAMPAIGNS
  // ============================================================================
  console.log(' Creating prevention campaigns...')

  const campaign = await prisma.campaign.create({
    data: {
      title: 'Campagne de vaccination COVID-19',
      description: 'Rappel de vaccination pour les personnes à risque',
      message:
        "Chers patients, n'oubliez pas de vous faire vacciner contre la COVID-19. Des doses sont disponibles dans tous nos centres.",
      status: 'ACTIVE',
      targetType: 'AGE_GROUP',
      targetAgeMin: 50,
      targetAgeMax: 100,
      createdBy: adminUser.id,
      scheduledAt: new Date(),
    },
  })

  // Add campaign recipients
  await prisma.campaignRecipient.create({
    data: {
      campaignId: campaign.id,
      patientId: patients[1].id, // Aya Koné (age 40+)
      sent: true,
      sentAt: new Date(),
      delivered: true,
      deliveredAt: new Date(),
    },
  })

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  console.log(' Creating audit logs...')

  await prisma.auditLog.createMany({
    data: [
      {
        userId: patientUsers[0].id,
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: practitionerUsers[0].id,
        action: 'ACCESS_MEDICAL_RECORD',
        resource: 'medical_records',
        resourceId: medicalRecord.id,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: patientUsers[0].id,
        action: 'SHARE_MEDICAL_RECORD',
        resource: 'medical_records',
        resourceId: medicalRecord.id,
        metadata: { sharedWith: practitioners[1].id },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    ],
  })

  // ============================================================================
  // ABSENCES
  // ============================================================================
  console.log(' Creating practitioner absences...')

  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + 14)
  const futureEndDate = new Date(futureDate)
  futureEndDate.setDate(futureEndDate.getDate() + 7)

  await prisma.absence.create({
    data: {
      practitionerId: practitioners[0].id,
      startDate: futureDate,
      endDate: futureEndDate,
      reason: 'Congés annuels',
      isRecurring: false,
    },
  })

  // ============================================================================
  // QUALIFICATIONS (Practitioner Diplomas & Certifications)
  // ============================================================================
  console.log(' Creating practitioner qualifications...')

  const qualificationsData = [
    {
      practitionerId: practitioners[0].id,
      title: 'Doctorat en Médecine',
      institution: 'Université Félix Houphouët-Boigny',
      yearObtained: 2015,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
    {
      practitionerId: practitioners[0].id,
      title: 'Certificat en Médecine Familiale',
      institution: 'Institut de Formation Médicale Continue',
      yearObtained: 2018,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
    {
      practitionerId: practitioners[1].id,
      title: 'Doctorat en Médecine',
      institution: 'Université de Cocody',
      yearObtained: 2012,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
    {
      practitionerId: practitioners[1].id,
      title: 'Spécialisation en Cardiologie',
      institution: 'CHU de Bordeaux',
      yearObtained: 2016,
      country: 'France',
      isVerified: true,
    },
    {
      practitionerId: practitioners[2].id,
      title: 'Doctorat en Médecine',
      institution: 'Université de Dakar',
      yearObtained: 2008,
      country: 'Sénégal',
      isVerified: true,
    },
    {
      practitionerId: practitioners[2].id,
      title: 'Professeur Agrégé en Dermatologie',
      institution: 'Université Félix Houphouët-Boigny',
      yearObtained: 2015,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
    {
      practitionerId: practitioners[3].id,
      title: 'Doctorat en Médecine',
      institution: 'Université de Bouaké',
      yearObtained: 2016,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
    {
      practitionerId: practitioners[3].id,
      title: 'Spécialisation en Pédiatrie',
      institution: 'CHU de Treichville',
      yearObtained: 2019,
      country: "Côte d'Ivoire",
      isVerified: true,
    },
  ]

  for (const qual of qualificationsData) {
    await prisma.qualification.create({
      data: {
        ...qual,
        verifiedAt: qual.isVerified ? new Date() : null,
        verifiedBy: qual.isVerified ? adminUser.id : null,
      },
    })
  }

  // ============================================================================
  // DOCUMENTS (Medical Documents)
  // ============================================================================
  console.log(' Creating medical documents...')

  await prisma.document.createMany({
    data: [
      {
        medicalRecordId: medicalRecord.id,
        practitionerId: practitioners[0].id,
        type: 'MEDICAL_REPORT',
        title: 'Rapport de consultation - Janvier 2025',
        description: 'Bilan de santé général avec recommandations',
        fileName: 'rapport_consultation_2025_01.pdf',
        filePath:
          '/documents/patients/' +
          patients[0].id +
          '/rapport_consultation_2025_01.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        isEncrypted: true,
      },
      {
        medicalRecordId: medicalRecord.id,
        practitionerId: practitioners[0].id,
        type: 'LAB_RESULT',
        title: 'Analyse Sanguine Complète',
        description: 'Bilan sanguin (NFS, glycémie, cholestérol)',
        fileName: 'analyse_sanguine_2025_01.pdf',
        filePath:
          '/documents/patients/' +
          patients[0].id +
          '/analyse_sanguine_2025_01.pdf',
        fileSize: 128000,
        mimeType: 'application/pdf',
        isEncrypted: true,
      },
      {
        practitionerId: practitioners[1].id,
        type: 'RADIOLOGY',
        title: 'ECG - Électrocardiogramme',
        description: 'Résultats ECG patient',
        fileName: 'ecg_result_2025.pdf',
        filePath:
          '/documents/practitioners/' +
          practitioners[1].id +
          '/templates/ecg_result_2025.pdf',
        fileSize: 350000,
        mimeType: 'application/pdf',
        isEncrypted: true,
      },
    ],
  })

  // ============================================================================
  // TELECONSULTATION SESSIONS
  // ============================================================================
  console.log(' Creating teleconsultation sessions...')

  // Create a teleconsultation session for the pending teleconsultation appointment
  const teleconsultationSession = await prisma.teleconsultationSession.create({
    data: {
      appointmentId: pendingAppt.id,
      patientId: patients[1].id,
      practitionerId: practitioners[2].id,
      roomId:
        'room_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      roomName:
        'Consultation Dermatologique - ' +
        new Date(nextWeek).toLocaleDateString('fr-FR'),
      status: 'SCHEDULED',
      scheduledAt: nextWeek,
      recordingEnabled: false,
      recordingConsent: false,
    },
  })

  // Create a completed teleconsultation session (for demo purposes with a past appointment)
  const pastTeleconsultDate = new Date(now)
  pastTeleconsultDate.setDate(pastTeleconsultDate.getDate() - 14)

  // We need a past teleconsultation appointment
  const pastTeleconsultAppt = await prisma.appointment.create({
    data: {
      patientId: patients[2].id,
      practitionerId: practitioners[0].id,
      appointmentDate: pastTeleconsultDate,
      startTime: '15:00',
      endTime: '15:30',
      duration: 30,
      type: 'TELECONSULTATION',
      status: 'COMPLETED',
      reason: 'Suivi à distance',
      consultationFee: 10000,
    },
  })

  await prisma.teleconsultationSession.create({
    data: {
      appointmentId: pastTeleconsultAppt.id,
      patientId: patients[2].id,
      practitionerId: practitioners[0].id,
      roomId: 'room_completed_' + Date.now(),
      roomName: 'Suivi à distance - Terminé',
      status: 'COMPLETED',
      scheduledAt: pastTeleconsultDate,
      startedAt: pastTeleconsultDate,
      endedAt: new Date(pastTeleconsultDate.getTime() + 25 * 60000), // 25 minutes later
      duration: 25,
      patientJoinedAt: pastTeleconsultDate,
      practitionerJoinedAt: new Date(pastTeleconsultDate.getTime() - 2 * 60000), // Doctor joined 2 min early
      waitingRoomTime: 120, // 2 minutes waiting
      connectionQuality: 'good',
    },
  })

  // ============================================================================
  // VIRTUAL QUEUE (Waiting Room)
  // ============================================================================
  console.log(' Creating virtual queue entries...')

  // Create some waiting room entries for today
  await prisma.virtualQueue.createMany({
    data: [
      {
        patientId: patients[0].id,
        practitionerId: practitioners[0].id,
        position: 1,
        status: 'IN_CONSULTATION',
        checkInTime: new Date(now.getTime() - 30 * 60000), // 30 min ago
        calledTime: new Date(now.getTime() - 5 * 60000), // 5 min ago
        estimatedWaitMinutes: 0,
        actualWaitMinutes: 25,
        priority: 0,
        notes: 'Patient régulier',
      },
      {
        patientId: patients[1].id,
        practitionerId: practitioners[0].id,
        position: 2,
        status: 'WAITING',
        checkInTime: new Date(now.getTime() - 15 * 60000), // 15 min ago
        estimatedWaitMinutes: 20,
        priority: 0,
      },
      {
        patientId: patients[2].id,
        practitionerId: practitioners[0].id,
        position: 3,
        status: 'WAITING',
        checkInTime: new Date(now.getTime() - 5 * 60000), // 5 min ago
        estimatedWaitMinutes: 45,
        priority: 1, // Higher priority (urgent)
        notes: 'Cas urgent - prioritaire',
      },
      {
        patientId: patients[3].id,
        practitionerId: practitioners[1].id,
        position: 1,
        status: 'WAITING',
        checkInTime: new Date(now.getTime() - 10 * 60000), // 10 min ago
        estimatedWaitMinutes: 15,
        priority: 0,
      },
    ],
  })

  // ============================================================================
  // INVOICES
  // ============================================================================
  console.log(' Creating invoices...')

  // Get the completed payment to create an invoice for it
  const completedPayment = await prisma.payment.findFirst({
    where: { status: 'COMPLETED' },
    include: { patient: true, practitioner: true },
  })

  if (completedPayment) {
    await prisma.invoice.create({
      data: {
        paymentId: completedPayment.id,
        invoiceNumber: 'FACT-2025-000001',
        invoiceDate: completedPayment.paidAt || new Date(),
        subtotal: completedPayment.amount,
        taxRate: 0, // No VAT on medical services in CI
        taxAmount: 0,
        total: completedPayment.amount,
        currency: 'XOF',
        items: [
          {
            description: 'Consultation médicale générale',
            quantity: 1,
            unitPrice: Number(completedPayment.amount),
            amount: Number(completedPayment.amount),
          },
        ],
        billedToName: `${completedPayment.patient.firstName} ${completedPayment.patient.lastName}`,
        billedToAddress: completedPayment.patient.address,
        billedToEmail: patientUsers[0].email,
        billedToPhone: completedPayment.patient.phone,
        billedFromName: `${completedPayment.practitioner.title} ${completedPayment.practitioner.firstName} ${completedPayment.practitioner.lastName}`,
        billedFromAddress: completedPayment.practitioner.address,
        billedFromLicense: completedPayment.practitioner.licenseNumber,
        pdfPath: '/invoices/FACT-2025-000001.pdf',
        pdfGeneratedAt: new Date(),
      },
    })
  }

  // ============================================================================
  // VACCINATION RECORDS
  // ============================================================================
  console.log(' Creating vaccination records...')

  const vaccinationData = [
    {
      patientId: patients[0].id,
      vaccineName: 'Pfizer-BioNTech COVID-19',
      vaccineType: 'COVID-19',
      manufacturer: 'Pfizer-BioNTech',
      batchNumber: 'EL9262',
      doseNumber: 1,
      administeredAt: new Date('2023-03-15'),
      administeredBy: 'Centre de Vaccination Abidjan',
      location: 'Centre de Santé Communautaire, Cocody',
      nextDoseDate: new Date('2023-04-05'),
      reminderEnabled: false,
    },
    {
      patientId: patients[0].id,
      vaccineName: 'Pfizer-BioNTech COVID-19',
      vaccineType: 'COVID-19',
      manufacturer: 'Pfizer-BioNTech',
      batchNumber: 'EL9267',
      doseNumber: 2,
      administeredAt: new Date('2023-04-05'),
      administeredBy: 'Centre de Vaccination Abidjan',
      location: 'Centre de Santé Communautaire, Cocody',
      nextDoseDate: new Date('2024-04-05'),
      reminderEnabled: true,
    },
    {
      patientId: patients[0].id,
      vaccineName: 'Vaccin Antigrippal 2024',
      vaccineType: 'Grippe',
      manufacturer: 'Sanofi Pasteur',
      batchNumber: 'FLU2024-CI45',
      doseNumber: 1,
      administeredAt: new Date('2024-10-20'),
      administeredBy: 'Dr. Emmanuel Koffi',
      location: 'Clinique Sainte Marie, Plateau',
      nextDoseDate: new Date('2025-10-20'),
      reminderEnabled: true,
    },
    {
      patientId: patients[1].id,
      vaccineName: 'Pfizer-BioNTech COVID-19',
      vaccineType: 'COVID-19',
      manufacturer: 'Pfizer-BioNTech',
      batchNumber: 'EL9290',
      doseNumber: 1,
      administeredAt: new Date('2023-05-10'),
      administeredBy: 'CHU de Cocody',
      location: 'CHU de Cocody, Service Vaccination',
      nextDoseDate: new Date('2023-05-31'),
      reminderEnabled: false,
    },
    {
      patientId: patients[2].id,
      vaccineName: 'Hépatite B',
      vaccineType: 'Hépatite B',
      manufacturer: 'GSK',
      batchNumber: 'HEPB2022-001',
      doseNumber: 3,
      administeredAt: new Date('2022-08-15'),
      administeredBy: 'Centre Médical Yamoussoukro',
      location: 'Centre Médical, Yamoussoukro',
      reminderEnabled: false,
    },
    {
      patientId: patients[3].id,
      vaccineName: 'Fièvre Jaune',
      vaccineType: 'Fièvre Jaune',
      manufacturer: 'Institut Pasteur',
      batchNumber: 'YF2021-CI',
      doseNumber: 1,
      administeredAt: new Date('2021-06-01'),
      administeredBy: 'Centre de Santé Bouaké',
      location: 'Centre de Santé Communautaire, Bouaké',
      // Yellow fever is valid for life, no next dose
      reminderEnabled: false,
    },
  ]

  for (const vax of vaccinationData) {
    await prisma.vaccinationRecord.create({
      data: vax,
    })
  }

  // ============================================================================
  // GDPR - DATA EXPORT REQUESTS
  // ============================================================================
  console.log(' Creating data export requests...')

  await prisma.dataExportRequest.createMany({
    data: [
      {
        userId: patientUsers[0].id,
        status: 'COMPLETED',
        requestedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        processedAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000 + 3600000,
        ), // 1 hour after request
        completedAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000 + 7200000,
        ), // 2 hours after request
        filePath: '/exports/user_' + patientUsers[0].id + '_export.json',
        fileSize: 524288, // 512 KB
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        downloadedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // Downloaded 6 days ago
        ipAddress: '192.168.1.100',
      },
      {
        userId: patientUsers[1].id,
        status: 'PENDING',
        requestedAt: new Date(),
        ipAddress: '192.168.1.101',
      },
    ],
  })

  // ============================================================================
  // GDPR - DATA DELETION REQUESTS
  // ============================================================================
  console.log(' Creating data deletion requests...')

  // Create one cancelled deletion request (user changed their mind)
  await prisma.dataDeletionRequest.create({
    data: {
      userId: patientUsers[2].id,
      status: 'CANCELLED',
      reason:
        'Je souhaite supprimer mon compte et toutes mes données personnelles.',
      requestedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      scheduledDeletionAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), // Was scheduled 14 days after request
      confirmationToken:
        'cancelled_token_' + Math.random().toString(36).substring(7),
      ipAddress: '192.168.1.102',
    },
  })

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n Seeding completed successfully!\n')
  console.log(' Summary:')
  console.log('─────────────────────────────────────')
  console.log(` Admin Users: 1`)
  console.log(`   Email: admin@medicalapp.ci`)
  console.log(`   Password: [HIDDEN] (Check .env)`)
  console.log('')
  console.log(` Patients: ${patients.length}`)
  console.log(`   Emails: patient1@test.ci, patient2@test.ci, etc.`)
  console.log(`   Password: [HIDDEN] (Check .env)`)
  console.log('')
  console.log(` Practitioners: ${practitioners.length}`)
  console.log(`   Emails: dr.koffi@clinic.ci, dr.toure@hospital.ci, etc.`)
  console.log(`   Password: [HIDDEN] (Check .env)`)
  console.log('')
  console.log(` Staff: 1`)
  console.log(`   Email: staff@clinic.ci`)
  console.log(`   Password: [HIDDEN] (Check .env)`)
  console.log('')
  console.log(` Specialties: ${allSpecialties.length}`)
  console.log(` Qualifications: ${qualificationsData.length}`)
  console.log(
    ` Appointments: ${appointments.length + 1} (+ 1 teleconsultation)`,
  )
  console.log(` Medical Records: 1`)
  console.log(` Prescriptions: 1`)
  console.log(` Documents: 3`)
  console.log(` Messages: 3`)
  console.log(` Payments: 2`)
  console.log(` Invoices: 1`)
  console.log(` Teleconsultation Sessions: 2`)
  console.log(` Virtual Queue Entries: 4`)
  console.log(` Reviews: 1`)
  console.log(` Notifications: 3`)
  console.log(` Campaigns: 1`)
  console.log(` Vaccination Records: ${vaccinationData.length}`)
  console.log(` Data Export Requests: 2`)
  console.log(` Data Deletion Requests: 1`)
  console.log(` Practitioner Absences: 1`)
  console.log('─────────────────────────────────────')
  console.log('\nYou can now start developing!\n')
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
