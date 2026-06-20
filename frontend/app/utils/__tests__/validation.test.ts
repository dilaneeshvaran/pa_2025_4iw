import { describe, it, expect } from 'vitest'
import { isValidPhone, isValidBirthDate } from '../validation'

describe('validation utils', () => {
  describe('isValidPhone', () => {
    it('accepte les numéros de téléphone valides simples', () => {
      expect(isValidPhone('0102030405')).toBe(true)
      expect(isValidPhone('2250102030405')).toBe(true)
    })

    it('accepte les numéros avec un indicatif +', () => {
      expect(isValidPhone('+2250102030405')).toBe(true)
    })

    it('accepte les numéros avec des espaces', () => {
      expect(isValidPhone('+225 01 02 03 04 05')).toBe(true)
    })

    it('accepte les numéros avec des tirets', () => {
      expect(isValidPhone('+225-01-02-03-04-05')).toBe(true)
    })

    it('accepte les numéros avec des parenthèses', () => {
      expect(isValidPhone('+225 (0) 102030405')).toBe(true)
    })

    it('rejette les numéros trop courts', () => {
      expect(isValidPhone('12345')).toBe(false)
    })

    it('rejette les numéros trop longs', () => {
      expect(isValidPhone('1234567890123456789')).toBe(false)
    })

    it('rejette les numéros contenant des lettres', () => {
      expect(isValidPhone('+225 01 02abc')).toBe(false)
    })

    it('rejette les numéros contenant des caractères spéciaux interdits', () => {
      expect(isValidPhone('+225 01 02 03#')).toBe(false)
    })
  })

  describe('isValidBirthDate', () => {
    it('accepte les dates dans le passé', () => {
      expect(isValidBirthDate('1990-01-01')).toBe(true)
      expect(isValidBirthDate('2020-12-31')).toBe(true)
    })

    it('rejette les dates futures', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      expect(isValidBirthDate(tomorrowStr)).toBe(false)
    })

    it('rejette les formats invalides', () => {
      expect(isValidBirthDate('invalid-date')).toBe(false)
      expect(isValidBirthDate('')).toBe(false)
    })
  })
})
