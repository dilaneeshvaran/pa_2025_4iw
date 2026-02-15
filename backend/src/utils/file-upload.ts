import { FastifyRequest } from 'fastify'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(__dirname, '../../uploads/messages')

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/heic': '.heic',
  'image/heif': '.heic',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'text/plain': '.txt',
}

const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export interface UploadedFile {
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  url: string
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export function validateFileType(mimeType: string, fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  const mimeAllowed = mimeType in ALLOWED_MIME_TYPES
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext)
  return mimeAllowed || extAllowed
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

export async function saveMessageAttachment(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<UploadedFile> {
  ensureUploadDir()

  if (!validateFileType(mimeType, originalName)) {
    throw new Error(
      'Type de fichier non autorisé. Formats acceptés : JPG, PNG, HEIC, PDF, DOC, DOCX, TXT',
    )
  }

  if (!validateFileSize(fileBuffer.length)) {
    throw new Error('Le fichier est trop volumineux. Taille maximale : 10 MB')
  }

  // generate  filename
  const ext =
    ALLOWED_MIME_TYPES[mimeType] || path.extname(originalName).toLowerCase()
  const uniqueName = `${crypto.randomUUID()}${ext}`
  const filePath = path.join(UPLOAD_DIR, uniqueName)

  // write file to disk
  await fs.promises.writeFile(filePath, fileBuffer)

  return {
    originalName,
    fileName: uniqueName,
    filePath,
    fileSize: fileBuffer.length,
    mimeType,
    url: `/api/messages/attachments/${uniqueName}`,
  }
}

export function getAttachmentPath(fileName: string): string | null {
  const filePath = path.join(UPLOAD_DIR, fileName)
  if (fs.existsSync(filePath)) {
    return filePath
  }
  return null
}

export function deleteAttachment(fileName: string): boolean {
  const filePath = path.join(UPLOAD_DIR, fileName)
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function getFormattedFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export const FILE_CONSTRAINTS = {
  maxSize: MAX_FILE_SIZE,
  maxSizeLabel: '10 MB',
  allowedExtensions: ALLOWED_EXTENSIONS,
  allowedMimeTypes: Object.keys(ALLOWED_MIME_TYPES),
  allowedFormatsLabel: 'JPG, PNG, HEIC, PDF, DOC, DOCX, TXT',
}
