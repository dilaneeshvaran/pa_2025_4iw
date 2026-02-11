export interface PatientProfile {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string | null
  city: string | null
  country: string
  bloodType: string | null
  height: number | null
  weight: number | null
  allergies: string[]
  chronicConditions: string[]
  surgicalOperations: string[]
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  bloodType?: string
  height?: number
  weight?: number
}

export interface UpdateAntecedentsData {
  allergies?: string[]
  chronicConditions?: string[]
  surgicalOperations?: string[]
}

export interface ConsultationRecord {
  id: string
  appointmentDate: string
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  practitioner: {
    firstName: string
    lastName: string
    title: string
    specialty: string | null
  }
  medicalRecord: {
    id: string
    chiefComplaint: string | null
    diagnosis: string | null
    treatmentPlan: string | null
    bloodPressure: string | null
    heartRate: number | null
    temperature: number | null
    weight: number | null
    height: number | null
    documents: {
      id: string
      type: string
      title: string
      fileName: string
      mimeType: string
      fileSize: number
      uploadedAt: string
    }[]
  } | null
}

export interface PrescriptionRecord {
  id: string
  medications: any
  issuedDate: string
  validUntil: string | null
  practitioner: {
    firstName: string
    lastName: string
    title: string
  }
  medicalRecord: {
    appointment: {
      appointmentDate: string
    }
  }
}

export interface DocumentRecord {
  id: string
  type: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  medicalRecord: {
    appointment: {
      appointmentDate: string
    }
    practitioner: {
      firstName: string
      lastName: string
      title: string
    }
  } | null
}

export interface VaccinationRecord {
  id: string
  vaccineName: string
  vaccineType: string | null
  manufacturer: string | null
  batchNumber: string | null
  doseNumber: number
  administeredAt: string
  administeredBy: string | null
  location: string | null
  nextDoseDate: string | null
  sideEffects: string | null
  certificatePath: string | null
}

export interface CreateVaccinationData {
  vaccineName: string
  vaccineType?: string
  manufacturer?: string
  batchNumber?: string
  doseNumber?: number
  administeredAt: string
  administeredBy?: string
  location?: string
  nextDoseDate?: string
  sideEffects?: string
}
