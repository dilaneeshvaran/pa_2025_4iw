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

  it('should schedule reminders with correct delay calculated in local time', async () => {
    // Mock the current system time to July 2nd, 2026 at 09:30:00 local time
    const localNow = new Date(2026, 6, 2, 9, 30, 0, 0) // July is index 6
    jest.useFakeTimers().setSystemTime(localNow)

    // Appointment date is July 2nd, 2026 (stored as UTC midnight)
    const appointmentDate = new Date('2026-07-02T00:00:00.000Z')
    // startTime is "11:00" local time
    const startTime = '11:00'

    await scheduleAppointmentReminders('apt-123', appointmentDate, startTime)

    // The appointment local time is July 2nd, 2026 at 11:00:00.
    // The current time is July 2nd, 2026 at 09:30:00.
    // The 1h reminder should be scheduled at 10:00:00.
    // The delay from 09:30:00 to 10:00:00 is 30 minutes = 30 * 60 * 1000 = 1,800,000 ms.

    // The 24h reminder should be scheduled at July 1st, 2026 at 11:00:00, which is in the past.
    // So only the 1h reminder should be added to the queue.

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
