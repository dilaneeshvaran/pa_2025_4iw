import {
  computeHealthReminderEndDate,
  computeHealthReminderOccurrences,
  parseDateOnlyToUtcDate,
} from '../health-reminders.schedule'

describe('health reminder schedule', () => {
  it('calcule les occurrences quotidiennes à plusieurs horaires pendant deux semaines', () => {
    const startDate = parseDateOnlyToUtcDate('2026-06-22')
    const endDate = computeHealthReminderEndDate(startDate, 2, 'WEEK')

    const occurrences = computeHealthReminderOccurrences({
      startDate,
      endDate,
      times: ['08:00', '12:00', '19:00'],
      recurrenceType: 'INTERVAL',
      intervalValue: 1,
      intervalUnit: 'DAY',
      daysOfWeek: [],
    })

    expect(occurrences).toHaveLength(42)
    expect(occurrences[0]?.toISOString()).toBe('2026-06-22T08:00:00.000Z')
    expect(occurrences.at(-1)?.toISOString()).toBe(
      '2026-07-05T19:00:00.000Z',
    )
  })

  it('calcule les occurrences les lundis et vendredis pendant un mois', () => {
    const startDate = parseDateOnlyToUtcDate('2026-06-22')
    const endDate = computeHealthReminderEndDate(startDate, 1, 'MONTH')

    const occurrences = computeHealthReminderOccurrences({
      startDate,
      endDate,
      times: ['08:00'],
      recurrenceType: 'WEEKDAYS',
      intervalValue: null,
      intervalUnit: null,
      daysOfWeek: ['MONDAY', 'FRIDAY'],
    })

    expect(occurrences.map((date) => date.toISOString())).toEqual([
      '2026-06-22T08:00:00.000Z',
      '2026-06-26T08:00:00.000Z',
      '2026-06-29T08:00:00.000Z',
      '2026-07-03T08:00:00.000Z',
      '2026-07-06T08:00:00.000Z',
      '2026-07-10T08:00:00.000Z',
      '2026-07-13T08:00:00.000Z',
      '2026-07-17T08:00:00.000Z',
      '2026-07-20T08:00:00.000Z',
    ])
  })

  it('calcule une périodicité toutes les deux semaines sur le jour de départ', () => {
    const startDate = parseDateOnlyToUtcDate('2026-06-22')
    const endDate = computeHealthReminderEndDate(startDate, 1, 'MONTH')

    const occurrences = computeHealthReminderOccurrences({
      startDate,
      endDate,
      times: ['08:00'],
      recurrenceType: 'INTERVAL',
      intervalValue: 2,
      intervalUnit: 'WEEK',
      daysOfWeek: [],
    })

    expect(occurrences.map((date) => date.toISOString())).toEqual([
      '2026-06-22T08:00:00.000Z',
      '2026-07-06T08:00:00.000Z',
      '2026-07-20T08:00:00.000Z',
    ])
  })
})
