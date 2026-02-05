import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AuthController } from './auth.controller'
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.schema'

const authController = new AuthController()

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
    authController.signup.bind(authController),
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
    authController.login.bind(authController),
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
    authController.verifyEmail.bind(authController),
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
    authController.resendVerification.bind(authController),
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
    authController.requestPasswordReset.bind(authController),
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
    authController.resetPassword.bind(authController),
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
    authController.refreshToken.bind(authController),
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
    authController.logout.bind(authController),
  )
}
