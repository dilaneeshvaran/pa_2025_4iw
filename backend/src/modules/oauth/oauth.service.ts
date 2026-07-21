import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { UserRole, UserStatus, AuditAction } from '@prisma/client'
import prisma from '../../config/database'
import { redis } from '../../config/redis'
import { normalizeEmail } from '../../utils/normalize-email'
import { AuthService } from '../auth/auth.service'
import { GoogleProfile } from './oauth.types'
import { AuthResponse } from '../auth/auth.types'

const GOOGLE_CLIENT_ID = process.env.BACKEND_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.BACKEND_GOOGLE_CLIENT_SECRET || ''
const GOOGLE_CALLBACK_URL =
  process.env.BACKEND_GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/oauth/google/callback'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const OAUTH_STATE_TTL = 600 // 10 minutes
const OAUTH_STATE_PREFIX = 'oauth:state:'

export class OAuthService {
  private oauthClient: OAuth2Client
  private authService: AuthService

  constructor() {
    this.oauthClient = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL,
    )
    this.authService = new AuthService()
  }

  /**
   * Génère l'URL d'autorisation Google avec state et nonce
   */
  async buildAuthorizationUrl(redirectUrl?: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex')
    const nonce = crypto.randomBytes(16).toString('hex')

    // Stocker le state dans Redis avec TTL
    await redis.set(
      `${OAUTH_STATE_PREFIX}${state}`,
      JSON.stringify({ nonce, redirectUrl: redirectUrl || '' }),
      'EX',
      OAUTH_STATE_TTL,
    )

    const authorizeUrl = this.oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'consent',
      include_granted_scopes: true,
    })

    return authorizeUrl
  }

  /**
   * Échange le code d'autorisation contre des tokens Google
   */
  async exchangeAuthorizationCode(code: string): Promise<{ idToken: string }> {
    const { tokens } = await this.oauthClient.getToken(code)

    if (!tokens.id_token) {
      throw new Error('Authentification Google échouée : token ID manquant')
    }

    return { idToken: tokens.id_token }
  }

  /**
   * Valide et décode le token ID Google
   */
  async validateAndDecodeIdToken(idToken: string): Promise<GoogleProfile> {
    const ticket = await this.oauthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload) {
      throw new Error('Compte Google invalide : profil introuvable')
    }

    if (!payload.email || !payload.email_verified) {
      throw new Error('Compte Google invalide : email non vérifié')
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name || '',
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      picture: payload.picture,
    }
  }

  /**
   * Vérifie la validité du state OAuth
   */
  async validateState(state: string): Promise<{ nonce: string; redirectUrl: string }> {
    const stored = await redis.get(`${OAUTH_STATE_PREFIX}${state}`)

    if (!stored) {
      throw new Error('State OAuth invalide ou expiré')
    }

    // Supprimer le state pour empêcher la réutilisation
    await redis.del(`${OAUTH_STATE_PREFIX}${state}`)

    return JSON.parse(stored)
  }

  /**
   * Cherche un utilisateur existant par googleId ou email
   */
  async findExistingUser(
    googleId: string,
    email: string,
  ): Promise<{
    user: Awaited<ReturnType<typeof prisma.user.findFirst>> | null
    matchedBy: 'googleId' | 'email' | null
  }> {
    // D'abord chercher par googleId
    const byGoogleId = await prisma.user.findUnique({
      where: { googleId },
    })

    if (byGoogleId) {
      return { user: byGoogleId, matchedBy: 'googleId' }
    }

    // Sinon chercher par email
    const normalizedEmail = normalizeEmail(email)
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (byEmail) {
      return { user: byEmail, matchedBy: 'email' }
    }

    return { user: null, matchedBy: null }
  }

  /**
   * Crée un nouvel utilisateur à partir d'un profil Google
   */
  async createGoogleUser(profile: GoogleProfile): Promise<string> {
    const normalizedEmail = normalizeEmail(profile.email)

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          googleId: profile.sub,
          password: null,
          role: UserRole.PATIENT,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
        },
      })

      await tx.patient.create({
        data: {
          userId: createdUser.id,
          firstName: profile.given_name || profile.name || '',
          lastName: profile.family_name || '',
          phone: '',
          dateOfBirth: new Date(),
          gender: 'PREFER_NOT_TO_SAY',
        },
      })

      return createdUser
    })

    // AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.REGISTER_GOOGLE,
        resource: 'User',
        resourceId: user.id,
        metadata: {
          googleId: profile.sub,
          email: normalizedEmail,
        },
      },
    })

    return user.id
  }

  /**
   * Lie un compte Google à un utilisateur existant
   */
  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { googleId },
    })

    // AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.ACCOUNT_LINKED_GOOGLE,
        resource: 'User',
        resourceId: userId,
        metadata: { googleId },
      },
    })
  }

  /**
   * Orchestre l'authentification Google : find/create/link user + generate tokens
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResponse> {
    const { user, matchedBy } = await this.findExistingUser(profile.sub, profile.email)

    let userId: string
    let userRole: UserRole

    if (!user) {
      // Cas 1 : utilisateur inexistant → création
      userId = await this.createGoogleUser(profile)
      userRole = UserRole.PATIENT
    } else {
      // Vérifier soft delete
      if (user.deletedAt) {
        // AuditLog pour tentative échouée
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: AuditAction.GOOGLE_LOGIN_FAILED,
            resource: 'User',
            resourceId: user.id,
            metadata: { reason: 'Compte supprimé' },
          },
        })
        throw new Error('Ce compte a été supprimé')
      }

      // Vérifier suspension
      if (user.status === UserStatus.SUSPENDED) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: AuditAction.GOOGLE_LOGIN_FAILED,
            resource: 'User',
            resourceId: user.id,
            metadata: { reason: 'Compte suspendu' },
          },
        })
        throw new Error('Votre compte a été suspendu')
      }

      if (matchedBy === 'email' && !user.googleId) {
        // Cas 2 : utilisateur existant sans googleId → liaison
        await this.linkGoogleAccount(user.id, profile.sub)
      }

      userId = user.id
      userRole = user.role as UserRole

      // Mettre à jour la dernière connexion
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
    }

    // Récupérer le profil complet de l'utilisateur
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      throw new Error('Erreur interne lors de la connexion Google')
    }

    // AuditLog connexion réussie
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.LOGIN_GOOGLE,
        resource: 'User',
        resourceId: userId,
        metadata: { googleId: profile.sub },
      },
    })

    // Générer les tokens JWT via le service existant
    const tokens = await this.authService.generateTokens(userId, currentUser.email, userRole)

    // Récupérer firstName/lastName
    const { firstName, lastName } = await this.authService.getUserProfile(userId, userRole)

    // Vérifier impayé praticien
    const isUnpaid =
      userRole === UserRole.PRACTITIONER &&
      (await this.authService.isPractitionerUnpaid(userId))

    return {
      user: {
        id: userId,
        email: currentUser.email,
        role: userRole,
        status: currentUser.status,
        emailVerified: !!currentUser.emailVerified,
        firstName,
        lastName,
        isUnpaid,
      },
      tokens,
    }
  }

  /**
   * Point d'entrée principal du callback : valide state, échange code, login
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ authResponse: AuthResponse; redirectUrl: string }> {
    // Valider le state
    const { redirectUrl } = await this.validateState(state)

    // Échanger le code contre un ID token
    const { idToken } = await this.exchangeAuthorizationCode(code)

    // Valider et décoder le token
    const profile = await this.validateAndDecodeIdToken(idToken)

    // Authentifier l'utilisateur
    const authResponse = await this.loginWithGoogle(profile)

    return {
      authResponse,
      redirectUrl: redirectUrl || '',
    }
  }
}
