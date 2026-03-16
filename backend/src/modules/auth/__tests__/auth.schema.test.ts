import {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
} from '../auth.schema'

describe('auth.schema – validation Zod', () => {
  // ── signupSchema ─────────────────────────────────────────────────────────

  describe('signupSchema', () => {
    const valid = {
      email: 'john@example.com',
      password: 'Password1!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      dateOfBirth: '1990-01-01',
      gender: 'MALE' as const,
    }

    it('accepte des données valides', () => {
      expect(() => signupSchema.parse(valid)).not.toThrow()
    })

    it('rejette un email invalide', () => {
      expect(() => signupSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
    })

    it('rejette un mot de passe trop court', () => {
      expect(() => signupSchema.parse({ ...valid, password: 'Ab1!' })).toThrow()
    })

    it('rejette un mot de passe sans majuscule', () => {
      expect(() => signupSchema.parse({ ...valid, password: 'password1!' })).toThrow()
    })

    it('rejette un mot de passe sans minuscule', () => {
      expect(() => signupSchema.parse({ ...valid, password: 'PASSWORD1!' })).toThrow()
    })

    it('rejette un mot de passe sans chiffre', () => {
      expect(() => signupSchema.parse({ ...valid, password: 'Password!' })).toThrow()
    })

    it('rejette un mot de passe sans caractère spécial', () => {
      expect(() => signupSchema.parse({ ...valid, password: 'Password1' })).toThrow()
    })

    it('rejette un prénom trop court', () => {
      expect(() => signupSchema.parse({ ...valid, firstName: 'J' })).toThrow()
    })

    it('rejette un nom trop court', () => {
      expect(() => signupSchema.parse({ ...valid, lastName: 'D' })).toThrow()
    })

    it('rejette un numéro de téléphone invalide', () => {
      expect(() => signupSchema.parse({ ...valid, phone: '123' })).toThrow()
    })

    it('rejette un genre invalide', () => {
      expect(() => signupSchema.parse({ ...valid, gender: 'UNKNOWN' })).toThrow()
    })

    it('accepte tous les genres valides', () => {
      const genders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const
      for (const gender of genders) {
        expect(() => signupSchema.parse({ ...valid, gender })).not.toThrow()
      }
    })
  })

  // ── loginSchema ──────────────────────────────────────────────────────────

  describe('loginSchema', () => {
    it('accepte des identifiants valides', () => {
      expect(() =>
        loginSchema.parse({ email: 'user@example.com', password: 'anypass' }),
      ).not.toThrow()
    })

    it('rejette un email invalide', () => {
      expect(() =>
        loginSchema.parse({ email: 'not-email', password: 'anypass' }),
      ).toThrow()
    })

    it('rejette un mot de passe vide', () => {
      expect(() =>
        loginSchema.parse({ email: 'user@example.com', password: '' }),
      ).toThrow()
    })
  })

  // ── resetPasswordSchema ──────────────────────────────────────────────────

  describe('resetPasswordSchema', () => {
    const valid = { token: 'abc123', newPassword: 'NewPass1!' }

    it('accepte des données valides', () => {
      expect(() => resetPasswordSchema.parse(valid)).not.toThrow()
    })

    it('rejette un token vide', () => {
      expect(() => resetPasswordSchema.parse({ ...valid, token: '' })).toThrow()
    })

    it('rejette un mot de passe faible', () => {
      expect(() =>
        resetPasswordSchema.parse({ ...valid, newPassword: 'weak' }),
      ).toThrow()
    })
  })

  // ── verifyEmailSchema ────────────────────────────────────────────────────

  describe('verifyEmailSchema', () => {
    it('accepte un token valide', () => {
      expect(() => verifyEmailSchema.parse({ token: 'abc123' })).not.toThrow()
    })

    it('rejette un token vide', () => {
      expect(() => verifyEmailSchema.parse({ token: '' })).toThrow()
    })
  })

  // ── refreshTokenSchema ───────────────────────────────────────────────────

  describe('refreshTokenSchema', () => {
    it('accepte un refresh token valide', () => {
      expect(() =>
        refreshTokenSchema.parse({ refreshToken: 'some.jwt.token' }),
      ).not.toThrow()
    })

    it('rejette un refresh token vide', () => {
      expect(() => refreshTokenSchema.parse({ refreshToken: '' })).toThrow()
    })
  })

  // ── resendVerificationSchema ─────────────────────────────────────────────

  describe('resendVerificationSchema', () => {
    it('accepte un email valide', () => {
      expect(() =>
        resendVerificationSchema.parse({ email: 'user@example.com' }),
      ).not.toThrow()
    })

    it('rejette un email invalide', () => {
      expect(() =>
        resendVerificationSchema.parse({ email: 'not-an-email' }),
      ).toThrow()
    })
  })

  // ── requestPasswordResetSchema ───────────────────────────────────────────

  describe('requestPasswordResetSchema', () => {
    it('accepte un email valide', () => {
      expect(() =>
        requestPasswordResetSchema.parse({ email: 'user@example.com' }),
      ).not.toThrow()
    })

    it('rejette un email invalide', () => {
      expect(() =>
        requestPasswordResetSchema.parse({ email: 'not-an-email' }),
      ).toThrow()
    })
  })
})
