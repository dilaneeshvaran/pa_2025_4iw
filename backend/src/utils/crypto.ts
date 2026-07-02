import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

const RAW_KEY = process.env.BACKEND_ENCRYPTION_KEY

if (process.env.NODE_ENV === 'production' && !RAW_KEY) {
  throw new Error('BACKEND_ENCRYPTION_KEY est requis en environnement de production')
}

// Stable 32-byte hex fallback for development/testing so that restarting the server doesn't break decryption
const ENCRYPTION_KEY = RAW_KEY || 'd3b07384d113edec49eaa6238ad5ff00b71902800b45ca73390d2e1071b7642a'

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// encrypt sensitive data
export function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
