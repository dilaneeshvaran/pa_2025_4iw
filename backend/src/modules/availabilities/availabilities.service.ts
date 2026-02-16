import prisma from '../../config/database'
import { AppointmentStatus, AppointmentType, DayOfWeek } from '@prisma/client'
import { sendEmail } from '../../utils/email'
import type {
  AvailabilitySlot,
  AbsenceInfo,
  BlockedSlotInfo,
  PractitionerSettings,
  AgendaAppointment,
  DaySummary,
} from './availabilities.types'
import type {
  UpsertAvailabilityInput,
  CreateAbsenceInput,
  CreateBlockedSlotInput,
  UpdateSettingsInput,
  CreatePractitionerAppointmentInput,
} from './availabilities.schema'

export class AvailabilitiesService {
  async getAvailabilities(practitionerId: string): Promise<AvailabilitySlot[]> {
    const rows = await prisma.availability.findMany({
      where: { practitionerId },
      orderBy: { dayOfWeek: 'asc' },
    })
    return rows.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      slotDuration: r.slotDuration,
      breakStartTime: r.breakStartTime,
      breakEndTime: r.breakEndTime,
      isEmergencySlot: r.isEmergencySlot,
      isActive: r.isActive,
    }))
  }

  async upsertAvailability(
    practitionerId: string,
    data: UpsertAvailabilityInput,
  ): Promise<AvailabilitySlot> {
    // fetch practitioner's current consultationDuration as default slotDuration
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { consultationDuration: true },
    })
    const defaultDuration = practitioner?.consultationDuration ?? 30

    // check if theres already a slot for this day
    const existing = await prisma.availability.findFirst({
      where: {
        practitionerId,
        dayOfWeek: data.dayOfWeek as DayOfWeek,
        isEmergencySlot: data.isEmergencySlot || false,
      },
    })

    const row = existing
      ? await prisma.availability.update({
          where: { id: existing.id },
          data: {
            startTime: data.startTime,
            endTime: data.endTime,
            slotDuration: data.slotDuration ?? existing.slotDuration,
            breakStartTime: data.breakStartTime ?? existing.breakStartTime,
            breakEndTime: data.breakEndTime ?? existing.breakEndTime,
            isEmergencySlot: data.isEmergencySlot ?? existing.isEmergencySlot,
            isActive: data.isActive ?? existing.isActive,
          },
        })
      : await prisma.availability.create({
          data: {
            practitionerId,
            dayOfWeek: data.dayOfWeek as DayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            slotDuration: data.slotDuration ?? defaultDuration,
            breakStartTime: data.breakStartTime ?? null,
            breakEndTime: data.breakEndTime ?? null,
            isEmergencySlot: data.isEmergencySlot ?? false,
            isActive: data.isActive ?? true,
          },
        })

    return {
      id: row.id,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      slotDuration: row.slotDuration,
      breakStartTime: row.breakStartTime,
      breakEndTime: row.breakEndTime,
      isEmergencySlot: row.isEmergencySlot,
      isActive: row.isActive,
    }
  }

  async deleteAvailability(
    practitionerId: string,
    availabilityId: string,
  ): Promise<void> {
    const slot = await prisma.availability.findFirst({
      where: { id: availabilityId, practitionerId },
    })
    if (!slot) throw new Error('Créneau non trouvé')
    await prisma.availability.delete({ where: { id: availabilityId } })
  }

  async getAbsences(practitionerId: string): Promise<AbsenceInfo[]> {
    const rows = await prisma.absence.findMany({
      where: { practitionerId },
      orderBy: { startDate: 'asc' },
    })
    return rows.map((r) => ({
      id: r.id,
      startDate: r.startDate,
      endDate: r.endDate,
      reason: r.reason,
      notifiedPatients: r.notifiedPatients,
      createdAt: r.createdAt,
    }))
  }

  async createAbsence(
    practitionerId: string,
    data: CreateAbsenceInput,
  ): Promise<{ absence: AbsenceInfo; cancelledAppointmentsCount: number }> {
    const startDate = new Date(data.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(data.endDate)
    endDate.setHours(23, 59, 59, 999)

    if (endDate < startDate) {
      throw new Error('La date de fin doit être après la date de début')
    }

    // check for overlapping absences
    const overlapping = await prisma.absence.findFirst({
      where: {
        practitionerId,
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    })
    if (overlapping) {
      throw new Error(
        "Une absence existe déjà pour cette période. Veuillez modifier ou supprimer l'absence existante avant d'en créer une nouvelle.",
      )
    }

    const row = await prisma.absence.create({
      data: {
        practitionerId,
        startDate,
        endDate,
        reason: data.reason || null,
      },
    })

    // automatically cancel affected appointments and notify patients
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { firstName: true, lastName: true, title: true },
    })

    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    })

    const startStr = startDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const endStr = endDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // cancel appointments and send emails
    for (const apt of affectedAppointments) {
      try {
        // cancel the appointment
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: AppointmentStatus.CANCELLED },
        })

        // send email notification
        await sendEmail(
          apt.patient.user.email,
          `Annulation de votre rendez-vous – Absence de ${practitioner?.title} ${practitioner?.lastName}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Annulation de rendez-vous</h2>
            <p>Bonjour ${apt.patient.firstName},</p>
            <p>Nous vous informons que votre rendez-vous du <strong>${apt.appointmentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> à <strong>${apt.startTime}</strong> avec ${practitioner?.title} ${practitioner?.firstName} ${practitioner?.lastName} a été <strong>annulé</strong>.</p>
            <p><strong>Raison :</strong> Absence du praticien du ${startStr} au ${endStr}.</p>
            ${data.reason ? `<p><em>Motif : ${data.reason}</em></p>` : ''}
            <p>Nous vous prions de bien vouloir reprogrammer votre rendez-vous à une autre date via votre espace patient.</p>
            <p>Nous nous excusons pour ce désagrément.</p>
            <p>Cordialement,<br/>L'équipe MediCote</p>
          </div>
          `,
        )
      } catch (err) {
        console.error(`Failed to cancel/notify appointment ${apt.id}:`, err)
      }
    }

    return {
      absence: {
        id: row.id,
        startDate: row.startDate,
        endDate: row.endDate,
        reason: row.reason,
        notifiedPatients: row.notifiedPatients,
        createdAt: row.createdAt,
      },
      cancelledAppointmentsCount: affectedAppointments.length,
    }
  }

  async deleteAbsence(
    practitionerId: string,
    absenceId: string,
  ): Promise<void> {
    const absence = await prisma.absence.findFirst({
      where: { id: absenceId, practitionerId },
    })
    if (!absence) throw new Error('Absence non trouvée')
    await prisma.absence.delete({ where: { id: absenceId } })
  }

  async notifyPatientsForAbsence(
    practitionerId: string,
    absenceId: string,
  ): Promise<{ notifiedCount: number }> {
    const absence = await prisma.absence.findFirst({
      where: { id: absenceId, practitionerId },
    })
    if (!absence) throw new Error('Absence non trouvée')

    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { firstName: true, lastName: true, title: true },
    })
    if (!practitioner) throw new Error('Praticien non trouvé')

    // find all unique patients who have ever had appointments with this practitioner
    const allAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
      },
      select: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      distinct: ['patientId'],
    })

    const startStr = absence.startDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const endStr = absence.endDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    let notifiedCount = 0
    for (const apt of allAppointments) {
      try {
        await sendEmail(
          apt.patient.user.email,
          `Absence de ${practitioner.title} ${practitioner.lastName} – Indisponibilité`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Information importante</h2>
            <p>Bonjour ${apt.patient.firstName},</p>
            <p>${practitioner.title} ${practitioner.firstName} ${practitioner.lastName} sera absent(e) du <strong>${startStr}</strong> au <strong>${endStr}</strong>.</p>
            <p>Aucune prise de rendez-vous ne sera possible durant cette période.</p>
            ${absence.reason ? `<p><em>Motif : ${absence.reason}</em></p>` : ''}
            <p>Nous vous remercions de votre compréhension.</p>
            <p>Cordialement,<br/>L'équipe MediCote</p>
          </div>
          `,
        )
        notifiedCount++
      } catch (err) {
        console.error(`Failed to notify patient ${apt.patient.id}:`, err)
      }
    }

    await prisma.absence.update({
      where: { id: absenceId },
      data: { notifiedPatients: true },
    })

    return { notifiedCount }
  }

  async getBlockedSlots(practitionerId: string): Promise<BlockedSlotInfo[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const rows = await prisma.blockedSlot.findMany({
      where: {
        practitionerId,
        date: { gte: today },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      reason: r.reason,
    }))
  }

  async createBlockedSlot(
    practitionerId: string,
    data: CreateBlockedSlotInput,
  ): Promise<{
    blockedSlot: BlockedSlotInfo
    cancelledAppointmentsCount: number
  }> {
    const date = new Date(data.date)
    date.setHours(0, 0, 0, 0)

    const row = await prisma.blockedSlot.create({
      data: {
        practitionerId,
        date,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason || null,
      },
    })

    // automatically cancel affected appointments and notify patients
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { firstName: true, lastName: true, title: true },
    })

    // find all appointments on this date
    const allAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: date,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    })

    // filter appointments that overlap with the blocked slot
    // overlap occurs when : appointment starts before blocked slot ends and ends after blocked slot starts
    const affectedAppointments = allAppointments.filter((apt) => {
      return apt.startTime < data.endTime && apt.endTime > data.startTime
    })

    const dateStr = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // cancel appointments and send emails
    for (const apt of affectedAppointments) {
      try {
        // cancel  appointment
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: AppointmentStatus.CANCELLED },
        })

        // send email
        await sendEmail(
          apt.patient.user.email,
          `Annulation de votre rendez-vous – Créneau bloqué`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Annulation de rendez-vous</h2>
            <p>Bonjour ${apt.patient.firstName},</p>
            <p>Nous vous informons que votre rendez-vous du <strong>${dateStr}</strong> à <strong>${apt.startTime}</strong> avec ${practitioner?.title} ${practitioner?.firstName} ${practitioner?.lastName} a été <strong>annulé</strong>.</p>
            <p><strong>Raison :</strong> Le praticien a bloqué ce créneau (${data.startTime} - ${data.endTime}).</p>
            ${data.reason ? `<p><em>Motif : ${data.reason}</em></p>` : ''}
            <p>Nous vous prions de bien vouloir reprogrammer votre rendez-vous à une autre date via votre espace patient.</p>
            <p>Nous nous excusons pour ce désagrément.</p>
            <p>Cordialement,<br/>L'équipe MediCote</p>
          </div>
          `,
        )
      } catch (err) {
        console.error(`Failed to cancel/notify appointment ${apt.id}:`, err)
      }
    }

    return {
      blockedSlot: {
        id: row.id,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
      },
      cancelledAppointmentsCount: affectedAppointments.length,
    }
  }

  async deleteBlockedSlot(
    practitionerId: string,
    blockedSlotId: string,
  ): Promise<void> {
    const slot = await prisma.blockedSlot.findFirst({
      where: { id: blockedSlotId, practitionerId },
    })
    if (!slot) throw new Error('Créneau bloqué non trouvé')
    await prisma.blockedSlot.delete({ where: { id: blockedSlotId } })
  }

  async getSettings(practitionerId: string): Promise<PractitionerSettings> {
    const p = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
    })
    if (!p) throw new Error('Praticien non trouvé')

    return {
      consultationDuration: p.consultationDuration,
      teleconsultationEnabled: p.teleconsultationEnabled,
      homeVisitEnabled: p.homeVisitEnabled,
      emergencySlotsEnabled: p.emergencySlotsEnabled,
      backToBack: p.backToBack,
      breakBetweenSlots: p.breakBetweenSlots,
      minBookingNotice: p.minBookingNotice,
      maxBookingAdvance: p.maxBookingAdvance,
      cancellationNotice: p.cancellationNotice,
      acceptsNewPatients: p.acceptsNewPatients,
      newPatientMaxPerDay: p.newPatientMaxPerDay,
      baseConsultationFee: Number(p.baseConsultationFee),
      teleconsultationFee: p.teleconsultationFee
        ? Number(p.teleconsultationFee)
        : null,
    }
  }

  async updateSettings(
    practitionerId: string,
    data: UpdateSettingsInput,
  ): Promise<PractitionerSettings> {
    const updateData: any = {}
    if (data.consultationDuration !== undefined)
      updateData.consultationDuration = data.consultationDuration
    if (data.teleconsultationEnabled !== undefined)
      updateData.teleconsultationEnabled = data.teleconsultationEnabled
    if (data.homeVisitEnabled !== undefined)
      updateData.homeVisitEnabled = data.homeVisitEnabled
    if (data.emergencySlotsEnabled !== undefined)
      updateData.emergencySlotsEnabled = data.emergencySlotsEnabled
    if (data.backToBack !== undefined) updateData.backToBack = data.backToBack
    if (data.breakBetweenSlots !== undefined)
      updateData.breakBetweenSlots = data.breakBetweenSlots
    if (data.minBookingNotice !== undefined)
      updateData.minBookingNotice = data.minBookingNotice
    if (data.maxBookingAdvance !== undefined)
      updateData.maxBookingAdvance = data.maxBookingAdvance
    if (data.cancellationNotice !== undefined)
      updateData.cancellationNotice = data.cancellationNotice
    if (data.acceptsNewPatients !== undefined)
      updateData.acceptsNewPatients = data.acceptsNewPatients
    if (data.newPatientMaxPerDay !== undefined)
      updateData.newPatientMaxPerDay = data.newPatientMaxPerDay
    if (data.baseConsultationFee !== undefined)
      updateData.baseConsultationFee = data.baseConsultationFee
    if (data.teleconsultationFee !== undefined)
      updateData.teleconsultationFee = data.teleconsultationFee

    const p = await prisma.practitioner.update({
      where: { id: practitionerId },
      data: updateData,
    })

    // when consultationDuration changes, also sync to all availability records
    if (data.consultationDuration !== undefined) {
      await prisma.availability.updateMany({
        where: { practitionerId },
        data: { slotDuration: data.consultationDuration },
      })
    }

    return {
      consultationDuration: p.consultationDuration,
      teleconsultationEnabled: p.teleconsultationEnabled,
      homeVisitEnabled: p.homeVisitEnabled,
      emergencySlotsEnabled: p.emergencySlotsEnabled,
      backToBack: p.backToBack,
      breakBetweenSlots: p.breakBetweenSlots,
      minBookingNotice: p.minBookingNotice,
      maxBookingAdvance: p.maxBookingAdvance,
      cancellationNotice: p.cancellationNotice,
      acceptsNewPatients: p.acceptsNewPatients,
      newPatientMaxPerDay: p.newPatientMaxPerDay,
      baseConsultationFee: Number(p.baseConsultationFee),
      teleconsultationFee: p.teleconsultationFee
        ? Number(p.teleconsultationFee)
        : null,
    }
  }

  async getAppointments(
    practitionerId: string,
    startDate: string,
    endDate: string,
  ): Promise<AgendaAppointment[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: { gte: start, lte: end },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    return appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      duration: apt.duration,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      consultationFee: Number(apt.consultationFee),
      patient: apt.patient,
    }))
  }

  async getDaySummary(
    practitionerId: string,
    date: string,
  ): Promise<DaySummary> {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: { gte: d, lt: next },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      select: { type: true },
    })

    const cabinet = appointments.filter(
      (a) => a.type === AppointmentType.IN_PERSON,
    ).length
    const teleconsultation = appointments.filter(
      (a) => a.type === AppointmentType.TELECONSULTATION,
    ).length

    return {
      total: appointments.length,
      cabinet,
      teleconsultation,
    }
  }

  async createAppointmentByPractitioner(
    practitionerId: string,
    data: CreatePractitionerAppointmentInput,
  ): Promise<AgendaAppointment> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
    })
    if (!practitioner) throw new Error('Praticien non trouvé')

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    })
    if (!patient) throw new Error('Patient non trouvé')

    const appointmentDate = new Date(data.appointmentDate)
    appointmentDate.setHours(0, 0, 0, 0)

    // check for existing appointment at same time
    const existing = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        appointmentDate,
        startTime: data.startTime,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    })
    if (existing) throw new Error("Ce créneau n'est plus disponible")

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
        practitionerId,
        appointmentDate,
        startTime: data.startTime,
        endTime,
        duration,
        type: data.type as AppointmentType,
        status: AppointmentStatus.CONFIRMED,
        reason: data.reason || null,
        consultationFee,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    return {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      duration: appointment.duration,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      consultationFee: Number(appointment.consultationFee),
      patient: appointment.patient,
    }
  }

  async searchPatients(
    practitionerId: string,
    query: string,
  ): Promise<
    { id: string; firstName: string; lastName: string; phone: string }[]
  > {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
      take: 10,
    })
    return patients
  }
}

export const availabilitiesService = new AvailabilitiesService()
