import { FastifyReply, FastifyRequest } from 'fastify'
import { ContactRequestStatus } from '@prisma/client'
import { ContactRequestsService } from './contact-requests.service'
import { sanitizeErrorMessage } from '../../utils/errors'
import {
  createPractitionerRequestSchema,
  createCabinetRequestSchema,
  createContactRequestSchema,
} from './contact-requests.schema'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const contactRequestsService = new ContactRequestsService()

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/contact-requests')
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 mb

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

async function saveUploadedFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<string> {
  ensureUploadDir()

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      'Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG',
    )
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux. Taille maximale : 5 MB')
  }

  const ext = path.extname(originalName).toLowerCase() || '.bin'
  const uniqueName = `${crypto.randomUUID()}${ext}`
  const filePath = path.join(UPLOAD_DIR, uniqueName)

  await fs.promises.writeFile(filePath, fileBuffer)

  return `/uploads/contact-requests/${uniqueName}`
}

export class ContactRequestsController {
  // json endpoint (DEMO/INFO/SUPPORT)
  async createContactRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as any

      const result = await contactRequestsService.createContactRequest(data)

      return reply.status(201).send({
        success: true,
        message:
          'Votre demande a été envoyée avec succès. Nous vous contacterons bientôt.',
        data: result,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, "Erreur lors de l'envoi de la demande")
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  // endpoint for practitioenr and cabinet registration
  async createRegistrationRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const parts = (request as any).parts()
      const fields: Record<string, string> = {}
      const files: Record<
        string,
        { buffer: Buffer; filename: string; mimetype: string }
      > = {}

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = []
          for await (const chunk of part.file) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)
          if (buffer.length > 0) {
            files[part.fieldname] = {
              buffer,
              filename: part.filename,
              mimetype: part.mimetype,
            }
          }
        } else {
          fields[part.fieldname] = (part as any).value as string
        }
      }

      const requestType = fields.requestType

      if (requestType === 'PRACTITIONER') {
        // validate fields
        const parsed = createPractitionerRequestSchema.safeParse(fields)
        if (!parsed.success) {
          const errors = parsed.error.issues
            .map((e: { message: string }) => e.message)
            .join(', ')
          return reply.status(400).send({ success: false, message: errors })
        }

        // require identity docs and diploma
        if (!files.identityDocument) {
          return reply.status(400).send({
            success: false,
            message: "La carte d'identité / passeport est requis",
          })
        }
        if (!files.diploma) {
          return reply.status(400).send({
            success: false,
            message: "Le diplôme d'État est requis",
          })
        }

        // save files
        const identityDocumentPath = await saveUploadedFile(
          files.identityDocument.buffer,
          files.identityDocument.filename,
          files.identityDocument.mimetype,
        )
        const diplomaPath = await saveUploadedFile(
          files.diploma.buffer,
          files.diploma.filename,
          files.diploma.mimetype,
        )
        let orderAttestationPath: string | undefined
        if (files.orderAttestation) {
          orderAttestationPath = await saveUploadedFile(
            files.orderAttestation.buffer,
            files.orderAttestation.filename,
            files.orderAttestation.mimetype,
          )
        }

        const result = await contactRequestsService.createContactRequest({
          ...parsed.data,
          identityDocumentPath,
          diplomaPath,
          orderAttestationPath,
        })

        return reply.status(201).send({
          success: true,
          message: "Votre demande d'inscription a été envoyée avec succès.",
          data: result,
        })
      } else if (requestType === 'CABINET') {
        const parsed = createCabinetRequestSchema.safeParse(fields)
        if (!parsed.success) {
          const errors = parsed.error.issues
            .map((e: { message: string }) => e.message)
            .join(', ')
          return reply.status(400).send({ success: false, message: errors })
        }

        if (!files.cabinetRegDoc) {
          return reply.status(400).send({
            success: false,
            message:
              "Le document d'enregistrement du cabinet (RCCM) est requis",
          })
        }

        const cabinetRegDocPath = await saveUploadedFile(
          files.cabinetRegDoc.buffer,
          files.cabinetRegDoc.filename,
          files.cabinetRegDoc.mimetype,
        )

        const result = await contactRequestsService.createContactRequest({
          ...parsed.data,
          cabinetRccm: fields.cabinetRccm || null,
          cabinetRegDocPath,
        })

        return reply.status(201).send({
          success: true,
          message:
            "Votre demande d'inscription cabinet a été envoyée avec succès.",
          data: result,
        })
      } else {
        return reply.status(400).send({
          success: false,
          message:
            'Type de demande invalide. Utilisez PRACTITIONER ou CABINET.',
        })
      }
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, "Erreur lors de l'envoi de la demande")
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async getAllContactRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status, requestType } = request.query as {
        status?: ContactRequestStatus
        requestType?: string
      }

      const contactRequests =
        await contactRequestsService.getAllContactRequests({
          status,
          requestType,
        })

      return reply.status(200).send({
        success: true,
        data: contactRequests,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors de la récupération des demandes')
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async getContactRequestById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }

      const contactRequest =
        await contactRequestsService.getContactRequestById(id)

      if (!contactRequest) {
        return reply.status(404).send({
          success: false,
          message: 'Demande de contact introuvable',
        })
      }

      return reply.status(200).send({
        success: true,
        data: contactRequest,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors de la récupération de la demande')
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async updateContactRequestStatus(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params as { id: string }
      const { status, adminNotes } = request.body as {
        status: ContactRequestStatus
        adminNotes?: string
      }
      const userId = (request as any).user?.id

      const contactRequest =
        await contactRequestsService.updateContactRequestStatus(
          id,
          status,
          adminNotes,
          userId,
        )

      return reply.status(200).send({
        success: true,
        message: 'Statut de la demande mis à jour avec succès',
        data: contactRequest,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors de la mise à jour du statut')
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async approveRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const userId = (request as any).user?.id

      const result = await contactRequestsService.approveRequest(id, userId)

      return reply.status(200).send({
        success: true,
        message: 'Demande approuvée. Un email a été envoyé au demandeur.',
        data: result,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, "Erreur lors de l'approbation")
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async rejectRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const { rejectionReason } = request.body as { rejectionReason: string }
      const userId = (request as any).user?.id

      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return reply.status(400).send({
          success: false,
          message: 'Le motif de rejet doit contenir au moins 10 caractères',
        })
      }

      const result = await contactRequestsService.rejectRequest(
        id,
        rejectionReason.trim(),
        userId,
      )

      return reply.status(200).send({
        success: true,
        message: 'Demande rejetée. Un email a été envoyé au demandeur.',
        data: result,
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors du rejet')
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async deleteContactRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }

      await contactRequestsService.deleteContactRequest(id)

      return reply.status(200).send({
        success: true,
        message: 'Demande de contact supprimée avec succès',
      })
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors de la suppression de la demande')
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  // allowed document field names for contact requests
  private static readonly DOCUMENT_FIELDS = [
    'identityDocumentPath',
    'diplomaPath',
    'orderAttestationPath',
    'cabinetRegDocPath',
  ] as const

  async downloadDocument(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, field } = request.params as { id: string; field: string }

      // validate field name
      const allowedFields =
        ContactRequestsController.DOCUMENT_FIELDS as readonly string[]
      if (!allowedFields.includes(field)) {
        return reply.status(400).send({
          success: false,
          message: 'Champ de document invalide',
        })
      }

      const contactRequest =
        await contactRequestsService.getContactRequestById(id)

      if (!contactRequest) {
        return reply.status(404).send({
          success: false,
          message: 'Demande de contact introuvable',
        })
      }

      const relativePath = (contactRequest as any)[field] as string | null

      if (!relativePath) {
        return reply.status(404).send({
          success: false,
          message: 'Document non disponible',
        })
      }

      // remove / to prevent it treated as absolute path and add the upload dir to it
      const absolutePath = path.resolve(
        path.join(__dirname, '../../..'),
        relativePath.replace(/^\//, ''),
      )
      const resolvedUploadDir = path.resolve(
        path.join(__dirname, '../../../uploads'),
      )

      if (!absolutePath.startsWith(resolvedUploadDir + path.sep)) {
        return reply.status(403).send({
          success: false,
          message: 'Accès refusé',
        })
      }

      if (!fs.existsSync(absolutePath)) {
        return reply.status(404).send({
          success: false,
          message: 'Fichier introuvable sur le serveur',
        })
      }

      const ext = path.extname(absolutePath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
      }
      const contentType = mimeMap[ext] ?? 'application/octet-stream'
      const filename = `document-${id}-${field}${ext}`

      const fileStream = fs.createReadStream(absolutePath)
      reply.header('Content-Type', contentType)
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(fileStream)
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error, 'Erreur lors du téléchargement du document')
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }
}
