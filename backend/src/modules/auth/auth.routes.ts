import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as authController from './auth.controller'
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.schema'
import { authenticate } from '../../middleware/authenticate'

export async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/signup',
    {
      schema: {
        body: signupSchema,
        tags: ['Authentication'],
        description: 'Register a new user (patient or practitioner)',
      },
    },
    authController.signup,
  )

  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        tags: ['Authentication'],
        description: 'Login with email and password',
      },
    },
    authController.login,
  )

  app.post(
    '/verify-email',
    {
      schema: {
        body: verifyEmailSchema,
        tags: ['Authentication'],
        description: 'Verify email address with token',
      },
    },
    authController.verifyEmail,
  )

  app.post(
    '/resend-verification',
    {
      schema: {
        body: resendVerificationSchema,
        tags: ['Authentication'],
        description: 'Resend email verification',
      },
    },
    authController.resendVerification,
  )

  app.post(
    '/request-password-reset',
    {
      schema: {
        body: requestPasswordResetSchema,
        tags: ['Authentication'],
        description: 'Request password reset email',
      },
    },
    authController.requestPasswordReset,
  )

  app.post(
    '/reset-password',
    {
      schema: {
        body: resetPasswordSchema,
        tags: ['Authentication'],
        description: 'Reset password with token',
      },
    },
    authController.resetPassword,
  )

  app.post(
    '/refresh',
    {
      schema: {
        body: refreshTokenSchema,
        tags: ['Authentication'],
        description: 'Refresh access token',
      },
    },
    authController.refreshToken,
  )

  app.post(
    '/logout',
    {
      schema: {
        body: refreshTokenSchema,
        tags: ['Authentication'],
        description: 'Logout and revoke refresh token',
      },
    },
    authController.logout,
  )

  app.get(
    '/validate',
    {
      preHandler: authenticate,
      schema: {
        tags: ['Authentication'],
        description: 'Validate current session',
      },
    },
    authController.validateSession,
  )
}
