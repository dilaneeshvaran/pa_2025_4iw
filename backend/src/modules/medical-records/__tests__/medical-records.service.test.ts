import { MedicalRecordsService } from '../medical-records.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    appointment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    prescription: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    vaccinationRecord: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const decimalLike = (value: number) => ({
  value,
  valueOf: () => value,
  toString: () => String(value),
})

const patientProfile = {
  id: 'patient-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
  gender: 'FEMALE',
  phone: '+22500000000',
  address: '1 rue des Tests',
  city: 'Abidjan',
  country: 'CI',
  bloodType: 'A+',
  height: decimalLike(170),
  weight: decimalLike(62.5),
  allergies: ['pollen'],
  chronicConditions: [],
  surgicalOperations: [],
}

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService

  beforeEach(() => {
    service = new MedicalRecordsService()
    jest.clearAllMocks()
  })

  describe('profil patient', () => {
    it('retourne null si aucun patient ne correspond au userId', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null)

      await expect(service.getPatientProfile('user-1')).resolves.toBeNull()
    })

    it('retourne le profil avec height et weight convertis en nombres', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientProfile as any)

      const result = await service.getPatientProfile('user-1')

      expect(result).toEqual(
        expect.objectContaining({
          id: 'patient-1',
          height: 170,
          weight: 62.5,
        }),
      )
    })

    it('met à jour le profil avec des Decimal Prisma pour les mesures', async () => {
      mockPrisma.patient.update.mockResolvedValue({
        ...patientProfile,
        height: decimalLike(171),
        weight: decimalLike(63),
      } as any)

      const result = await service.updatePatientProfile('user-1', {
        height: 171,
        weight: 63,
        city: 'Yamoussoukro',
      } as any)

      expect(result.height).toBe(171)
      expect(result.weight).toBe(63)
      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          city: 'Yamoussoukro',
          height: expect.objectContaining({ value: 171 }),
          weight: expect.objectContaining({ value: 63 }),
        }),
        select: expect.any(Object),
      })
    })

    it('met à jour les antécédents médicaux séparément', async () => {
      const antecedents = {
        allergies: ['arachide'],
        chronicConditions: ['asthme'],
        surgicalOperations: ['appendicectomie'],
      }
      mockPrisma.patient.update.mockResolvedValue(antecedents as any)

      await expect(
        service.updateAntecedents('user-1', antecedents),
      ).resolves.toEqual(antecedents)
      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: antecedents,
        select: {
          allergies: true,
          chronicConditions: true,
          surgicalOperations: true,
        },
      })
    })
  })

  describe('consultations, prescriptions et documents', () => {
    beforeEach(() => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' } as any)
    })

    it('retourne une pagination vide si le patient est introuvable', async () => {
      mockPrisma.patient.findUnique.mockResolvedValueOnce(null)

      await expect(service.getConsultations('missing')).resolves.toEqual({
        data: [],
        total: 0,
      })
    })

    it('filtre les consultations sur COMPLETED et NO_SHOW avec pagination', async () => {
      const appointment = {
        id: 'appointment-1',
        appointmentDate: new Date('2026-07-01T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '09:30',
        type: 'IN_PERSON',
        status: 'COMPLETED',
        reason: 'Suivi',
        practitioner: {
          firstName: 'Grace',
          lastName: 'Hopper',
          title: 'Dr',
          specialties: [{ specialty: { name: 'Cardiologie' } }],
        },
        medicalRecord: {
          id: 'record-1',
          chiefComplaint: 'Douleur',
          diagnosis: 'RAS',
          treatmentPlan: 'Repos',
          bloodPressure: '120/80',
          heartRate: 70,
          temperature: decimalLike(37.2),
          weight: decimalLike(62),
          height: decimalLike(170),
          documents: [],
        },
      }
      mockPrisma.appointment.findMany.mockResolvedValue([appointment] as any)
      mockPrisma.appointment.count.mockResolvedValue(1 as any)

      const result = await service.getConsultations('user-1', 2, 5)

      expect(result.data[0]?.practitioner.specialty).toBe('Cardiologie')
      expect(result.data[0]?.medicalRecord?.temperature).toBe(37.2)
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            patientId: 'patient-1',
            status: { in: ['COMPLETED', 'NO_SHOW'] },
          },
          skip: 5,
          take: 5,
        }),
      )
    })

    it('retourne les prescriptions du patient avec total', async () => {
      mockPrisma.prescription.findMany.mockResolvedValue([
        { id: 'prescription-1' },
      ] as any)
      mockPrisma.prescription.count.mockResolvedValue(1 as any)

      await expect(service.getPrescriptions('user-1')).resolves.toEqual({
        data: [{ id: 'prescription-1' }],
        total: 1,
      })
      expect(mockPrisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'patient-1' },
          skip: 0,
          take: 10,
        }),
      )
    })

    it('filtre les documents médicaux par type si demandé', async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ id: 'doc-1' }] as any)
      mockPrisma.document.count.mockResolvedValue(1 as any)

      await expect(service.getDocuments('user-1', 'LAB_RESULT', 3, 4)).resolves.toEqual({
        data: [{ id: 'doc-1' }],
        total: 1,
      })
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            medicalRecord: { patientId: 'patient-1' },
            type: 'LAB_RESULT',
          },
          skip: 8,
          take: 4,
        }),
      )
    })

    it('récupère un document seulement pour le patient propriétaire', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' } as any)

      await expect(
        service.getDocumentForDownload('user-1', 'doc-1'),
      ).resolves.toEqual({ id: 'doc-1' })
      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-1',
          medicalRecord: { patientId: 'patient-1' },
        },
      })
    })
  })

  describe('vaccinations', () => {
    beforeEach(() => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' } as any)
    })

    it('liste les vaccinations du patient par date décroissante', async () => {
      mockPrisma.vaccinationRecord.findMany.mockResolvedValue([
        { id: 'vaccination-1' },
      ] as any)

      await expect(service.getVaccinations('user-1')).resolves.toEqual([
        { id: 'vaccination-1' },
      ])
      expect(mockPrisma.vaccinationRecord.findMany).toHaveBeenCalledWith({
        where: { patientId: 'patient-1' },
        orderBy: { administeredAt: 'desc' },
      })
    })

    it('crée une vaccination avec doseNumber à 1 par défaut', async () => {
      mockPrisma.vaccinationRecord.create.mockResolvedValue({
        id: 'vaccination-1',
      } as any)

      await service.createVaccination('user-1', {
        vaccineName: 'BCG',
        administeredAt: '2026-07-08',
      } as any)

      expect(mockPrisma.vaccinationRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          patientId: 'patient-1',
          vaccineName: 'BCG',
          doseNumber: 1,
          administeredAt: new Date('2026-07-08'),
        }),
      })
    })

    it('supprime une vaccination après vérification du propriétaire', async () => {
      mockPrisma.vaccinationRecord.findFirst.mockResolvedValue({
        id: 'vaccination-1',
      } as any)
      mockPrisma.vaccinationRecord.delete.mockResolvedValue({
        id: 'vaccination-1',
      } as any)

      await expect(
        service.deleteVaccination('user-1', 'vaccination-1'),
      ).resolves.toEqual({ id: 'vaccination-1' })
      expect(mockPrisma.vaccinationRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 'vaccination-1', patientId: 'patient-1' },
      })
      expect(mockPrisma.vaccinationRecord.delete).toHaveBeenCalledWith({
        where: { id: 'vaccination-1' },
      })
    })

    it('rejette la suppression si la vaccination ne correspond pas au patient', async () => {
      mockPrisma.vaccinationRecord.findFirst.mockResolvedValue(null)

      await expect(
        service.deleteVaccination('user-1', 'missing'),
      ).rejects.toThrow('Vaccination non trouvée')
    })
  })
})
