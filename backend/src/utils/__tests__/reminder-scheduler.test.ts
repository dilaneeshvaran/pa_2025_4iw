import { Queue } from 'bullmq'
import { scheduleAppointmentReminders } from '../reminder-scheduler'

jest.mock('bullmq', () => {
  const mockAdd = jest.fn()
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: mockAdd,
    })),
    Worker: jest.fn(),
  }
})

// reminder-scheduler imports these for the worker/prisma lookups it doesn't
// exercise here; mock them so importing the module doesn't require a real
// DATABASE_URL/Redis connection (matches the pattern used by other suites).
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {},
}))

jest.mock('../../config/redis', () => ({
  redis: {},
}))

describe('reminder-scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should schedule reminders with correct delay (UTC semantics for appointment times)', async () => {
    const nowUtc = new Date('2026-07-02T09:30:00.000Z')
    jest.useFakeTimers().setSystemTime(nowUtc)

    const appointmentDate = new Date('2026-07-02T00:00:00.000Z')
    const startTime = '11:00'

    await scheduleAppointmentReminders('apt-123', appointmentDate, startTime)


    const mockQueue = Queue as jest.Mock
    const mockAdd = mockQueue.mock.results[0].value.add

    expect(mockAdd).toHaveBeenCalledTimes(1)
    expect(mockAdd).toHaveBeenCalledWith(
      'reminder-1h',
      { appointmentId: 'apt-123', reminderType: '1h' },
      expect.objectContaining({
        delay: 30 * 60 * 1000,
        jobId: 'apt-123-1h',
      }),
    )

    jest.useRealTimers()
  })
})
