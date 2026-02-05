import { FastifyReply, FastifyRequest } from 'fastify'
import { AuthService } from './auth.service'
import {
  SignupInput,
  LoginInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  VerifyEmailInput,
  RefreshTokenInput,
  ResendVerificationInput,
} from './auth.schema'

const authService = new AuthService()

export class AuthController {
  async signup(
    request: FastifyRequest<{ Body: SignupInput }>,
    reply: FastifyReply,
  ) {
    try {
      const data = request.body

      const result = await authService.signup({
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        specialtyIds: data.specialtyIds,
      })

      return reply.status(201).send({
        success: true,
        message:
          'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
        data: result,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de l'inscription"
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { email, password } = request.body

      const result = await authService.login(email, password)

      return reply.status(200).send({
        success: true,
        message: 'Connexion réussie',
        data: result,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors de la connexion'
      return reply.status(401).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { token } = request.body

      await authService.verifyEmail(token)

      return reply.status(200).send({
        success: true,
        message: 'Email vérifié avec succès',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la vérification de l'email"
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async resendVerification(
    request: FastifyRequest<{ Body: ResendVerificationInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { email } = request.body

      await authService.resendVerificationEmail(email)

      return reply.status(200).send({
        success: true,
        message: 'Email de vérification renvoyé',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'email de vérification"
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async requestPasswordReset(
    request: FastifyRequest<{ Body: RequestPasswordResetInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { email } = request.body

      await authService.requestPasswordReset(email)

      return reply.status(200).send({
        success: true,
        message:
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la demande de réinitialisation'
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { token, newPassword } = request.body

      await authService.resetPassword(token, newPassword)

      return reply.status(200).send({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la réinitialisation du mot de passe'
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { refreshToken } = request.body

      const tokens = await authService.refreshAccessToken(refreshToken)

      return reply.status(200).send({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: tokens,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors du rafraîchissement du token'
      return reply.status(401).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async logout(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { refreshToken } = request.body

      await authService.logout(refreshToken)

      return reply.status(200).send({
        success: true,
        message: 'Déconnexion réussie',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors de la déconnexion'
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }
}
