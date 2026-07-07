import {
  canJoinTeleconsultation,
  combineDateAndTime,
  getMinutesUntilTeleconsultationJoin,
  isAppointmentFuture,
  isTeleconsultationSoon,
  parseAppointmentDate,
} from '../appointment-time'

describe('appointment-time (platform GMT)', () => {
  const appointmentDate = '2026-07-07'

  it('parses date-only strings as UTC calendar days', () => {
    expect(parseAppointmentDate(appointmentDate).toISOString()).toBe(
      '2026-07-07T00:00:00.000Z',
    )
  })

  it('combines appointment date and HH:mm as GMT instants', () => {
    expect(combineDateAndTime(appointmentDate, '22:15').toISOString()).toBe(
      '2026-07-07T22:15:00.000Z',
    )
  })

  it('allows joining 37 minutes after a 22:15 GMT start when end time is 22:45', () => {
    const now = new Date('2026-07-07T22:52:00.000Z')
    expect(
      canJoinTeleconsultation(appointmentDate, '22:15', '22:45', now),
    ).toBe(true)
  })

  it('reports soon-to-join state 68 minutes before a 22:15 GMT start from 20:52 UTC', () => {
    const now = new Date('2026-07-07T20:52:00.000Z')
    expect(isTeleconsultationSoon(appointmentDate, '22:15', now)).toBe(true)
    expect(
      getMinutesUntilTeleconsultationJoin(appointmentDate, '22:15', now),
    ).toBe(68)
  })

  it('marks same-day appointments in the past using GMT wall clock', () => {
    const now = new Date('2026-07-07T22:52:00.000Z')
    expect(isAppointmentFuture(appointmentDate, '22:15', now)).toBe(false)
    expect(isAppointmentFuture(appointmentDate, '23:15', now)).toBe(true)
  })
})