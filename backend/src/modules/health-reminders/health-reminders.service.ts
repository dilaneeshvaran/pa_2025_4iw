import prisma from '../../config/database'
import {
  AppointmentStatus,
  HealthReminderStatus,
  type DayOfWeek,
  type HealthReminderDurationUnit,
  type HealthReminderIntervalUnit,
  type HealthReminderRecurrenceType,
} from '@prisma/client'
import {
  computeHealthReminderEndDate,
  formatDateOnlyUtc,
  getNextHealthReminderOccurrence,
  parseDateOnlyToUtcDate,
  startOfUtcDay,
  type HealthReminderScheduleDefinition,
} from './health-reminders.schedule'
import type { CreateHealthReminderInput } from './health-reminders.schema'
import type {
  HealthReminderResponse,
  PatientHealthReminderOccurrence,
} from './health-reminders.types'
import {
  HealthReminderAccessError,
  HealthReminderValidationError,
} from './health-reminders.types'
import { scheduleHealthReminderOccurrences } from '../../utils/health-reminder-scheduler'

interface HealthReminderRecord {
  id: string
  patientId: string
  practitionerId: string
  message: string
  times: string[]
  startDate: Date
  endDate: Date
  durationValue: number
  durationUnit: HealthReminderDurationUnit
  recurrenceType: HealthReminderRecurrenceType
  intervalValue: number | null
  intervalUnit: HealthReminderIntervalUnit | null
  daysOfWeek: DayOfWeek[]
  status: HealthReminderStatus
  createdAt: Date
}

export class HealthRemindersService {
  async createHealthReminder(
    practitionerId: string,
    patientId: string,
    input: CreateHealthReminderInput,
  ): Promise<HealthReminderResponse> {
    await this.assertPractitionerCanAccessPatient(practitionerId, patientId)

    const startDate = parseDateOnlyToUtcDate(input.startDate)
    const today = startOfUtcDay(new Date())

    if (startDate < today) {
      throw new HealthReminderValidationError(
        'La date de début ne peut pas être dans le passé',
      )
    }

    this.assertDurationAllowed(input.durationValue, input.durationUnit)

    const endDate = computeHealthReminderEndDate(
      startDate,
      input.durationValue,
      input.durationUnit,
    )
    const sortedTimes = [...input.times].sort()

    const reminder = await prisma.healthReminder.create({
      data: {
        patientId,
        practitionerId,
        message: input.message,
        times: sortedTimes,
        startDate,
        endDate,
        durationValue: input.durationValue,
        durationUnit: input.durationUnit,
        recurrenceType: input.recurrence.type,
        intervalValue:
          input.recurrence.type === 'INTERVAL'
            ? input.recurrence.intervalValue
            : null,
        intervalUnit:
          input.recurrence.type === 'INTERVAL'
            ? input.recurrence.intervalUnit
            : null,
        daysOfWeek:
          input.recurrence.type === 'WEEKDAYS'
            ? [...input.recurrence.daysOfWeek].sort()
            : [],
      },
    })

    try {
      await scheduleHealthReminderOccurrences(reminder.id)
    } catch (error) {
      console.error('Failed to schedule health reminders:', error)
    }

    return this.mapReminder(reminder)
  }

