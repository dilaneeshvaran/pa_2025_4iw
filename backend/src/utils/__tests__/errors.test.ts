import { sanitizeErrorMessage } from '../errors'
import { Prisma } from '@prisma/client'

describe('sanitizeErrorMessage', () => {
  it('returns the fallback message for Prisma Client errors', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'The table public.users does not exist in the current database.',
      {
        code: 'P2021',
        clientVersion: '7.8.0',
      }
    )
    expect(sanitizeErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('returns the fallback message for generic errors containing database/prisma keywords', () => {
    const error = new Error(
      'Invalid prisma.user.findFirst() invocation: Something went wrong with the database relation.'
    )
    expect(sanitizeErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('returns the fallback message for TypeError and other runtime crashes', () => {
    const error = new TypeError('Cannot read properties of null (reading "findFirst")')
    expect(sanitizeErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('returns the fallback message for system / connection errors with specific codes', () => {
    const error = new Error('Connection refused')
    ;(error as any).code = 'ECONNREFUSED'
    expect(sanitizeErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('keeps intentional application-level error messages', () => {
    const error = new Error('Email ou mot de passe incorrect')
    expect(sanitizeErrorMessage(error, 'Fallback')).toBe('Email ou mot de passe incorrect')
  })

  it('keeps raw string errors if they do not contain sensitive keywords', () => {
    expect(sanitizeErrorMessage('Incorrect code', 'Fallback')).toBe('Incorrect code')
  })

  it('returns fallback message if error is undefined or null', () => {
    expect(sanitizeErrorMessage(null, 'Fallback')).toBe('Fallback')
    expect(sanitizeErrorMessage(undefined, 'Fallback')).toBe('Fallback')
  })
})
