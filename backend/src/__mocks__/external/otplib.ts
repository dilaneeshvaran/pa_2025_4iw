export const generateSecret = jest.fn().mockReturnValue('secret_key_123')

export const generateURI = jest
  .fn()
  .mockReturnValue(
    'otpauth://totp/MediCote:test@example.com?secret=secret_key_123',
  )

export const verifySync = jest.fn().mockReturnValue({ valid: true })
