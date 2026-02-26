import prisma from '../../config/database'
import { AppointmentStatus } from '@prisma/client'
import type {
  PatientListItem,
  PatientDetail,
  PatientsListResponse,
} from './patients.types'
import type { PatientsListQuery } from './patients.schema'

export class PatientsService {
  async getPatientsList(
    practitionerId: string,
    query: PatientsListQuery,
  ): Promise<PatientsListResponse> {
    const { page, limit, search, sortBy, sortOrder, filter, gender } = query
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // get all distinct patient id who have had appointments with this practitioner
    const patientIdsResult = await prisma.appointment.findMany({
      where: {
        practitionerId,
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    })

    const patientIds = patientIdsResult.map((r) => r.patientId)

    if (patientIds.length === 0) {
      return { patients: [], total: 0, page, limit, totalPages: 0 }
    }

    // we only want patients who have had appointments with this practitioner
    // and then we will apply any filters like search
    const whereClause: any = {
      id: { in: patientIds },
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    if (gender) {
      whereClause.gender = gender
    }

    const total = await prisma.patient.count({ where: whereClause })

    // patients with user info
    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        appointments: {
          where: {
            practitionerId,
            status: { not: AppointmentStatus.CANCELLED },
          },
          orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            type: true,
            status: true,
          },
        },
      },
    })

    // patients to add computed fields
    const processedPatients: PatientListItem[] = patients.map((patient) => {
      const allAppointments = patient.appointments
      const firstAppointment =
        allAppointments.length > 0 ? allAppointments[0] : null

      // "new patuent" = first appointment with this practitioner within last 30 day
      const isNew = firstAppointment
        ? new Date(firstAppointment.appointmentDate) >= thirtyDaysAgo
        : false

      const totalConsultations = allAppointments.filter(
        (a) => a.status === AppointmentStatus.COMPLETED,
      ).length

      const nextAppointment =
        allAppointments.find(
          (a) =>
            new Date(a.appointmentDate) >= now &&
            (a.status === AppointmentStatus.PENDING ||
              a.status === AppointmentStatus.CONFIRMED),
        ) || null

      const completedAppointments = allAppointments
        .filter((a) => a.status === AppointmentStatus.COMPLETED)
        .reverse()
      const lastAppointment =
        completedAppointments.length > 0 ? completedAppointments[0] : null

      return {
        id: patient.id,
        userId: patient.userId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.user.email,
        city: patient.city,
        bloodType: patient.bloodType,
        isNew,
        firstAppointmentDate: firstAppointment
          ? firstAppointment.appointmentDate
          : null,
        totalConsultations,
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              appointmentDate: nextAppointment.appointmentDate,
              startTime: nextAppointment.startTime,
              type: nextAppointment.type,
              status: nextAppointment.status,
            }
          : null,
        lastAppointment: lastAppointment
          ? {
              id: lastAppointment.id,
              appointmentDate: lastAppointment.appointmentDate,
              startTime: lastAppointment.startTime,
              type: lastAppointment.type,
              status: lastAppointment.status,
            }
          : null,
      }
    })

    // apply filter
    let filteredPatients = processedPatients
    if (filter === 'new') {
      filteredPatients = filteredPatients.filter((p) => p.isNew)
    } else if (filter === 'withUpcoming') {
      filteredPatients = filteredPatients.filter((p) => p.nextAppointment)
    } else if (filter === 'withoutUpcoming') {
      filteredPatients = filteredPatients.filter((p) => !p.nextAppointment)
    }

    // apply sorting
    filteredPatients.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
          )
          break
        case 'lastVisit': {
          const dateA = a.lastAppointment
            ? new Date(a.lastAppointment.appointmentDate).getTime()
            : 0
          const dateB = b.lastAppointment
            ? new Date(b.lastAppointment.appointmentDate).getTime()
            : 0
          comparison = dateA - dateB
          break
        }
        case 'nextAppointment': {
          const dateA = a.nextAppointment
            ? new Date(a.nextAppointment.appointmentDate).getTime()
            : Infinity
          const dateB = b.nextAppointment
            ? new Date(b.nextAppointment.appointmentDate).getTime()
            : Infinity
          comparison = dateA - dateB
          break
        }
        case 'totalConsultations':
          comparison = a.totalConsultations - b.totalConsultations
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    //  pagination
    const totalFiltered = filteredPatients.length
    const totalPages = Math.ceil(totalFiltered / limit)
    const paginatedPatients = filteredPatients.slice(
      (page - 1) * limit,
      page * limit,
    )

    return {
      patients: paginatedPatients,
      total: totalFiltered,
      page,
      limit,
      totalPages,
    }
  }

  async getPatientDetail(
    practitionerId: string,
    patientId: string,
  ): Promise<PatientDetail | null> {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // verify that this patient has had an appointment with this practitioner
    const hasRelation = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        patientId,
        status: { not: AppointmentStatus.CANCELLED },
      },
    })

    if (!hasRelation) return null

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        appointments: {
          where: {
            practitionerId,
            status: { not: AppointmentStatus.CANCELLED },
          },
          orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            type: true,
            status: true,
          },
        },
      },
    })

    if (!patient) return null

    const allAppointments = patient.appointments
    const firstAppointment =
      allAppointments.length > 0 ? allAppointments[0] : null

    const isNew = firstAppointment
      ? new Date(firstAppointment.appointmentDate) >= thirtyDaysAgo
      : false

    const totalConsultations = allAppointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    ).length

    const nextAppointment =
      allAppointments.find(
        (a) =>
          new Date(a.appointmentDate) >= now &&
          (a.status === AppointmentStatus.PENDING ||
            a.status === AppointmentStatus.CONFIRMED),
      ) || null

    const completedAppointments = allAppointments
      .filter((a) => a.status === AppointmentStatus.COMPLETED)
      .reverse()
    const lastAppointment =
      completedAppointments.length > 0 ? completedAppointments[0] : null

    return {
      id: patient.id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.user.email,
      city: patient.city,
      address: patient.address,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      height: patient.height ? Number(patient.height) : null,
      weight: patient.weight ? Number(patient.weight) : null,
      isNew,
      firstAppointmentDate: firstAppointment
        ? firstAppointment.appointmentDate
        : null,
      totalConsultations,
      lastAppointment: lastAppointment
        ? {
            id: lastAppointment.id,
            appointmentDate: lastAppointment.appointmentDate,
            startTime: lastAppointment.startTime,
            type: lastAppointment.type,
            status: lastAppointment.status,
          }
        : null,
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            appointmentDate: nextAppointment.appointmentDate,
            startTime: nextAppointment.startTime,
            type: nextAppointment.type,
            status: nextAppointment.status,
          }
        : null,
    }
  }
  async getPatientIdFromUserId(userId: string): Promise<string | null> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    return patient?.id ?? null
  }
}

export const patientsService = new PatientsService()
