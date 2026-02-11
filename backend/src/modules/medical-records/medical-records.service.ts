import prisma from '../../config/database'
import { Prisma } from '@prisma/client'
import {
  UpdateProfileData,
  UpdateAntecedentsData,
  CreateVaccinationData,
} from './medical-records.types'

export class MedicalRecordsService {
  async getPatientProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bloodType: true,
        height: true,
        weight: true,
        allergies: true,
        chronicConditions: true,
        surgicalOperations: true,
      },
    })

    if (!patient) return null

    return {
      ...patient,
      height: patient.height ? Number(patient.height) : null,
      weight: patient.weight ? Number(patient.weight) : null,
    }
  }

  async updatePatientProfile(userId: string, data: UpdateProfileData) {
    const updateData: any = { ...data }

    if (data.height !== undefined) {
      updateData.height = new Prisma.Decimal(data.height)
    }
    if (data.weight !== undefined) {
      updateData.weight = new Prisma.Decimal(data.weight)
    }

    const patient = await prisma.patient.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bloodType: true,
        height: true,
        weight: true,
        allergies: true,
        chronicConditions: true,
        surgicalOperations: true,
      },
    })

    return {
      ...patient,
      height: patient.height ? Number(patient.height) : null,
      weight: patient.weight ? Number(patient.weight) : null,
    }
  }

  async updateAntecedents(userId: string, data: UpdateAntecedentsData) {
    const patient = await prisma.patient.update({
      where: { userId },
      data,
      select: {
        allergies: true,
        chronicConditions: true,
        surgicalOperations: true,
      },
    })
    return patient
  }

  async getConsultations(userId: string, page = 1, limit = 10) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return { data: [], total: 0 }

    const skip = (page - 1) * limit

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          status: { in: ['COMPLETED', 'NO_SHOW'] },
        },
        skip,
        take: limit,
        orderBy: { appointmentDate: 'desc' },
        include: {
          practitioner: {
            include: {
              specialties: {
                where: { isPrimary: true },
                include: { specialty: true },
                take: 1,
              },
            },
          },
          medicalRecord: {
            include: {
              documents: {
                select: {
                  id: true,
                  type: true,
                  title: true,
                  fileName: true,
                  mimeType: true,
                  fileSize: true,
                  uploadedAt: true,
                },
              },
            },
          },
        },
      }),
      prisma.appointment.count({
        where: {
          patientId: patient.id,
          status: { in: ['COMPLETED', 'NO_SHOW'] },
        },
      }),
    ])

    const data = appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      practitioner: {
        firstName: apt.practitioner.firstName,
        lastName: apt.practitioner.lastName,
        title: apt.practitioner.title,
        specialty: apt.practitioner.specialties[0]?.specialty?.name ?? null,
      },
      medicalRecord: apt.medicalRecord
        ? {
            id: apt.medicalRecord.id,
            chiefComplaint: apt.medicalRecord.chiefComplaint,
            diagnosis: apt.medicalRecord.diagnosis,
            treatmentPlan: apt.medicalRecord.treatmentPlan,
            bloodPressure: apt.medicalRecord.bloodPressure,
            heartRate: apt.medicalRecord.heartRate,
            temperature: apt.medicalRecord.temperature
              ? Number(apt.medicalRecord.temperature)
              : null,
            weight: apt.medicalRecord.weight
              ? Number(apt.medicalRecord.weight)
              : null,
            height: apt.medicalRecord.height
              ? Number(apt.medicalRecord.height)
              : null,
            documents: apt.medicalRecord.documents,
          }
        : null,
    }))

    return { data, total }
  }

  async getPrescriptions(userId: string, page = 1, limit = 10) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return { data: [], total: 0 }

    const skip = (page - 1) * limit

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { patientId: patient.id },
        skip,
        take: limit,
        orderBy: { issuedDate: 'desc' },
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
              appointment: {
                select: { appointmentDate: true },
              },
            },
          },
        },
      }),
      prisma.prescription.count({ where: { patientId: patient.id } }),
    ])

    return { data: prescriptions, total }
  }

  async getDocuments(userId: string, type?: string, page = 1, limit = 10) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return { data: [], total: 0 }

    const skip = (page - 1) * limit

    const where: any = {
      medicalRecord: {
        patientId: patient.id,
      },
      type: {
        in: ['LAB_RESULT', 'RADIOLOGY', 'MEDICAL_REPORT', 'OTHER'],
      },
    }

    if (type) {
      where.type = type
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          medicalRecord: {
            select: {
              appointment: {
                select: { appointmentDate: true },
              },
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
    ])

    return { data: documents, total }
  }

  async getDocumentForDownload(userId: string, documentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return null

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        medicalRecord: {
          patientId: patient.id,
        },
      },
    })

    return document
  }

  async getVaccinations(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) return []

    return prisma.vaccinationRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { administeredAt: 'desc' },
    })
  }

  async createVaccination(userId: string, data: CreateVaccinationData) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) throw new Error('Patient non trouvé')

    return prisma.vaccinationRecord.create({
      data: {
        patientId: patient.id,
        vaccineName: data.vaccineName,
        vaccineType: data.vaccineType,
        manufacturer: data.manufacturer,
        batchNumber: data.batchNumber,
        doseNumber: data.doseNumber ?? 1,
        administeredAt: new Date(data.administeredAt),
        administeredBy: data.administeredBy,
        location: data.location,
        nextDoseDate: data.nextDoseDate ? new Date(data.nextDoseDate) : null,
        sideEffects: data.sideEffects,
      },
    })
  }

  async deleteVaccination(userId: string, vaccinationId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!patient) throw new Error('Patient non trouvé')

    const record = await prisma.vaccinationRecord.findFirst({
      where: { id: vaccinationId, patientId: patient.id },
    })
    if (!record) throw new Error('Vaccination non trouvée')

    return prisma.vaccinationRecord.delete({
      where: { id: vaccinationId },
    })
  }
}

export const medicalRecordsService = new MedicalRecordsService()
