import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

// type mapping for tabs
const TYPE_FILTERS: Record<string, string[]> = {
  all: [],
  prescriptions: ['PRESCRIPTION'],
  exams: ['LAB_RESULT', 'RADIOLOGY'],
  certificates: ['CERTIFICATE', 'MEDICAL_REPORT'],
  others: ['CONSENT_FORM', 'INSURANCE', 'OTHER'],
}

export class DocumentsService {
  async getReceivedDocuments(
    userId: string,
    tab: string = 'all',
    search?: string,
    page = 1,
    limit = 12,
  ) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return { data: [], total: 0, counts: this.emptyCounts() }

    const skip = (page - 1) * limit
    const typeFilter = TYPE_FILTERS[tab] || []

    // documents belonging to this patient (via medicalRecord or direct patientId)
    // that were uploaded by a practitioner
    const baseWhere: Prisma.DocumentWhereInput = {
      OR: [
        { medicalRecord: { patientId: patient.id } },
        { patientId: patient.id, practitionerId: { not: null } },
      ],
    }

    const where: Prisma.DocumentWhereInput = { ...baseWhere }

    if (typeFilter.length > 0) {
      where.type = { in: typeFilter as any }
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [documents, total, counts] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          practitioner: {
            select: {
              firstName: true,
              lastName: true,
              title: true,
            },
          },
          medicalRecord: {
            select: {
              practitioner: {
                select: {
                  firstName: true,
                  lastName: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.document.count({ where }),
      this.getReceivedCounts(patient.id, search),
    ])

    const data = documents.map((doc) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt.toISOString(),
      practitioner: doc.practitioner
        ? {
            firstName: doc.practitioner.firstName,
            lastName: doc.practitioner.lastName,
            title: doc.practitioner.title,
          }
        : doc.medicalRecord?.practitioner
          ? {
              firstName: doc.medicalRecord.practitioner.firstName,
              lastName: doc.medicalRecord.practitioner.lastName,
              title: doc.medicalRecord.practitioner.title,
            }
          : null,
    }))

    return { data, total, counts }
  }

  // uploaded by the patient themselves (for medical record).
  async getPatientOwnDocuments(
    userId: string,
    tab: string = 'all',
    search?: string,
    page = 1,
    limit = 12,
  ) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return { data: [], total: 0, counts: this.emptyCounts() }

    const skip = (page - 1) * limit
    const typeFilter = TYPE_FILTERS[tab] || []

    // Patient uploaded docs is whenpatientId matches and no practitionerId
    const baseWhere: Prisma.DocumentWhereInput = {
      patientId: patient.id,
      practitionerId: null,
      medicalRecordId: null,
    }

    const where: Prisma.DocumentWhereInput = { ...baseWhere }

    if (typeFilter.length > 0) {
      where.type = { in: typeFilter as any }
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [documents, total, counts] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.document.count({ where }),
      this.getPatientOwnCounts(patient.id, search),
    ])

    const data = documents.map((doc) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt.toISOString(),
    }))

    return { data, total, counts }
  }

  // get for download/view, verifying access rights
  async getDocumentForAccess(userId: string, documentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return null

    // check if  patient has access (direct or  medical record)
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { patientId: patient.id },
          { medicalRecord: { patientId: patient.id } },
        ],
      },
    })

    return document
  }

  async uploadPatientDocument(
    userId: string,
    data: {
      type: string
      title: string
      description?: string
      fileName: string
      filePath: string
      fileSize: number
      mimeType: string
    },
  ) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) throw new Error('Patient non trouvé')

    return prisma.document.create({
      data: {
        patientId: patient.id,
        type: data.type as any,
        title: data.title,
        description: data.description,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        isEncrypted: false,
      },
    })
  }

  async deletePatientDocument(userId: string, documentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) throw new Error('Patient non trouvé')

    const doc = await prisma.document.findFirst({
      where: {
        id: documentId,
        patientId: patient.id,
        practitionerId: null,
        medicalRecordId: null,
      },
    })
    if (!doc) throw new Error('Document non trouvé')

    return prisma.document.delete({ where: { id: documentId } })
  }

  // for tab count indicator, search filters applied
  private async getReceivedCounts(patientId: string, search?: string) {
    const baseWhere: Prisma.DocumentWhereInput = {
      OR: [
        { medicalRecord: { patientId } },
        { patientId, practitionerId: { not: null } },
      ],
    }

    const searchFilter: Prisma.DocumentWhereInput | undefined = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined

    const buildWhere = (types?: string[]): Prisma.DocumentWhereInput => {
      const w: Prisma.DocumentWhereInput = { ...baseWhere }
      if (types && types.length > 0) w.type = { in: types as any }
      if (searchFilter) w.AND = [searchFilter]
      return w
    }

    const [all, prescriptions, exams, certificates, others] = await Promise.all(
      [
        prisma.document.count({ where: buildWhere() }),
        prisma.document.count({
          where: buildWhere(TYPE_FILTERS.prescriptions),
        }),
        prisma.document.count({ where: buildWhere(TYPE_FILTERS.exams) }),
        prisma.document.count({
          where: buildWhere(TYPE_FILTERS.certificates),
        }),
        prisma.document.count({ where: buildWhere(TYPE_FILTERS.others) }),
      ],
    )

    return { all, prescriptions, exams, certificates, others }
  }

  private async getPatientOwnCounts(patientId: string, search?: string) {
    const baseWhere: Prisma.DocumentWhereInput = {
      patientId,
      practitionerId: null,
      medicalRecordId: null,
    }

    const searchFilter: Prisma.DocumentWhereInput | undefined = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined

    const buildWhere = (types?: string[]): Prisma.DocumentWhereInput => {
      const w: Prisma.DocumentWhereInput = { ...baseWhere }
      if (types && types.length > 0) w.type = { in: types as any }
      if (searchFilter) w.AND = [searchFilter]
      return w
    }

    const [all, prescriptions, exams, certificates, others] = await Promise.all(
      [
        prisma.document.count({ where: buildWhere() }),
        prisma.document.count({
          where: buildWhere(TYPE_FILTERS.prescriptions),
        }),
        prisma.document.count({ where: buildWhere(TYPE_FILTERS.exams) }),
        prisma.document.count({
          where: buildWhere(TYPE_FILTERS.certificates),
        }),
        prisma.document.count({ where: buildWhere(TYPE_FILTERS.others) }),
      ],
    )

    return { all, prescriptions, exams, certificates, others }
  }

  private emptyCounts() {
    return { all: 0, prescriptions: 0, exams: 0, certificates: 0, others: 0 }
  }

  // for practitioner to access patient documents
  async getDocumentForPractitionerAccess(
    practitionerId: string,
    patientId: string,
    documentId: string,
  ) {
    // verify practitioner has relation with patient
    const hasRelation = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        patientId,
        status: { not: 'CANCELLED' as any },
      },
    })

    if (!hasRelation) return null

    // check document belongs to patient
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        patientId,
        practitionerId: null,
        medicalRecordId: null,
      },
    })

    return document
  }
}

export const documentsService = new DocumentsService()
