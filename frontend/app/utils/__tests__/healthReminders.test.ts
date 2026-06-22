import { describe, expect, it } from 'vitest'
import {
  getHealthReminderStatusLabel,
  getHealthReminderStatusVariant,
} from '../healthReminders'

describe('health reminder utils', () => {
  it('retourne les libellés français des statuts', () => {
    expect(getHealthReminderStatusLabel('ACTIVE')).toBe('Actif')
    expect(getHealthReminderStatusLabel('CANCELLED')).toBe('Arrêté')
    expect(getHealthReminderStatusLabel('COMPLETED')).toBe('Terminé')
  })

  it('retourne les variantes visuelles des statuts', () => {
    expect(getHealthReminderStatusVariant('ACTIVE')).toBe('success')
    expect(getHealthReminderStatusVariant('CANCELLED')).toBe('danger')
    expect(getHealthReminderStatusVariant('COMPLETED')).toBe('default')
  })
})
