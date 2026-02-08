export interface PatientAppointment {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  consultationFee: number
  practitioner: {
    id: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
    photo: string | null
  }
}

export interface PatientAppointmentsResult {
  data: PatientAppointment[]
  total: number
  page: number
  limit: number
  totalPages: number
}
