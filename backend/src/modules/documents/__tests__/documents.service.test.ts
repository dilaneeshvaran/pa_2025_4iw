import { DocumentsService } from '../documents.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    appointment: {
      findFirst: jest.fn(),
    },
    document: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const uploadedAt = new Date('2026-07-08T10:00:00.000Z')

const receivedDocument = {
  id: 'doc-1',
  type: 'LAB_RESULT',
  title: 'Bilan sanguin',
  description: 'Résultats',
  fileName: 'bilan.pdf',
  fileSize: 1234,
  mimeType: 'application/pdf',
  uploadedAt,
  practitioner: { firstName: 'Grace', lastName: 'Hopper', title: 'Dr' },
  medicalRecord: null,
}

describe('DocumentsService', () => {
  let service: DocumentsService

  beforeEach(() => {
    service = new DocumentsService()
    jest.clearAllMocks()
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' } as any)
    mockPrisma.document.count.mockResolvedValue(0 as any)
  })

  describe('documents reçus', () => {
    it('retourne une réponse vide si le patient est introuvable', async () => {
      mockPrisma.patient.findUnique.mockResolvedValueOnce(null)

      await expect(service.getReceivedDocuments('missing')).resolves.toEqual({
        data: [],
        total: 0,
        counts: { all: 0, prescriptions: 0, exams: 0, certificates: 0, others: 0 },
      })
    })

    it('filtre par onglet, recherche et pagination', async () => {
      mockPrisma.document.findMany.mockResolvedValue([receivedDocument] as any)
      mockPrisma.document.count
        .mockResolvedValueOnce(1 as any)
        .mockResolvedValueOnce(7 as any)
        .mockResolvedValueOnce(2 as any)
        .mockResolvedValueOnce(1 as any)
        .mockResolvedValueOnce(3 as any)
        .mockResolvedValueOnce(1 as any)

      const result = await service.getReceivedDocuments(
        'user-1',
        'exams',
        'bilan',
        2,
        6,
      )

      expect(result.data).toEqual([
        expect.objectContaining({
          id: 'doc-1',
          uploadedAt: '2026-07-08T10:00:00.000Z',
          practitioner: { firstName: 'Grace', lastName: 'Hopper', title: 'Dr' },
        }),
      ])
      expect(result.total).toBe(1)
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { medicalRecord: { patientId: 'patient-1' } },
              { patientId: 'patient-1', practitionerId: { not: null } },
            ],
            type: { in: ['LAB_RESULT', 'RADIOLOGY'] },
            AND: [
              {
                OR: [
                  { title: { contains: 'bilan', mode: 'insensitive' } },
                  { description: { contains: 'bilan', mode: 'insensitive' } },
                  { fileName: { contains: 'bilan', mode: 'insensitive' } },
                ],
              },
            ],
          }),
          skip: 6,
          take: 6,
        }),
      )
    })
  })

  describe('documents du patient', () => {
    it('limite les documents propres aux fichiers uploadés par le patient', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...receivedDocument, practitioner: undefined, medicalRecord: undefined },
      ] as any)
      mockPrisma.document.count.mockResolvedValue(1 as any)

      await service.getPatientOwnDocuments('user-1', 'all', undefined, 1, 12)

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            patientId: 'patient-1',
            practitionerId: null,
            medicalRecordId: null,
          },
        }),
      )
    })

    it("vérifie l'accès patient par patientId direct ou dossier médical", async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' } as any)

      await expect(
        service.getDocumentForAccess('user-1', 'doc-1'),
      ).resolves.toEqual({ id: 'doc-1' })
      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-1',
          OR: [
            { patientId: 'patient-1' },
            { medicalRecord: { patientId: 'patient-1' } },
          ],
        },
      })
    })

    it('upload un document patient avec les métadonnées fichier', async () => {
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-1' } as any)

      await service.uploadPatientDocument('user-1', {
        type: 'OTHER',
        title: 'Compte rendu',
        description: 'Document personnel',
        fileName: 'cr.pdf',
        filePath: '/uploads/cr.pdf',
        fileSize: 42,
        mimeType: 'application/pdf',
      })

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          patientId: 'patient-1',
          type: 'OTHER',
          title: 'Compte rendu',
          description: 'Document personnel',
          fileName: 'cr.pdf',
          filePath: '/uploads/cr.pdf',
          fileSize: 42,
          mimeType: 'application/pdf',
          isEncrypted: false,
        },
      })
    })

    it('supprime seulement un document propre au patient', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' } as any)
      mockPrisma.document.delete.mockResolvedValue({ id: 'doc-1' } as any)

      await expect(
        service.deletePatientDocument('user-1', 'doc-1'),
      ).resolves.toEqual({ id: 'doc-1' })
      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-1',
          patientId: 'patient-1',
          practitionerId: null,
          medicalRecordId: null,
        },
      })
    })
  })

  describe('accès praticien', () => {
    it('refuse un document si aucun rendez-vous non annulé ne relie le praticien au patient', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null)

      await expect(
        service.getDocumentForPractitionerAccess(
          'practitioner-1',
          'patient-1',
          'doc-1',
        ),
      ).resolves.toBeNull()
      expect(mockPrisma.document.findFirst).not.toHaveBeenCalled()
    })

    it('autorise un praticien lié à récupérer un document du patient', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'appointment-1' } as any)
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' } as any)

      await expect(
        service.getDocumentForPractitionerAccess(
          'practitioner-1',
          'patient-1',
          'doc-1',
        ),
      ).resolves.toEqual({ id: 'doc-1' })
      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-1',
          patientId: 'patient-1',
          OR: [
            { practitionerId: null, medicalRecordId: null },
            { practitionerId: 'practitioner-1' },
          ],
        },
      })
    })

    it('upload un document praticien pour un patient lié', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        id: 'practitioner-1',
      } as any)
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'appointment-1' } as any)
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-1' } as any)

      await service.uploadDocumentForPatient('practitioner-user', 'patient-1', {
        type: 'PRESCRIPTION',
        title: 'Ordonnance',
        fileName: 'ordonnance.pdf',
        filePath: '/uploads/ordonnance.pdf',
        fileSize: 123,
        mimeType: 'application/pdf',
      })

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          patientId: 'patient-1',
          practitionerId: 'practitioner-1',
          type: 'PRESCRIPTION',
          isEncrypted: false,
        }),
      })
    })
  })
})
