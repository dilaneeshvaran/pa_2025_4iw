import { describe, expect, it } from 'vitest'
import {
  getDocTypeBadgeColor,
  getDocTypeColor,
  getDocTypeLabel,
} from '../docType'

describe('docType utils', () => {
  it('retourne les libellés français des types connus', () => {
    expect(getDocTypeLabel('PRESCRIPTION')).toBe('Ordonnance')
    expect(getDocTypeLabel('LAB_RESULT')).toBe('Résultat de laboratoire')
    expect(getDocTypeLabel('RADIOLOGY')).toBe('Imagerie')
    expect(getDocTypeLabel('MEDICAL_REPORT')).toBe('Rapport médical')
    expect(getDocTypeLabel('CERTIFICATE')).toBe('Certificat')
    expect(getDocTypeLabel('CONSENT_FORM')).toBe('Consentement')
    expect(getDocTypeLabel('INSURANCE')).toBe('Assurance')
    expect(getDocTypeLabel('OTHER')).toBe('Autre')
  })

  it('retourne un fallback pour un type inconnu', () => {
    expect(getDocTypeLabel('UNKNOWN')).toBe('Document')
    expect(getDocTypeColor('UNKNOWN')).toBe('bg-gray-100 text-gray-600')
    expect(getDocTypeBadgeColor('UNKNOWN')).toBe('bg-gray-50 text-gray-700')
  })

  it('retourne les classes Tailwind des icônes par type', () => {
    expect(getDocTypeColor('PRESCRIPTION')).toBe('bg-blue-100 text-blue-600')
    expect(getDocTypeColor('LAB_RESULT')).toBe('bg-green-100 text-green-600')
    expect(getDocTypeColor('RADIOLOGY')).toBe('bg-cyan-100 text-cyan-600')
    expect(getDocTypeColor('MEDICAL_REPORT')).toBe('bg-purple-100 text-purple-600')
    expect(getDocTypeColor('CERTIFICATE')).toBe('bg-amber-100 text-amber-600')
    expect(getDocTypeColor('CONSENT_FORM')).toBe('bg-pink-100 text-pink-600')
    expect(getDocTypeColor('INSURANCE')).toBe('bg-indigo-100 text-indigo-600')
    expect(getDocTypeColor('OTHER')).toBe('bg-gray-100 text-gray-600')
  })

  it('retourne les classes Tailwind des badges par type', () => {
    expect(getDocTypeBadgeColor('PRESCRIPTION')).toBe('bg-blue-50 text-blue-700')
    expect(getDocTypeBadgeColor('LAB_RESULT')).toBe('bg-green-50 text-green-700')
    expect(getDocTypeBadgeColor('RADIOLOGY')).toBe('bg-cyan-50 text-cyan-700')
    expect(getDocTypeBadgeColor('MEDICAL_REPORT')).toBe(
      'bg-purple-50 text-purple-700',
    )
    expect(getDocTypeBadgeColor('CERTIFICATE')).toBe('bg-amber-50 text-amber-700')
    expect(getDocTypeBadgeColor('CONSENT_FORM')).toBe('bg-pink-50 text-pink-700')
    expect(getDocTypeBadgeColor('INSURANCE')).toBe('bg-indigo-50 text-indigo-700')
    expect(getDocTypeBadgeColor('OTHER')).toBe('bg-gray-50 text-gray-700')
  })
})
