export interface PatientListItem {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: string
  phone: string
  email: string | null
  city: string | null
  bloodType: string | null
  isNew: boolean
  firstAppointmentDate: Date | null
  totalConsultations: number
  nextAppointment: {
    id: string
    appointmentDate: Date
    startTime: string
    type: string
    status: string
  } | null
  lastAppointment: {
    id: string
    appointmentDate: Date
    startTime: string
    type: string
    status: string
  } | null
}

export interface PatientDetail {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: string
  phone: string
  email: string | null
  city: string | null
  address: string | null
  bloodType: string | null
  allergies: string[]
  chronicConditions: string[]
  height: number | null
  weight: number | null
  isNew: boolean
  firstAppointmentDate: Date | null
  totalConsultations: number
  lastAppointment: {
    id: string
    appointmentDate: Date
    startTime: string
    type: string
    status: string
  } | null
  nextAppointment: {
    id: string
    appointmentDate: Date
    startTime: string
    type: string
    status: string
  } | null
}

export interface PatientsListResponse {
  patients: PatientListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
