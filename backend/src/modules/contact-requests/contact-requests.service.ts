import prisma from '../../config/database'
import { ContactRequestStatus } from '@prisma/client'
import {
  CreateContactRequestInput,
  ContactRequestResponse,
} from './contact-requests.types'

export class ContactRequestsService {
  async createContactRequest(
    data: CreateContactRequestInput,
  ): Promise<ContactRequestResponse> {
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        email: data.email,
        status: {
          in: ['PENDING', 'CONTACTED'],
        },
      },
    })

    if (existingRequest) {
      throw new Error(
        'Une demande de contact est déjà en cours de traitement pour cet email',
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error(
        'Cet email est déjà associé à un compte existant. Veuillez vous connecter.',
      )
    }

    // create contact request
    const contactRequest = await prisma.contactRequest.create({
      data: {
        requestType: data.requestType,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        postalCode: data.postalCode,
        specialty: data.specialty,
        status: 'PENDING',
      },
    })

    return contactRequest
  }

  async getAllContactRequests(filters?: {
    status?: string
    requestType?: string
  }): Promise<ContactRequestResponse[]> {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.requestType) {
      where.requestType = filters.requestType
    }

    const contactRequests = await prisma.contactRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return contactRequests
  }

  async getContactRequestById(
    id: string,
  ): Promise<ContactRequestResponse | null> {
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
    })

    return contactRequest
  }

  async updateContactRequestStatus(
    id: string,
    status: ContactRequestStatus,
    adminNotes?: string,
    processedBy?: string,
  ): Promise<ContactRequestResponse> {
    const contactRequest = await prisma.contactRequest.update({
      where: { id },
      data: {
        status,
        adminNotes,
        processedBy,
        processedAt: new Date(),
      },
    })

    return contactRequest
  }

  async deleteContactRequest(id: string): Promise<void> {
    await prisma.contactRequest.delete({
      where: { id },
    })
  }
}
