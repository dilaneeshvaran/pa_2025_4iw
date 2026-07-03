import { updateCabinetInfoSchema } from '../cabinet.schema'

describe('updateCabinetInfoSchema - phone', () => {
  it('accepts an omitted phone and leaves it undefined (partial update)', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBeUndefined()
    }
  })

  it('accepts an empty string phone', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A', phone: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('')
    }
  })

  it('accepts a null phone (nullable Prisma column) and normalizes to empty string', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A', phone: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('')
    }
  })

  it('accepts a whitespace-only phone and normalizes to empty string', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A', phone: '   ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('')
    }
  })

  it('trims a valid phone number surrounded by whitespace', () => {
    const result = updateCabinetInfoSchema.safeParse({
      name: 'Cabinet A',
      phone: '  +225 07 12 34 56 78  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('+225 07 12 34 56 78')
    }
  })

  it('rejects a phone containing disallowed characters', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A', phone: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejects a phone with too few digits', () => {
    const result = updateCabinetInfoSchema.safeParse({ name: 'Cabinet A', phone: '12345' })
    expect(result.success).toBe(false)
  })
})
