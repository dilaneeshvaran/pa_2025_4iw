import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from './auth.service'
import { sanitizeErrorMessage } from '../../utils/errors'
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verify2faSchema,
} from './auth.schema'

const authService = new AuthService()

export async function signup(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = signupSchema.parse(request.body)
    // Convert dateOfBirth string to Date
    const signupData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
    }
    const result = await authService.signup(signupData)

    return reply.status(201).send({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email.',
      data: result,
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(error, "Erreur lors de l'inscription"),
    })
  }
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = loginSchema.parse(request.body)
    const result = await authService.login(data.email, data.password)

    return reply.send({
      success: true,
      message: 'Connexion réussie',
      data: result,
    })
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: sanitizeErrorMessage(error, 'Erreur lors de la connexion'),
    })
  }
}

export async function verifyEmail(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = verifyEmailSchema.parse(request.body)
    await authService.verifyEmail(data.token)

    return reply.send({
      success: true,
      message: 'Email vérifié avec succès',
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(error, "Erreur lors de la vérification de l'email"),
    })
  }
}

export async function resendVerification(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = resendVerificationSchema.parse(request.body)
    await authService.resendVerificationEmail(data.email)

    return reply.send({
      success: true,
      message: 'Email de vérification renvoyé',
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(error, "Erreur lors de l'envoi de l'email de vérification"),
    })
  }
}

export async function requestPasswordReset(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = requestPasswordResetSchema.parse(request.body)
    await authService.requestPasswordReset(data.email)

    return reply.send({
      success: true,
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(
        error,
        'Erreur lors de la demande de réinitialisation du mot de passe'
      ),
    })
  }
}

export async function resetPassword(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = resetPasswordSchema.parse(request.body)
    await authService.resetPassword(data.token, data.newPassword)

    return reply.send({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(error, 'Erreur lors de la réinitialisation du mot de passe'),
    })
  }
}

export async function refreshToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = refreshTokenSchema.parse(request.body)
    const tokens = await authService.refreshAccessToken(data.refreshToken)

    return reply.send({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: tokens,
    })
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: sanitizeErrorMessage(error, 'Erreur lors du rafraîchissement du token'),
    })
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = refreshTokenSchema.parse(request.body)
    await authService.logout(data.refreshToken)

    return reply.send({
      success: true,
      message: 'Déconnexion réussie',
    })
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: sanitizeErrorMessage(error, 'Erreur lors de la déconnexion'),
    })
  }
}

export async function validateSession(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // if we already here,means the authenticate middleware already validated token
    // so return user info from the req
    return reply.send({
      success: true,
      data: {
        user: request.user,
        isValid: true,
      },
    })
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: 'Session invalide',
    })
  }
}

export async function verify2fa(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = verify2faSchema.parse(request.body)
    const result = await authService.verify2fa(data.mfaToken, data.code)

    return reply.send({
      success: true,
      message: 'Connexion 2FA réussie',
      data: result,
    })
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: sanitizeErrorMessage(error, 'Erreur lors de la vérification 2FA'),
    })
  }
}
