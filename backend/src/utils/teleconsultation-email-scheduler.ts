import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'
import prisma from '../config/database'
import { sendTeleconsultationParticipantJoinedEmail } from './email'

const QUEUE_NAME = 'teleconsultation-emails'

let _emailQueue: Queue | undefined
export function getTeleconsultationEmailQueue(): Queue {
  if (!_emailQueue) {
    _emailQueue = new Queue(QUEUE_NAME, {
      connection: redis as any,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for debugging
      },
    })
  }
  return _emailQueue
}

export interface TeleconsultationEmailJobData {
  sessionId: string
  to: string
  recipientName: string
  senderName: string
  appointmentId: string
  isRecipientPatient: boolean
}

export async function scheduleTeleconsultationJoinedEmail(
  data: TeleconsultationEmailJobData,
  delayMs: number
): Promise<void> {
  const queue = getTeleconsultationEmailQueue()
  await queue.add('joined-email', data, {
    delay: delayMs,
    jobId: `${data.sessionId}-${data.isRecipientPatient ? 'patient' : 'practitioner'}-joined`,
  })
}

export function startTeleconsultationEmailWorker(): Worker {
  const worker = new Worker<TeleconsultationEmailJobData>(
    QUEUE_NAME,
    async (job) => {
      const {
        sessionId,
        to,
        recipientName,
        senderName,
        appointmentId,
        isRecipientPatient,
      } = job.data

      const session = await prisma.teleconsultationSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        console.log(`Teleconsultation session ${sessionId} not found, skipping email`)
        return
      }

      const recipientJoined = isRecipientPatient
        ? session.patientJoinedAt !== null
        : session.practitionerJoinedAt !== null

      if (recipientJoined) {
        console.log(
          `Recipient has already joined session ${sessionId}, skipping email`
        )
        return
      }

      await sendTeleconsultationParticipantJoinedEmail(to, {
        recipientName,
        senderName,
        appointmentId,
        isRecipientPatient,
      })

      console.log(`Sent delayed teleconsultation join email to ${to}`)
    },
    { connection: redis as any }
  )

  worker.on('completed', (job) => {
    console.log(`Teleconsultation email job ${job?.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Teleconsultation email job ${job?.id} failed:`, err)
  })

  return worker
}