  async getPractitionerPatientReminders(
    practitionerId: string,
    patientId: string,
  ): Promise<HealthReminderResponse[]> {
    await this.assertPractitionerCanAccessPatient(practitionerId, patientId)
    await this.completeExpiredReminders(patientId)

    const reminders = await prisma.healthReminder.findMany({
      where: {
        practitionerId,
        patientId,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    return reminders.map((reminder) => this.mapReminder(reminder))
  }

  async cancelHealthReminder(
    practitionerId: string,
    reminderId: string,
  ): Promise<HealthReminderResponse | null> {
    const reminder = await prisma.healthReminder.findFirst({
      where: {
        id: reminderId,
        practitionerId,
      },
    })

    if (!reminder) {
      return null
    }

    if (reminder.status !== HealthReminderStatus.ACTIVE) {
      return this.mapReminder(reminder)
    }

    const cancelled = await prisma.healthReminder.update({
      where: { id: reminderId },
      data: {
        status: HealthReminderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    })

    return this.mapReminder(cancelled)
  }

  async getPatientDashboardReminders(
    patientId: string,
    limit: number,
  ): Promise<PatientHealthReminderOccurrence[]> {
    await this.completeExpiredReminders(patientId)

    const deliveries = await prisma.healthReminderDelivery.findMany({
      where: {
        notificationId: { not: null },
        scheduledFor: { lte: new Date() },
        healthReminder: {
          patientId,
          status: { not: HealthReminderStatus.CANCELLED },
        },
      },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      include: {
        healthReminder: {
          include: {
            practitioner: {
              select: {
                id: true,
                title: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return deliveries.map((delivery) => ({
      id: delivery.id,
      reminderId: delivery.healthReminderId,
      message: delivery.healthReminder.message,
      scheduledFor: delivery.scheduledFor.toISOString(),
      practitioner: delivery.healthReminder.practitioner,
    }))
  }

  async getPractitionerIdFromUserId(userId: string): Promise<string | null> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })
    return practitioner?.id ?? null
  }

  async getPatientIdFromUserId(userId: string): Promise<string | null> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    return patient?.id ?? null
  }

  private async assertPractitionerCanAccessPatient(
    practitionerId: string,
    patientId: string,
  ): Promise<void> {
    const relation = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        patientId,
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { id: true },
    })

    if (!relation) {
      throw new HealthReminderAccessError()
    }
  }

  private async completeExpiredReminders(patientId: string): Promise<void> {
    await prisma.healthReminder.updateMany({
      where: {
        patientId,
        status: HealthReminderStatus.ACTIVE,
        endDate: { lt: startOfUtcDay(new Date()) },
      },
      data: {
        status: HealthReminderStatus.COMPLETED,
        completedAt: new Date(),
      },
    })
  }

  private assertDurationAllowed(
    durationValue: number,
    durationUnit: HealthReminderDurationUnit,
  ): void {
    if (durationUnit === 'MONTH' && durationValue > 12) {
      throw new HealthReminderValidationError(
        'La durée ne peut pas dépasser 12 mois',
      )
    }

    if (durationUnit === 'WEEK' && durationValue > 52) {
      throw new HealthReminderValidationError(
        'La durée ne peut pas dépasser 52 semaines',
      )
    }
  }

  private mapReminder(reminder: HealthReminderRecord): HealthReminderResponse {
    const nextOccurrence =
      reminder.status === HealthReminderStatus.ACTIVE
        ? getNextHealthReminderOccurrence(this.toSchedule(reminder))
        : null

    return {
      id: reminder.id,
      patientId: reminder.patientId,
      practitionerId: reminder.practitionerId,
      message: reminder.message,
      times: reminder.times,
      startDate: formatDateOnlyUtc(reminder.startDate),
      endDate: formatDateOnlyUtc(reminder.endDate),
      durationValue: reminder.durationValue,
      durationUnit: reminder.durationUnit,
      recurrenceType: reminder.recurrenceType,
      intervalValue: reminder.intervalValue,
      intervalUnit: reminder.intervalUnit,
      daysOfWeek: reminder.daysOfWeek,
      status: reminder.status,
      nextOccurrence: nextOccurrence?.toISOString() ?? null,
      scheduleLabel: this.buildScheduleLabel(reminder),
      createdAt: reminder.createdAt.toISOString(),
    }
  }

  private toSchedule(
    reminder: HealthReminderRecord,
  ): HealthReminderScheduleDefinition {
    return {
      startDate: reminder.startDate,
      endDate: reminder.endDate,
      times: reminder.times,
      recurrenceType: reminder.recurrenceType,
      intervalValue: reminder.intervalValue,
      intervalUnit: reminder.intervalUnit,
      daysOfWeek: reminder.daysOfWeek,
    }
  }

  private buildScheduleLabel(reminder: HealthReminderRecord): string {
    const timeLabel = this.formatTimes(reminder.times)

    if (reminder.recurrenceType === 'WEEKDAYS') {
      return `${this.formatDays(reminder.daysOfWeek)} ${timeLabel}`
    }

    const intervalValue = reminder.intervalValue ?? 1
    if (reminder.intervalUnit === 'WEEK') {
      const dayLabel = this.formatDays([
        this.getUtcDayOfWeek(reminder.startDate),
      ]).toLowerCase()
      const recurrence =
        intervalValue === 1
          ? `Toutes les semaines, ${dayLabel}`
          : `Toutes les ${intervalValue} semaines, ${dayLabel}`
      return `${recurrence} ${timeLabel}`
    }

    const recurrence =
      intervalValue === 1
        ? 'Tous les jours'
        : `Tous les ${intervalValue} jours`
    return `${recurrence} ${timeLabel}`
  }

  private formatTimes(times: string[]): string {
    return `à ${this.formatList(times)}`
  }

  private formatDays(days: DayOfWeek[]): string {
    const labels = days.map((day) => dayLabels[day])
    return `Les ${this.formatList(labels)}`
  }

  private formatList(values: string[]): string {
    if (values.length <= 1) {
      return values[0] ?? ''
    }

    return `${values.slice(0, -1).join(', ')} et ${values[values.length - 1]}`
  }

  private getUtcDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]
    return days[date.getUTCDay()]
  }
}

const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: 'lundi',
  TUESDAY: 'mardi',
  WEDNESDAY: 'mercredi',
  THURSDAY: 'jeudi',
  FRIDAY: 'vendredi',
  SATURDAY: 'samedi',
  SUNDAY: 'dimanche',
}

export const healthRemindersService = new HealthRemindersService()
