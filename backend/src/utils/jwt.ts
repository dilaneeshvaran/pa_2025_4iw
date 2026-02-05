import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET =
  process.env.BACKEND_JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET =
  process.env.BACKEND_JWT_REFRESH_SECRET ||
  'your-refresh-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.BACKEND_JWT_EXPIRES_IN || '15m'
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

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}

export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null
}
