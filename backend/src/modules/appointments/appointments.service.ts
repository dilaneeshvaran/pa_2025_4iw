import prisma from '../../config/database'
import { getClientLocalTime } from '../../utils/timezone'
import { AppointmentStatus, AppointmentType } from '@prisma/client'
import {
  PatientAppointmentsResult,
  PatientAppointment,
  CreateAppointmentData,
  AppointmentCreatedResult,
  UpdateAppointmentData,
} from './appointments.types'
import { isSlotReserved, releaseSlotReservation } from '../../config/redis'
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancelledByPatientEmail,
  sendAppointmentModifiedByPatientEmail,
  sendEarlierSlotAlertEmail,
} from '../../utils/email'
import {
  scheduleAppointmentReminders,
  cancelAppointmentReminders,
} from '../../utils/reminder-scheduler'

function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const appointmentTime = new Date(date)
  if (process.env.TZ === 'UTC') {
    appointmentTime.setUTCHours(hours, minutes, 0, 0)
  } else {
    const [year, month, day] = date.toISOString().slice(0, 10).split('-').map(Number)
    appointmentTime.setFullYear(year, month - 1, day)
    appointmentTime.setHours(hours, minutes, 0, 0)
  }
  return appointmentTime
}

export class AppointmentsService {
  async getPatientAppointments(
    patientId: string,
    status: 'upcoming' | 'past' | 'cancelled' | 'all' = 'all',
    limit = 10,
    page = 1,
    sort?: 'asc' | 'desc',
  ): Promise<PatientAppointmentsResult> {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const now = new Date()
    const skip = (page - 1) * limit

    const where: any = {
      patientId,
    }

    // determine default sort direction based on tab
    const orderDirection = sort || (status === 'past' ? 'desc' : 'asc')

    if (status === 'upcoming') {
      where.appointmentDate = { gte: today }
      where.status = { in: ['PENDING', 'CONFIRMED'] as AppointmentStatus[] }
    } else if (status === 'past') {
      where.OR = [
        { appointmentDate: { lt: today } },
        {
          status: {
            in: ['COMPLETED', 'NO_SHOW'] as AppointmentStatus[],
          },
        },
      ]
      // xclude cancelled from past
      where.status = { not: 'CANCELLED' as AppointmentStatus }
    } else if (status === 'cancelled') {
      where.status = 'CANCELLED' as AppointmentStatus
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appointmentDate: orderDirection,
        },
        include: {
          practitioner: {
            include: {
              specialties: {
                where: { isPrimary: true },
                include: { specialty: true },
                take: 1,
              },
              cabinets: {
                where: {
                  leftAt: null,
                  isPaused: false,
                  cabinet: { isVerified: true },
                },
                include: { cabinet: true },
              },
            },
          },
          cabinet: {
            select: { id: true, name: true, address: true, city: true },
          },
          teleconsultationSession: {
            select: {
              id: true,
              roomId: true,
              roomName: true,
              status: true,
              duration: true,
              startedAt: true,
              endedAt: true,
              connectionQuality: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ])

    // post filter : for 'upcoming'  exclude today's appointments whihc time has passed
    let filteredAppointments = appointments
    let adjustedTotal = total

    if (status === 'upcoming') {
      filteredAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate)
        aptDate.setUTCHours(0, 0, 0, 0)
        if (aptDate.getTime() === today.getTime()) {
          const appointmentTime = combineDateAndTime(aptDate, apt.startTime)
          return appointmentTime > now
        }
        return true
      })
      // adjust total count by the number of filtered-out items
      const removedCount = appointments.length - filteredAppointments.length
      adjustedTotal = Math.max(0, total - removedCount)
    }

    const data: PatientAppointment[] = filteredAppointments.map((apt) => {
      const activeCabinet =
        apt.practitioner.cabinets && apt.practitioner.cabinets.length > 0
          ? apt.practitioner.cabinets[0].cabinet
          : null

      return {
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        reason: apt.reason,
        consultationFee: Number(apt.consultationFee),
        earlierSlotAlertEnabled: apt.earlierSlotAlertEnabled,
        practitioner: {
          id: apt.practitioner.id,
          firstName: apt.practitioner.firstName,
          lastName: apt.practitioner.lastName,
          title: apt.practitioner.title,
          specialty: apt.practitioner.specialties[0]?.specialty.name || null,
          photo: null,
          address: activeCabinet
            ? activeCabinet.address
            : apt.practitioner.address || null,
          city: activeCabinet
            ? activeCabinet.city
            : apt.practitioner.city || null,
          cancellationNotice: apt.practitioner.cancellationNotice,
        },
        cabinet: apt.cabinet || null,
        teleconsultationSession: apt.teleconsultationSession || null,
        review: apt.review || null,
      }
    })

    return {
      data,
      total: adjustedTotal,
      page,
      limit,
      totalPages: Math.ceil(adjustedTotal / limit),
    }
  }

  async getNextAppointment(
    patientId: string,
  ): Promise<PatientAppointment | null> {
    const now = new Date()
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const utcToday = new Date()
    utcToday.setUTCHours(0, 0, 0, 0)
    const queryDate = new Date(utcToday)
    queryDate.setDate(queryDate.getDate() - 1)
 
    // fetch potential next appointments starting from queryDate
    // checking a reasonable number to find the first valid one
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        appointmentDate: { gte: queryDate },
        status: { in: ['PENDING', 'CONFIRMED'] as AppointmentStatus[] },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      take: 20, // check first 10, usually enough
      include: {
        practitioner: {
          include: {
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
              take: 1,
            },
            cabinets: {
              where: {
                leftAt: null,
                isPaused: false,
                cabinet: { isVerified: true },
              },
              include: { cabinet: true },
            },
          },
        },
        cabinet: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
    })

    // find first appointment that is in the future
    const nextAppointment = appointments.find((apt) => {
      const aptDate = new Date(apt.appointmentDate)
      const localAptDate = new Date(aptDate)
      localAptDate.setUTCHours(0, 0, 0, 0)

      if (localAptDate < today) {
        return false
      }
 
      if (localAptDate.getTime() === today.getTime()) {
        const appointmentTime = combineDateAndTime(aptDate, apt.startTime)
        return appointmentTime > now
      }
      return true // future date
    })

    if (!nextAppointment) {
      return null
    }

    const activeCabinet =
      nextAppointment.practitioner.cabinets &&
      nextAppointment.practitioner.cabinets.length > 0
        ? nextAppointment.practitioner.cabinets[0].cabinet
        : null

    return {
      id: nextAppointment.id,
      appointmentDate: nextAppointment.appointmentDate,
      startTime: nextAppointment.startTime,
      endTime: nextAppointment.endTime,
      type: nextAppointment.type,
      status: nextAppointment.status,
      reason: nextAppointment.reason,
      consultationFee: Number(nextAppointment.consultationFee),
      earlierSlotAlertEnabled: nextAppointment.earlierSlotAlertEnabled,
      practitioner: {
        id: nextAppointment.practitioner.id,
        firstName: nextAppointment.practitioner.firstName,
        lastName: nextAppointment.practitioner.lastName,
        title: nextAppointment.practitioner.title,
        specialty:
          nextAppointment.practitioner.specialties[0]?.specialty.name || null,
        photo: null,
        address: activeCabinet
          ? activeCabinet.address
          : nextAppointment.practitioner.address || null,
        city: activeCabinet
          ? activeCabinet.city
          : nextAppointment.practitioner.city || null,
        cancellationNotice: nextAppointment.practitioner.cancellationNotice,
      },
      cabinet: nextAppointment.cabinet || null,
    }
  }

  async getPastAppointments(
    patientId: string,
    limit = 5,
  ): Promise<PatientAppointment[]> {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const now = new Date()

    const utcToday = new Date()
    utcToday.setUTCHours(0, 0, 0, 0)
    const queryDate = new Date(utcToday)
    queryDate.setDate(queryDate.getDate() + 1)
 
    // fetch slightly more to filter in memory
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        OR: [
          { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] as AppointmentStatus[] } },
          { appointmentDate: { lte: queryDate } }, // fetch lte queryDate
        ],
      },
      take: limit * 4, // fetch more to filter
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
            cabinets: {
              where: {
                leftAt: null,
                isPaused: false,
                cabinet: { isVerified: true },
              },
              include: { cabinet: true },
            },
          },
        },
        cabinet: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
    })

    // filter to ensure "Today" items are actually in the past
    const filtered = appointments.filter((apt) => {
      // if status is final, it's past
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status)) {
        return true
      }
 
      const aptDate = new Date(apt.appointmentDate)
      const localAptDate = new Date(aptDate)
      localAptDate.setUTCHours(0, 0, 0, 0)

      if (localAptDate < today) {
        return true
      }
 
      if (localAptDate.getTime() === today.getTime()) {
        const appointmentTime = combineDateAndTime(aptDate, apt.startTime)
        return appointmentTime < now
      }
 
      return false
    })

    // slice to limit
    return filtered.slice(0, limit).map((apt) => {
      const activeCabinet =
        apt.practitioner.cabinets && apt.practitioner.cabinets.length > 0
          ? apt.practitioner.cabinets[0].cabinet
          : null

      return {
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        reason: apt.reason,
        consultationFee: Number(apt.consultationFee),
        earlierSlotAlertEnabled: apt.earlierSlotAlertEnabled,
        practitioner: {
          id: apt.practitioner.id,
          firstName: apt.practitioner.firstName,
          lastName: apt.practitioner.lastName,
          title: apt.practitioner.title,
          specialty: apt.practitioner.specialties[0]?.specialty.name || null,
          photo: null,
          address: activeCabinet
            ? activeCabinet.address
            : apt.practitioner.address || null,
          city: activeCabinet
            ? activeCabinet.city
            : apt.practitioner.city || null,
          cancellationNotice: apt.practitioner.cancellationNotice,
        },
        cabinet: apt.cabinet || null,
      }
    })
  }

  async validateSlotBooking(data: {
    practitionerId: string
    appointmentDate: string
    startTime: string
    patientId: string
    excludeAppointmentId?: string
    timezoneOffset?: string
  }): Promise<void> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: data.practitionerId },
      include: {
        user: { select: { status: true } },
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
    })

    if (!patient) {
      throw new Error('Profil patient non trouvé')
    }

    if (patient.penaltyUntil && patient.penaltyUntil > new Date()) {
      throw new Error(
        "Vous ne pouvez pas prendre de rendez-vous en raison d'absences répétées",
      )
    }

    const appointmentDate = new Date(data.appointmentDate)
    appointmentDate.setUTCHours(0, 0, 0, 0)

    const now = new Date()
    const clientLocalTime = getClientLocalTime(now, data.timezoneOffset)
    const today = new Date(clientLocalTime)
    today.setUTCHours(0, 0, 0, 0)

    if (appointmentDate < today) {
      throw new Error('La date du rendez-vous ne peut pas être dans le passé')
    }

    const maxAdvanceDays = practitioner.maxBookingAdvance || 60
    const maxDate = new Date(clientLocalTime)
    maxDate.setUTCDate(maxDate.getUTCDate() + maxAdvanceDays)
    if (appointmentDate > maxDate) {
      throw new Error(
        `Vous ne pouvez pas réserver plus de ${maxAdvanceDays} jours à l'avance`,
      )
    }

    const minNoticeMinutes = practitioner.minBookingNotice || 60
    const [requestHours, requestMinutes] = data.startTime.split(':').map(Number)
    const requestedAppointmentTime = new Date(appointmentDate)
    requestedAppointmentTime.setUTCHours(requestHours, requestMinutes, 0, 0)

    const earliestBookable = new Date(
      clientLocalTime.getTime() + minNoticeMinutes * 60 * 1000,
    )
    if (requestedAppointmentTime < earliestBookable) {
      const noticeLabel =
        minNoticeMinutes >= 60
          ? `${Math.round(minNoticeMinutes / 60)} heure(s)`
          : `${minNoticeMinutes} minutes`
      throw new Error(`Vous devez réserver au moins ${noticeLabel} à l'avance`)
    }

    if (practitioner.newPatientMaxPerDay > 0) {
      const previousAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: data.patientId,
          practitionerId: data.practitionerId,
          status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
          appointmentDate: { lt: today },
        },
      })

      if (!previousAppointment) {
        const existingNewPatientsToday = await prisma.appointment.findMany({
          where: {
            practitionerId: data.practitionerId,
            appointmentDate: appointmentDate,
            status: { in: ['PENDING', 'CONFIRMED'] },
            id: data.excludeAppointmentId ? { not: data.excludeAppointmentId } : undefined,
          },
          select: { patientId: true },
          distinct: ['patientId'],
        })

        let newPatientCount = 0
        for (const apt of existingNewPatientsToday) {
          const prior = await prisma.appointment.findFirst({
            where: {
              patientId: apt.patientId,
              practitionerId: data.practitionerId,
              status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
              appointmentDate: { lt: today },
            },
          })
          if (!prior) newPatientCount++
        }

        if (newPatientCount >= practitioner.newPatientMaxPerDay) {
          throw new Error(
            `Le praticien a atteint la limite de ${practitioner.newPatientMaxPerDay} nouveau(x) patient(s) par jour`,
          )
        }
      }
    }

    const patientExistingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: data.patientId,
        appointmentDate,
        startTime: data.startTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
        id: data.excludeAppointmentId ? { not: data.excludeAppointmentId } : undefined,
      },
    })

    if (patientExistingAppointment) {
      throw new Error(
        'Vous avez déjà un rendez-vous à cette date et à cette heure',
      )
    }

    const sameDaySameDoctor = await prisma.appointment.findFirst({
      where: {
        patientId: data.patientId,
        practitionerId: data.practitionerId,
        appointmentDate: appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
        id: data.excludeAppointmentId ? { not: data.excludeAppointmentId } : undefined,
      },
    })

    if (sameDaySameDoctor) {
      throw new Error(
        'Vous avez déjà un rendez-vous avec ce praticien ce jour-là',
      )
    }

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        patientId: data.patientId,
        appointmentDate: appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
        id: data.excludeAppointmentId ? { not: data.excludeAppointmentId } : undefined,
      },
    })

    const duration = practitioner.consultationDuration
    const requestedEndTime = new Date(
      requestedAppointmentTime.getTime() + duration * 60000,
    )

    for (const apt of dayAppointments) {
      const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number)
      const aptStartTime = new Date(appointmentDate)
      aptStartTime.setUTCHours(aptHours, aptMinutes, 0, 0)

      const [aptEndHours, aptEndMinutes] = apt.endTime.split(':').map(Number)
      const aptEndTime = new Date(appointmentDate)
      aptEndTime.setUTCHours(aptEndHours, aptEndMinutes, 0, 0)

      const bufferMs = 60 * 60 * 1000

      if (
        requestedAppointmentTime >= aptEndTime &&
        requestedAppointmentTime.getTime() - aptEndTime.getTime() < bufferMs
      ) {
        throw new Error(
          "Ce rendez-vous est trop proche d'un autre rendez-vous existant",
        )
      }

      if (
        requestedEndTime <= aptStartTime &&
        aptStartTime.getTime() - requestedEndTime.getTime() < bufferMs
      ) {
        throw new Error(
          "Ce rendez-vous est trop proche d'un autre rendez-vous existant",
        )
      }

      if (
        requestedAppointmentTime < aptEndTime &&
        requestedEndTime > aptStartTime
      ) {
        throw new Error('Ce créneau chevauche un autre rendez-vous')
      }
    }

    const isReserved = await isSlotReserved(
      data.practitionerId,
      data.appointmentDate,
      data.startTime,
      data.patientId,
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
        id: data.excludeAppointmentId ? { not: data.excludeAppointmentId } : undefined,
      },
    })

    if (existingAppointment) {
      throw new Error("Ce créneau n'est plus disponible")
    }
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

    await this.validateSlotBooking({
      practitionerId: data.practitionerId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      patientId: data.patientId,
      timezoneOffset: data.timezoneOffset,
    })

    const appointmentDate = new Date(data.appointmentDate)
    appointmentDate.setUTCHours(0, 0, 0, 0)
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
        cabinetId: data.cabinetId || null,
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
      timeZone: 'UTC',
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

    // auto create teleconsultation session if appointment is a teleconsultation
    if (data.type === 'TELECONSULTATION') {
      try {
        const { teleconsultationsService } =
          await import('../teleconsultations/teleconsultations.service')
        await teleconsultationsService.createSession(appointment.id)
      } catch (teleError) {
        console.error('Failed to create teleconsultation session:', teleError)
        // dont fail appointment creation if teleconsultation session creation fails
      }
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

  async cancelAppointment(
    appointmentId: string,
    patientId: string,
    reason?: string,
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
        practitioner: {
          select: { id: true, firstName: true, lastName: true, title: true },
        },
      },
    })

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé')
    }

    if (appointment.patientId !== patientId) {
      throw new Error('Vous ne pouvez pas annuler ce rendez-vous')
    }

    if (
      appointment.status === 'CANCELLED' ||
      appointment.status === 'COMPLETED'
    ) {
      throw new Error('Ce rendez-vous ne peut pas être annulé')
    }

    const now = new Date()
    const aptDateLocal = combineDateAndTime(appointment.appointmentDate, appointment.startTime)

    if (aptDateLocal <= now) {
      throw new Error('Vous ne pouvez pas annuler un rendez-vous passé')
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: patientId,
        cancellationReason: reason || null,
      },
    })

    await cancelAppointmentReminders(appointmentId)

    // notify patients who want a closer slot
    try {
      await this.notifyPatientsOfEarlierSlot(
        appointment.practitionerId,
        appointment.appointmentDate,
        appointment.startTime,
      )
    } catch (notifyError) {
      console.error('Failed to notify patients of earlier slot:', notifyError)
    }

    // send email notification to practitioner
    const practitionerUser = await prisma.user.findFirst({
      where: { practitioner: { id: appointment.practitionerId } },
      select: { email: true },
    })

    if (practitionerUser?.email) {
      try {
        await sendAppointmentCancelledByPatientEmail(practitionerUser.email, {
          practitionerName: `${appointment.practitioner.title ?? 'Dr.'} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
          patientFirstName: appointment.patient.firstName,
          patientLastName: appointment.patient.lastName,
          appointmentDate:
            appointment.appointmentDate.toLocaleDateString('fr-FR'),
          appointmentTime: appointment.startTime,
          reason: reason,
        })
      } catch (emailError) {
        console.error(
          'Failed to send cancellation email to practitioner:',
          emailError,
        )
      }
    }
  }

  async updateAppointment(
    appointmentId: string,
    patientId: string,
    data: UpdateAppointmentData,
  ): Promise<PatientAppointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            cancellationNotice: true,
            consultationDuration: true,
            address: true,
            city: true,
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
      throw new Error('Rendez-vous non trouvé')
    }

    if (appointment.patientId !== patientId) {
      throw new Error('Vous ne pouvez pas modifier ce rendez-vous')
    }

    if (
      appointment.status === 'CANCELLED' ||
      appointment.status === 'COMPLETED'
    ) {
      throw new Error('Ce rendez-vous ne peut pas être modifié')
    }

    // use practitioners cancellationNotice setting (in hours) instead of hardcoded 24h
    const cancellationNoticeHours =
      appointment.practitioner.cancellationNotice || 24
    const now = new Date()
    const aptDateLocal = combineDateAndTime(appointment.appointmentDate, appointment.startTime)
    const diffMs = aptDateLocal.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < cancellationNoticeHours) {
      throw new Error(
        `Vous ne pouvez modifier un rendez-vous que ${cancellationNoticeHours} heures avant`,
      )
    }

    const newDate = data.appointmentDate
      ? new Date(data.appointmentDate)
      : appointment.appointmentDate
    const newStartTime = data.startTime || appointment.startTime

    // check new slot availability
    if (data.appointmentDate || data.startTime) {
      const existing = await prisma.appointment.findFirst({
        where: {
          practitionerId: appointment.practitionerId,
          appointmentDate: newDate,
          startTime: newStartTime,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: appointmentId },
        },
      })

      if (existing) {
        throw new Error("Ce créneau n'est plus disponible")
      }
    }

    // calculate new end time
    const [h, m] = newStartTime.split(':').map(Number)
    const endMinutes = h * 60 + m + appointment.duration
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: newDate,
        startTime: newStartTime,
        endTime,
        status: 'CONFIRMED',
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
    // reschedule reminders
    if (data.appointmentDate || data.startTime) {
      try {
        await cancelAppointmentReminders(appointmentId)
        await scheduleAppointmentReminders(
          appointmentId,
          newDate,
          newStartTime,
        )
      } catch (remError) {
        console.error('Failed to reschedule reminders:', remError)
      }
    }
    // send email notification to practitien when patient modifies appointment
    const oldDate = appointment.appointmentDate.toLocaleDateString('fr-FR')
    const oldTime = appointment.startTime

    if (data.appointmentDate || data.startTime) {
      const practitionerUser = await prisma.user.findFirst({
        where: { practitioner: { id: appointment.practitionerId } },
        select: { email: true },
      })

      if (practitionerUser?.email) {
        try {
          await sendAppointmentModifiedByPatientEmail(practitionerUser.email, {
            practitionerName: `${appointment.practitioner.title ?? 'Dr.'} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
            patientFirstName: appointment.patient.firstName,
            patientLastName: appointment.patient.lastName,
            oldDate,
            oldTime,
            newDate: newDate.toLocaleDateString('fr-FR'),
            newTime: newStartTime,
          })
        } catch (emailError) {
          console.error(
            'Failed to send modification email to practitioner:',
            emailError,
          )
        }
      }
    }

    return {
      id: updated.id,
      appointmentDate: updated.appointmentDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      type: updated.type,
      status: updated.status,
      reason: updated.reason,
      consultationFee: Number(updated.consultationFee),
      earlierSlotAlertEnabled: updated.earlierSlotAlertEnabled,
      practitioner: {
        id: updated.practitioner.id,
        firstName: updated.practitioner.firstName,
        lastName: updated.practitioner.lastName,
        title: updated.practitioner.title,
        specialty: updated.practitioner.specialties[0]?.specialty.name || null,
        photo: null,
        address: updated.practitioner.address || null,
        city: updated.practitioner.city || null,
        cancellationNotice: updated.practitioner.cancellationNotice,
      },
    }
  }

  async toggleEarlierSlotAlert(
    appointmentId: string,
    patientId: string,
    enabled: boolean,
  ): Promise<PatientAppointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        practitioner: {
          include: {
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
              take: 1,
            },
            cabinets: {
              where: {
                leftAt: null,
                isPaused: false,
                cabinet: { isVerified: true },
              },
              include: { cabinet: true },
            },
          },
        },
        cabinet: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
    })

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé')
    }

    if (appointment.patientId !== patientId) {
      throw new Error('Vous ne pouvez pas modifier ce rendez-vous')
    }

    if (
      appointment.status === 'CANCELLED' ||
      appointment.status === 'COMPLETED' ||
      appointment.status === 'NO_SHOW'
    ) {
      throw new Error('Ce rendez-vous est déjà archivé ou annulé')
    }

    // Check if the appointment is more than 48 hours away
    const now = new Date()
    const aptDateLocal = combineDateAndTime(appointment.appointmentDate, appointment.startTime)
    const diffMs = aptDateLocal.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 48) {
      throw new Error(
        'Vous ne pouvez activer ou désactiver cette alerte que pour les rendez-vous prévus dans plus de 48 heures',
      )
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        earlierSlotAlertEnabled: enabled,
      },
    })

    const activeCabinet =
      appointment.practitioner.cabinets && appointment.practitioner.cabinets.length > 0
        ? appointment.practitioner.cabinets[0].cabinet
        : null

    return {
      id: updated.id,
      appointmentDate: updated.appointmentDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      type: updated.type,
      status: updated.status,
      reason: updated.reason,
      consultationFee: Number(updated.consultationFee),
      earlierSlotAlertEnabled: updated.earlierSlotAlertEnabled,
      practitioner: {
        id: appointment.practitioner.id,
        firstName: appointment.practitioner.firstName,
        lastName: appointment.practitioner.lastName,
        title: appointment.practitioner.title,
        specialty: appointment.practitioner.specialties[0]?.specialty.name || null,
        photo: null,
        address: activeCabinet
          ? activeCabinet.address
          : appointment.practitioner.address || null,
        city: activeCabinet
          ? activeCabinet.city
          : appointment.practitioner.city || null,
        cancellationNotice: appointment.practitioner.cancellationNotice,
      },
      cabinet: appointment.cabinet || null,
    }
  }

  async notifyPatientsOfEarlierSlot(
    practitionerId: string,
    cancelledDate: Date,
    cancelledStartTime: string,
  ): Promise<void> {
    const cancelledDateTime = new Date(cancelledDate)
    const [hours, minutes] = cancelledStartTime.split(':').map(Number)
    cancelledDateTime.setUTCHours(hours, minutes, 0, 0)

    const candidates = await prisma.appointment.findMany({
      where: {
        practitionerId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        earlierSlotAlertEnabled: true,
      },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
        practitioner: true,
      },
    })

    const formattedCancelledDate = cancelledDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

    for (const apt of candidates) {
      const aptDateTime = new Date(apt.appointmentDate)
      const [aptH, aptM] = apt.startTime.split(':').map(Number)
      aptDateTime.setUTCHours(aptH, aptM, 0, 0)

      if (aptDateTime.getTime() > cancelledDateTime.getTime()) {
        try {
          await sendEarlierSlotAlertEmail(apt.patient.user.email, {
            patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
            practitionerTitle: apt.practitioner.title,
            practitionerFirstName: apt.practitioner.firstName,
            practitionerLastName: apt.practitioner.lastName,
            cancelledDate: formattedCancelledDate,
            cancelledTime: cancelledStartTime,
            practitionerId,
          })
        } catch (err) {
          console.error(`Failed to send earlier slot email to ${apt.patient.user.email}:`, err)
        }
      }
    }
  }
}

export const appointmentsService = new AppointmentsService()
