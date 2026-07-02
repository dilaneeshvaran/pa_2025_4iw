import { Queue, Worker } from 'bullmq'
import {
  HealthReminderStatus,
  NotificationChannel,
  NotificationType,
} from '@prisma/client'
import { redis } from '../config/redis'
import prisma from '../config/database'
import { sendHealthReminderEmail } from './email'
import {
  computeHealthReminderOccurrences,
  getLastHealthReminderOccurrence,
  type HealthReminderScheduleDefinition,
} from '../modules/health-reminders/health-reminders.schedule'

const QUEUE_NAME = 'health-reminders'
const JOB_NAME = 'send-health-reminder'

// BullMQ resolves its bundled ioredis types separately from the app dependency.
// The shared runtime Redis instance is compatible, but the duplicated types are not.
const bullMqRedisConnection = redis as any

interface HealthReminderJobData {
  reminderId: string
  scheduledFor: string
}

let healthReminderQueueInstance: Queue<
  HealthReminderJobData,
  void,
  typeof JOB_NAME
> | null = null

export function getHealthReminderQueue(): Queue<
  HealthReminderJobData,
  void,
  typeof JOB_NAME
> {
  if (!healthReminderQueueInstance) {
    healthReminderQueueInstance = new Queue<
      HealthReminderJobData,
      void,
      typeof JOB_NAME
    >(QUEUE_NAME, {
      connection: bullMqRedisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60_000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  }
  return healthReminderQueueInstance
}

export async function scheduleHealthReminderOccurrences(
  reminderId: string,
): Promise<void> {
  const reminder = await prisma.healthReminder.findUnique({
    where: { id: reminderId },
  })

  if (!reminder || reminder.status !== HealthReminderStatus.ACTIVE) {
    return
  }

  const now = new Date()
  const occurrences = computeHealthReminderOccurrences(
    toScheduleDefinition(reminder),
    now,
  )

  for (const occurrence of occurrences) {
    await getHealthReminderQueue().add(
      JOB_NAME,
      {
        reminderId,
        scheduledFor: occurrence.toISOString(),
      },
      {
        delay: Math.max(0, occurrence.getTime() - now.getTime()),
        jobId: getHealthReminderJobId(reminderId, occurrence),
      },
    )
  }
}

export function startHealthReminderWorker(): Worker<
  HealthReminderJobData,
  void,
  typeof JOB_NAME
> {
  const worker = new Worker<HealthReminderJobData, void, typeof JOB_NAME>(
    QUEUE_NAME,
    async (job) => {
      const scheduledFor = new Date(job.data.scheduledFor)
      const reminder = await prisma.healthReminder.findUnique({
        where: { id: job.data.reminderId },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  notificationPreference: {
                    select: {
                      emailNotifications: true,
                    },
                  },
                },
              },
            },
          },
          practitioner: {
            select: {
              id: true,
              title: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!reminder || reminder.status !== HealthReminderStatus.ACTIVE) {
        return
      }

      const schedule = toScheduleDefinition(reminder)
      const matchingOccurrence = computeHealthReminderOccurrences(
        schedule,
      ).some((occurrence) => occurrence.getTime() === scheduledFor.getTime())

      if (!matchingOccurrence) {
        return
      }

      let delivery = await prisma.healthReminderDelivery.upsert({
        where: {
          healthReminderId_scheduledFor: {
            healthReminderId: reminder.id,
            scheduledFor,
          },
        },
        create: {
          healthReminderId: reminder.id,
          scheduledFor,
        },
        update: {},
      })

      if (!delivery.notificationId) {
        const notification = await prisma.notification.create({
          data: {
            userId: reminder.patient.userId,
            type: NotificationType.HEALTH_REMINDER,
            channel: NotificationChannel.IN_APP,
            title: 'Rappel santé',
            message: reminder.message,
            metadata: {
              healthReminderId: reminder.id,
              scheduledFor: scheduledFor.toISOString(),
              practitionerId: reminder.practitionerId,
            },
            sent: true,
            sentAt: new Date(),
            deliveryStatus: 'DELIVERED',
          },
        })

        delivery = await prisma.healthReminderDelivery.update({
          where: { id: delivery.id },
          data: {
            notificationId: notification.id,
            notificationAt: new Date(),
          },
        })
      }

      const emailAllowed =
        reminder.patient.user.notificationPreference?.emailNotifications !==
        false

      if (emailAllowed && !delivery.emailSentAt) {
        try {
          await sendHealthReminderEmail(reminder.patient.user.email, {
            patientName: `${reminder.patient.firstName} ${reminder.patient.lastName}`,
            practitionerTitle: reminder.practitioner.title,
            practitionerFirstName: reminder.practitioner.firstName,
            practitionerLastName: reminder.practitioner.lastName,
            message: reminder.message,
            scheduledDate: scheduledFor.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            }),
            scheduledTime: scheduledFor.toISOString().slice(11, 16),
          })

          delivery = await prisma.healthReminderDelivery.update({
            where: { id: delivery.id },
            data: {
              emailSentAt: new Date(),
              emailError: null,
            },
          })
        } catch (error) {
          await prisma.healthReminderDelivery.update({
            where: { id: delivery.id },
            data: {
              emailError: 'Envoi email impossible',
            },
          })
          throw error
        }
      }

      const lastOccurrence = getLastHealthReminderOccurrence(schedule)
      if (lastOccurrence && scheduledFor >= lastOccurrence) {
        await prisma.healthReminder.update({
          where: { id: reminder.id },
          data: {
            status: HealthReminderStatus.COMPLETED,
            completedAt: new Date(),
          },
        })
      }
    },
    { connection: bullMqRedisConnection },
  )

  worker.on('completed', (job) => {
    console.log(`Health reminder job ${job?.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`Health reminder job ${job?.id} failed:`, error)
  })

  return worker
}

function getHealthReminderJobId(reminderId: string, occurrence: Date): string {
  return `health-reminder:${reminderId}:${occurrence.toISOString()}`
}

function toScheduleDefinition(reminder: {
  startDate: Date
  endDate: Date
  times: string[]
  recurrenceType: HealthReminderScheduleDefinition['recurrenceType']
  intervalValue: number | null
  intervalUnit: HealthReminderScheduleDefinition['intervalUnit']
  daysOfWeek: HealthReminderScheduleDefinition['daysOfWeek']
}): HealthReminderScheduleDefinition {
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
