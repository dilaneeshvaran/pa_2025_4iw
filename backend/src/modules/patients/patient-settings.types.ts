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
  postalCode: string | null
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
}

export interface UpdateEmailData {
  newEmail: string
  password: string
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export interface NotificationPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  appointmentReminders: boolean
  newMessages: boolean
  healthTipsAndNews: boolean
}

export interface ConsentRecord {
  id: string
  consentType: string
  version: string
  accepted: boolean
  acceptedAt: string
  revokedAt: string | null
}

export interface ConsentInput {
  consentType: string
  version: string
  accepted: boolean
}
