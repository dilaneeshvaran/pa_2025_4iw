import { DayOfWeek } from '@prisma/client'

export interface AvailabilitySlot {
  id: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  slotDuration: number
  breakStartTime: string | null
  breakEndTime: string | null
  isEmergencySlot: boolean
  isActive: boolean
}

export interface AbsenceInfo {
  id: string
  startDate: Date
  endDate: Date
  reason: string | null
  notifiedPatients: boolean
  createdAt: Date
}

export interface BlockedSlotInfo {
  id: string
  date: Date
  startTime: string
  endTime: string
  reason: string | null
}

export interface PractitionerSettings {
  consultationDuration: number
  teleconsultationEnabled: boolean
  homeVisitEnabled: boolean
  emergencySlotsEnabled: boolean
  backToBack: boolean
  breakBetweenSlots: number
  minBookingNotice: number
  maxBookingAdvance: number
  cancellationNotice: number
  acceptsNewPatients: boolean
  newPatientMaxPerDay: number
  baseConsultationFee: number
  teleconsultationFee: number | null
}

export interface AgendaAppointment {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  duration: number
  type: string
  status: string
  reason: string | null
  consultationFee: number
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
}

export interface DaySummary {
  total: number
  cabinet: number
  teleconsultation: number
}
