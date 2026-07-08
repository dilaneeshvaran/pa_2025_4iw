import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET =
  process.env.BACKEND_JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET =
  process.env.BACKEND_JWT_REFRESH_SECRET ||
  'your-refresh-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.BACKEND_JWT_EXPIRES_IN || '2h'
const JWT_REFRESH_EXPIRES_IN =
  process.env.BACKEND_JWT_REFRESH_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions)
}
//used in auth.service for token refresh
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}

export function generateMfaToken(userId: string): string {
  return jwt.sign({ userId, type: '2fa_challenge' }, JWT_SECRET, {
    expiresIn: '5m',
  })
}

export function verifyMfaToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET) as any
  if (payload.type !== '2fa_challenge') {
    throw new Error('Token MFA invalide')
  }
  return { userId: payload.userId }
}
