import { describe, expect, it } from 'vitest'
import { formatAppointmentTimeRange } from '../date'

describe('formatAppointmentTimeRange', () => {
  it('labels appointment hours as GMT', () => {
    expect(
      formatAppointmentTimeRange('2026-07-07', '22:15', '22:45'),
    ).toContain('22:15 – 22:45 (GMT)')
  })
})