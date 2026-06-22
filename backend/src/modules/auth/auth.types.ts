import { UserRole, UserStatus, Gender } from '@prisma/client'

// auth response types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    emailVerified: boolean
    firstName?: string | null
    lastName?: string | null
  }
  tokens: AuthTokens
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth?: Date
  gender?: Gender
}

export interface PasswordResetData {
  userId: string
  token: string
  expiresAt: Date
}

export interface EmailVerificationData {
  userId: string
  email: string
  token: string
  expiresAt: Date
}

export interface RefreshTokenData {
  userId: string
  token: string
  expiresAt: Date
}
