import { type APIRequestContext } from '@playwright/test'

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:3001/api'

type PendingPractitionerRequest = {
  firstName: string
  lastName: string
  email: string
}

export async function createPendingPractitionerRequest(
  request: APIRequestContext,
  overrides: Partial<PendingPractitionerRequest> = {},
): Promise<PendingPractitionerRequest> {
  const suffix = Date.now()
  const practitioner: PendingPractitionerRequest = {
    firstName: 'E2E',
    lastName: overrides.lastName ?? `Pending${suffix}`,
    email: overrides.email ?? `e2e-pending-${suffix}@test.fr`,
  }

  const response = await request.post(`${apiBase}/contact-requests/register`, {
    multipart: {
      requestType: 'PRACTITIONER',
      firstName: practitioner.firstName,
      lastName: practitioner.lastName,
      email: practitioner.email,
      phone: '+2250700000099',
      orderNumber: `E2E-ORD-${suffix}`,
      specialty: 'Dermatologie',
      clinicAddress: 'Abidjan, Plateau',
      identityDocument: {
        name: 'identity.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 E2E identity'),
      },
      diploma: {
        name: 'diploma.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 E2E diploma'),
      },
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Failed to create pending practitioner request: ${response.status()} ${await response.text()}`,
    )
  }

  return practitioner
}
