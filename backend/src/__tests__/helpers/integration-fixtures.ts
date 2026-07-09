import { TestUserRole } from './integration-app'

export function testUser(role: TestUserRole = 'PATIENT', id = `user-${role.toLowerCase()}`) {
  return {
    id,
    email: `${id}@medicote.test`,
    role,
    status: 'ACTIVE',
    emailVerified: true,
  }
}

export function patientProfile(id = 'patient-1') {
  return { id }
}

export function practitionerProfile(id = 'practitioner-1') {
  return { id }
}

export function paginatedResult<T>(data: T[] = []) {
  return {
    data,
    total: data.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  }
}

export const emptyDocumentResult = {
  data: [],
  total: 0,
  counts: {
    total: 0,
    prescriptions: 0,
    results: 0,
    reports: 0,
    other: 0,
  },
}
