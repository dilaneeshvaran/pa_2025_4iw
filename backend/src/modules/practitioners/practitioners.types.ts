export interface PractitionerSearchFilters {
  search?: string
  specialtyId?: string
  cabinetId?: string
  city?: string
  teleconsultationEnabled?: boolean
  availableToday?: boolean
  minPrice?: number
  maxPrice?: number
  minRating?: number
  acceptsInsurance?: boolean
  latitude?: number
  longitude?: number
  radiusKm?: number
}

export interface PractitionerSearchResult {
  id: string
  firstName: string
  lastName: string
  title: string
  phone: string
  bio: string | null
  clinicName: string | null
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  baseConsultationFee: number
  teleconsultationFee: number | null
  teleconsultationEnabled: boolean
  averageRating: number | null
  totalReviews: number
  acceptsInsurance: boolean
  acceptsNewPatients: boolean
  specialties: Array<{
    id: string
    name: string
    isPrimary: boolean
  }>
  cabinets?: Array<{
    id: string
    name: string
    city?: string | null
  }>
  availableToday?: boolean
  nextAvailableSlot?: string | null
}

export interface PractitionerDetailResponse extends PractitionerSearchResult {
  licenseNumber: string
  licenseVerified: boolean
  yearsOfExperience: number | null
  consultationDuration: number
  qualifications: Array<{
    id: string
    degree: string
    institution: string
    yearObtained: number
  }>
  languages: string[]
  photos: string[]
}

export interface AvailableSlot {
  date: string // iso date string
  slots: string[] // array of time strings like "09:00" or "10:00"
}
