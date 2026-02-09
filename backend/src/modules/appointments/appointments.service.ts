import prisma from '../../config/database'
import { AppointmentStatus, AppointmentType } from '@prisma/client'
import {
  PatientAppointmentsResult,
  PatientAppointment,
  CreateAppointmentData,
  AppointmentCreatedResult,
} from './appointments.types'
import { isSlotReserved, releaseSlotReservation } from '../../config/redis'
import { sendAppointmentConfirmationEmail } from '../../utils/email'
import { scheduleAppointmentReminders } from '../../utils/reminder-scheduler'

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

  async createAppointment(
    data: CreateAppointmentData,
  ): Promise<AppointmentCreatedResult> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: data.practitionerId },
      include: {
        user: { select: { status: true } },
        specialties: {
          where: { isPrimary: true },
          include: { specialty: true },
          take: 1,
        },
      },
    })

    if (!practitioner) {
      throw new Error('Praticien non trouvé')
    }

    if (!practitioner.acceptsNewPatients) {
      throw new Error("Ce praticien n'accepte pas de nouveaux patients")
    }

    if (practitioner.user.status !== 'ACTIVE') {
      throw new Error("Ce praticien n'est pas disponible")
    }

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      include: {
        user: { select: { email: true } },
      },
    })

    if (!patient) {
      throw new Error('Profil patient non trouvé')
    }

    // check patient penalty
    if (patient.penaltyUntil && patient.penaltyUntil > new Date()) {
      throw new Error(
        "Vous ne pouvez pas prendre de rendez-vous en raison d'absences répétées",
      )
    }

    const appointmentDate = new Date(data.appointmentDate)
    appointmentDate.setHours(0, 0, 0, 0)

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (appointmentDate < now) {
      throw new Error('La date du rendez-vous ne peut pas être dans le passé')
    }

    // check if slot is reserved by another user
    const isReserved = await isSlotReserved(
      data.practitionerId,
      data.appointmentDate,
      data.startTime,
      data.patientId, // xclude current patient
    )

    if (isReserved) {
      throw new Error("Ce créneau vient d'être réservé par un autre patient")
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        practitionerId: data.practitionerId,
        appointmentDate,
        startTime: data.startTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (existingAppointment) {
      throw new Error("Ce créneau n'est plus disponible")
    }

    const duration = practitioner.consultationDuration
    const [hours, minutes] = data.startTime.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + duration
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    const consultationFee =
      data.type === 'TELECONSULTATION' && practitioner.teleconsultationFee
        ? practitioner.teleconsultationFee
        : practitioner.baseConsultationFee

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        practitionerId: data.practitionerId,
        appointmentDate,
        startTime: data.startTime,
        endTime,
        duration,
        type: data.type as AppointmentType,
        status: 'CONFIRMED',
        reason: data.reason || null,
        consultationFee,
      },
    })

    await releaseSlotReservation(
      data.practitionerId,
      data.appointmentDate,
      data.startTime,
    )

    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    try {
      await sendAppointmentConfirmationEmail(patient.user.email, {
        patientName: `${patient.firstName} ${patient.lastName}`,
        practitionerTitle: practitioner.title,
        practitionerFirstName: practitioner.firstName,
        practitionerLastName: practitioner.lastName,
        practitionerSpecialty:
          practitioner.specialties[0]?.specialty.name || 'Médecine générale',
        appointmentDate: formattedDate,
        appointmentTime: data.startTime,
        consultationType: data.type,
        consultationFee: Number(consultationFee),
        clinicAddress: practitioner.address,
        appointmentId: appointment.id,
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // dont fail the appointment creation if email fails
    }

    try {
      await scheduleAppointmentReminders(
        appointment.id,
        appointmentDate,
        data.startTime,
      )
    } catch (reminderError) {
      console.error('Failed to schedule reminders:', reminderError)
      // dont fail the appointment creation if reminders fail
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
        id: practitioner.id,
        firstName: practitioner.firstName,
        lastName: practitioner.lastName,
        title: practitioner.title,
        specialty: practitioner.specialties[0]?.specialty.name || null,
      },
    }
  }
}

export const appointmentsService = new AppointmentsService()
