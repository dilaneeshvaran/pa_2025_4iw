import { updatePatientProfileSchema } from '../patient-settings.schema'

describe('patient-settings.schema – validation Zod', () => {
  const valid = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+225 01 02 03 04 05',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    address: 'Rue 12',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    postalCode: '12345',
  }

  it('accepte des données valides', () => {
    expect(() => updatePatientProfileSchema.parse(valid)).not.toThrow()
  })

  it('accepte un profil partiel', () => {
    expect(() => updatePatientProfileSchema.parse({ firstName: 'Jane' })).not.toThrow()
  })

  it('rejette un numéro de téléphone invalide (lettres ou mauvais format)', () => {
    expect(() => updatePatientProfileSchema.parse({ phone: '123' })).toThrow()
    expect(() => updatePatientProfileSchema.parse({ phone: '+225 12345' })).toThrow()
    expect(() => updatePatientProfileSchema.parse({ phone: '+225 abc12345' })).toThrow()
  })

  it('accepte un numéro de téléphone avec des espaces, tirets et parenthèses', () => {
    expect(() => updatePatientProfileSchema.parse({ phone: '+225 01 02 03 04 05' })).not.toThrow()
    expect(() => updatePatientProfileSchema.parse({ phone: '+225-01-02-03-04-05' })).not.toThrow()
    expect(() => updatePatientProfileSchema.parse({ phone: '+225 (0) 10 20 30 40' })).not.toThrow()
  })

  it('rejette une date de naissance dans le futur', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    expect(() => updatePatientProfileSchema.parse({ dateOfBirth: tomorrowStr })).toThrow()
  })

  it('rejette une date de naissance irréaliste (e.g. 1750)', () => {
    expect(() => updatePatientProfileSchema.parse({ dateOfBirth: '1750-01-01' })).toThrow()
  })

  it('rejette une date de naissance trop jeune (e.g. 2023)', () => {
    expect(() => updatePatientProfileSchema.parse({ dateOfBirth: '2023-01-01' })).toThrow()
  })

  it('accepte une date de naissance valide dans la plage (e.g. 2010)', () => {
    expect(() => updatePatientProfileSchema.parse({ dateOfBirth: '2010-01-01' })).not.toThrow()
  })

  it('rejette une date de naissance invalide', () => {
    expect(() => updatePatientProfileSchema.parse({ dateOfBirth: 'not-a-date' })).toThrow()
  })

  it('rejette un genre invalide', () => {
    expect(() => updatePatientProfileSchema.parse({ gender: 'UNKNOWN' })).toThrow()
  })
})
