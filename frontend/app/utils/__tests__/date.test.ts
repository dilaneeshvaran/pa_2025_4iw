import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatDateLong,
  formatShortDate,
  formatDateWithTime,
  formatMonthYear,
  formatNotificationTime,
  formatRelativeTime,
  formatDateLabel,
  formatMessageTime,
} from '../date'

describe('date utils', () => {
  describe('formatDate', () => {
    it("formate une date en français (jour mois long année)", () => {
      const result = formatDate('2025-01-15')
      expect(result).toBe('15 janvier 2025')
    })

    it("retourne une chaîne vide si la date est vide", () => {
      expect(formatDate('')).toBe('')
    })

    it("fonctionne avec une date en fin d'année", () => {
      const result = formatDate('2025-12-31')
      expect(result).toBe('31 décembre 2025')
    })
  })

  describe('formatDateLong', () => {
    it("formate une date avec le jour de la semaine", () => {
      // 2025-01-06 est un lundi
      const result = formatDateLong('2025-01-06')
      expect(result).toContain('lundi')
      expect(result).toContain('janvier')
      expect(result).toContain('2025')
    })

    it("retourne une chaîne vide si la date est vide", () => {
      expect(formatDateLong('')).toBe('')
    })
  })

  describe('formatShortDate', () => {
    it("formate une date avec le mois abrégé", () => {
      const result = formatShortDate('2025-03-20')
      expect(result).toContain('mars')
      expect(result).toContain('2025')
    })

    it("retourne une chaîne vide si la date est vide", () => {
      expect(formatShortDate('')).toBe('')
    })
  })

  describe('formatDateWithTime', () => {
    it("retourne une chaîne vide si la date est vide", () => {
      expect(formatDateWithTime('')).toBe('')
    })

    it("inclut une année valide dans la sortie", () => {
      const result = formatDateWithTime('2025-06-15T10:30:00')
      expect(result).toContain('2025')
    })
  })

  describe('formatMonthYear', () => {
    it("formate en mois long + année", () => {
      const result = formatMonthYear('2025-03-01')
      expect(result).toBe('mars 2025')
    })

    it("retourne une chaîne vide si la date est vide", () => {
      expect(formatMonthYear('')).toBe('')
    })
  })

  describe('formatNotificationTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("retourne 'Aujourd'hui' pour une date du jour", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatNotificationTime('2025-06-15T08:00:00')).toBe("Aujourd'hui")
    })

    it("retourne 'Hier' pour une date d'hier", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatNotificationTime('2025-06-14T10:00:00')).toBe('Hier')
    })

    it("retourne 'Il y a X jours' pour moins d'une semaine", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatNotificationTime('2025-06-12T10:00:00')).toBe('Il y a 3 jours')
    })

    it("retourne une date formatée pour plus d'une semaine", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      const result = formatNotificationTime('2025-06-01T10:00:00')
      expect(result).toContain('juin')
      expect(result).toContain('2025')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("retourne 'maintenant' pour une date très récente", () => {
      const now = new Date('2025-06-15T12:00:00')
      vi.setSystemTime(now)
      expect(formatRelativeTime('2025-06-15T12:00:00')).toBe('maintenant')
    })

    it("retourne les minutes pour moins d'une heure", () => {
      vi.setSystemTime(new Date('2025-06-15T12:30:00'))
      expect(formatRelativeTime('2025-06-15T12:00:00')).toBe('30min')
    })

    it("retourne les heures pour moins de 24 heures", () => {
      vi.setSystemTime(new Date('2025-06-15T15:00:00'))
      expect(formatRelativeTime('2025-06-15T12:00:00')).toBe('3h')
    })

    it("retourne 'Hier' pour une date d'hier", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatRelativeTime('2025-06-14T12:00:00')).toBe('Hier')
    })

    it("retourne les jours pour moins d'une semaine", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatRelativeTime('2025-06-12T12:00:00')).toBe('3j')
    })

    it("retourne une chaîne vide pour null", () => {
      expect(formatRelativeTime(null)).toBe('')
    })
  })

  describe('formatDateLabel', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("retourne \"Aujourd'hui\" pour la date du jour", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatDateLabel(new Date('2025-06-15T08:00:00'))).toBe("Aujourd'hui")
    })

    it("retourne 'Hier' pour la date d'hier", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      expect(formatDateLabel(new Date('2025-06-14T12:00:00'))).toBe('Hier')
    })

    it("retourne le jour de la semaine pour les dates plus anciennes", () => {
      vi.setSystemTime(new Date('2025-06-15T12:00:00'))
      const result = formatDateLabel(new Date('2025-06-10T12:00:00'))
      expect(result).toContain('juin')
    })
  })

  describe('formatMessageTime', () => {
    it("formate l'heure au format HH:mm", () => {
      const result = formatMessageTime('2025-06-15T14:30:00')
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })
})
