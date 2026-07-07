import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'
import prisma from '../config/database'
import { sendAppointmentReminderEmail } from './email'
import { combineDateAndTime } from './appointment-time'

const QUEUE_NAME = 'appointment-reminders'

let _reminderQueue: Queue | undefined
function getReminderQueue(): Queue {
  if (!_reminderQueue) {
    _reminderQueue = new Queue(QUEUE_NAME, {
      connection: redis as any,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for debugging
      },
    })
  }
  return _reminderQueue
}

// job types
interface ReminderJobData {
  appointmentId: string
  reminderType: '24h' | '1h'
}

// schedule reminders for a new appointment
export async function scheduleAppointmentReminders(
  appointmentId: string,
  appointmentDate: Date,
  startTime: string,
): Promise<void> {
  const reminderQueue = getReminderQueue()
  // appointmentDate is UTC midnight + startTime (HH:mm) represents wall time in UTC+0 (Cote d'Ivoire).
  // Always combine using UTC to avoid any server TZ drift.
  const appointmentDateTime = combineDateAndTime(appointmentDate, startTime)

  const now = new Date()

  //  millisecond arithmetic instead of setHours(getHours() - N) to avoid
  // server timezone issues with local time hour subtraction.

  // Schedule 24h reminder
  const reminder24hTime = new Date(
    appointmentDateTime.getTime() - 24 * 60 * 60 * 1000,
  )

  if (reminder24hTime > now) {
    const delay = reminder24hTime.getTime() - now.getTime()
    await reminderQueue.add(
      'reminder-24h',
      { appointmentId, reminderType: '24h' } as ReminderJobData,
      { delay, jobId: `${appointmentId}-24h` },
    )
  }

  // schedule 1h reminder
  const reminder1hTime = new Date(
    appointmentDateTime.getTime() - 60 * 60 * 1000,
  )

  if (reminder1hTime > now) {
    const delay = reminder1hTime.getTime() - now.getTime()
    await reminderQueue.add(
      'reminder-1h',
      { appointmentId, reminderType: '1h' } as ReminderJobData,
      { delay, jobId: `${appointmentId}-1h` },
    )
  }
}

export async function cancelAppointmentReminders(
  appointmentId: string,
): Promise<void> {
  const reminderQueue = getReminderQueue()
  try {
    const job24h = await reminderQueue.getJob(`${appointmentId}-24h`)
    const job1h = await reminderQueue.getJob(`${appointmentId}-1h`)

    if (job24h) await job24h.remove()
    if (job1h) await job1h.remove()
  } catch (error) {
    console.error('Error cancelling reminders:', error)
  }
}

// start the reminder worker
export function startReminderWorker(): Worker {
  const worker = new Worker<ReminderJobData>(
    QUEUE_NAME,
    async (job) => {
      const { appointmentId, reminderType } = job.data

      // fetch appointment with related data
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: {
              user: { select: { email: true } },
            },
          },
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
        console.log(`Appointment ${appointmentId} not found, skipping reminder`)
        return
      }

      // skip if appointment is cancelled or completed
      if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
        console.log(
          `Appointment ${appointmentId} is ${appointment.status}, skipping reminder`,
        )
        return
      }

      // format date for email - pin to utc so the displayed date matches the
      // stored utc midnight value regardless of server host timezone.
      // Use local toLocale so that on the Paris demo machine the date appears "correct"
      const formattedDate = new Date(
        appointment.appointmentDate,
      ).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      // send reminder email
      await sendAppointmentReminderEmail(
        appointment.patient.user.email,
        {
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          practitionerTitle: appointment.practitioner.title,
          practitionerFirstName: appointment.practitioner.firstName,
          practitionerLastName: appointment.practitioner.lastName,
          practitionerSpecialty:
            appointment.practitioner.specialties[0]?.specialty.name ||
            'Médecine générale',
          appointmentDate: formattedDate,
          appointmentTime: appointment.startTime,
          consultationType: appointment.type as
            | 'IN_PERSON'
            | 'TELECONSULTATION',
          consultationFee: Number(appointment.consultationFee),
          clinicAddress: appointment.practitioner.address,
          appointmentId: appointment.id,
        },
        reminderType,
      )

      // update reminder flags
      if (reminderType === '24h') {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { reminderSent24h: true },
        })
      } else if (reminderType === '1h') {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { reminderSent1h: true },
        })
      }

      console.log(
        `Sent ${reminderType} reminder for appointment ${appointmentId}`,
      )
    },
    { connection: redis as any },
  )

  worker.on('completed', (job) => {
    console.log(`Reminder job ${job?.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err)
  })

  return worker
}
