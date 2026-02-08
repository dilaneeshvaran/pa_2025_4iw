import prisma from '../../config/database'
import { AppointmentStatus } from '@prisma/client'
import {
  PatientAppointmentsResult,
  PatientAppointment,
} from './appointments.types'

export class AppointmentsService {
  async getPatientAppointments(
    patientId: string,
    status: 'upcoming' | 'past' | 'all' = 'all',
    limit = 10,
    page = 1,
  ): Promise<PatientAppointmentsResult> {
    const now = new Date()
    const skip = (page - 1) * limit

    const where: any = {
      patientId,
    }

    if (status === 'upcoming') {
      where.appointmentDate = { gte: now }
      where.status = { in: ['PENDING', 'CONFIRMED'] as AppointmentStatus[] }
    } else if (status === 'past') {
      where.OR = [
        { appointmentDate: { lt: now } },
        {
          status: {
            in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] as AppointmentStatus[],
          },
        },
      ]
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appointmentDate: status === 'past' ? 'desc' : 'asc',
        },
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
        },
      }),
      prisma.appointment.count({ where }),
    ])

    const data: PatientAppointment[] = appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      consultationFee: Number(apt.consultationFee),
      practitioner: {
        id: apt.practitioner.id,
        firstName: apt.practitioner.firstName,
        lastName: apt.practitioner.lastName,
        title: apt.practitioner.title,
        specialty: apt.practitioner.specialties[0]?.specialty.name || null,
        photo: null, // todo : add photo field to practitioner
      },
    }))

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getNextAppointment(
    patientId: string,
  ): Promise<PatientAppointment | null> {
    const now = new Date()

    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        appointmentDate: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] as AppointmentStatus[] },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
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
      },
    })

    if (!appointment) {
      return null
    }

    return {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      consultationFee: Number(appointment.consultationFee),
      practitioner: {
        id: appointment.practitioner.id,
        firstName: appointment.practitioner.firstName,
        lastName: appointment.practitioner.lastName,
        title: appointment.practitioner.title,
        specialty:
          appointment.practitioner.specialties[0]?.specialty.name || null,
        photo: null,
      },
    }
  }

  async getPastAppointments(
    patientId: string,
    limit = 5,
  ): Promise<PatientAppointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: 'COMPLETED' as AppointmentStatus,
      },
      take: limit,
      orderBy: {
        appointmentDate: 'desc',
      },
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
      },
    })

    return appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      consultationFee: Number(apt.consultationFee),
      practitioner: {
        id: apt.practitioner.id,
        firstName: apt.practitioner.firstName,
        lastName: apt.practitioner.lastName,
        title: apt.practitioner.title,
        specialty: apt.practitioner.specialties[0]?.specialty.name || null,
        photo: null,
      },
    }))
  }
}

export const appointmentsService = new AppointmentsService()
