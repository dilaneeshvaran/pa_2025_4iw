import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'
import prisma from '../config/database'
import { sendAppointmentReminderEmail } from './email'
import { AppointmentType } from '@prisma/client'

const QUEUE_NAME = 'appointment-reminders'

// create the reminder queue
export const reminderQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100, // keep last 100 failed jobs for debugging
  },
})

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
  // parse appointment datetime
  const [hours, minutes] = startTime.split(':').map(Number)
  const appointmentDateTime = new Date(appointmentDate)
  appointmentDateTime.setHours(hours, minutes, 0, 0)

  const now = new Date()

  // Schedule 24h reminder
  const reminder24hTime = new Date(appointmentDateTime)
  reminder24hTime.setHours(reminder24hTime.getHours() - 24)

  if (reminder24hTime > now) {
    const delay = reminder24hTime.getTime() - now.getTime()
    await reminderQueue.add(
      'reminder-24h',
      { appointmentId, reminderType: '24h' } as ReminderJobData,
      { delay, jobId: `${appointmentId}-24h` },
    )
  }

  // schedule 1h reminder
  const reminder1hTime = new Date(appointmentDateTime)
  reminder1hTime.setHours(reminder1hTime.getHours() - 1)

  if (reminder1hTime > now) {
    const delay = reminder1hTime.getTime() - now.getTime()
    await reminderQueue.add(
      'reminder-1h',
      { appointmentId, reminderType: '1h' } as ReminderJobData,
      { delay, jobId: `${appointmentId}-1h` },
    )
  }
}

// todo: call this from appointments service when appointment is cancelled
// cancel scheduled reminders (when appointment is cancelled)
export async function cancelAppointmentReminders(
  appointmentId: string,
): Promise<void> {
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

      // format date for email
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
    { connection: redis },
  )

  worker.on('completed', (job) => {
    console.log(`Reminder job ${job?.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err)
  })

  return worker
}
