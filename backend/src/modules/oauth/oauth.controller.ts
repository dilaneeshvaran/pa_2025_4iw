import { FastifyRequest, FastifyReply } from 'fastify'
import { OAuthService } from './oauth.service'
import { sanitizeErrorMessage } from '../../utils/errors'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const oauthService = new OAuthService()

export async function initiateGoogleAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const query = request.query as { redirect?: string }
    const redirectUrl = query.redirect || ''

    const authorizationUrl = await oauthService.buildAuthorizationUrl(redirectUrl)

    return reply.redirect(authorizationUrl)
  } catch (error: any) {
    return reply.redirect(
      `${FRONTEND_URL}/auth/login?error=${encodeURIComponent(
        sanitizeErrorMessage(error, 'Erreur lors de la connexion Google'),
      )}`,
    )
  }
}

export async function handleGoogleCallback(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const query = request.query as {
      code?: string
      state?: string
      error?: string
      error_description?: string
    }

    // Gérer les erreurs renvoyées par Google
    if (query.error) {
      const errorMsg =
        query.error_description || 'Authentification Google échouée'
      return reply.redirect(
        `${FRONTEND_URL}/auth/login?error=${encodeURIComponent(errorMsg)}`,
      )
    }

    if (!query.code || !query.state) {
      return reply.redirect(
        `${FRONTEND_URL}/auth/login?error=${encodeURIComponent(
          'Code OAuth expiré ou manquant',
        )}`,
      )
    }

    const { authResponse, redirectUrl } = await oauthService.handleCallback(
      query.code,
      query.state,
    )

    // Construire l'URL de redirection vers le frontend avec les tokens
    const callbackParams = new URLSearchParams()

    if (authResponse.tokens) {
      callbackParams.set('accessToken', authResponse.tokens.accessToken)
      callbackParams.set('refreshToken', authResponse.tokens.refreshToken)
    }

    if (authResponse.user) {
      callbackParams.set('user', JSON.stringify(authResponse.user))
    }

    if (redirectUrl) {
      callbackParams.set('redirect', redirectUrl)
    }

    return reply.redirect(
      `${FRONTEND_URL}/auth/google/callback?${callbackParams.toString()}`,
    )
  } catch (error: any) {
    const errorMsg = sanitizeErrorMessage(
      error,
      'Erreur lors de la connexion Google',
    )
    return reply.redirect(
      `${FRONTEND_URL}/auth/login?error=${encodeURIComponent(errorMsg)}`,
    )
  }
}
