export interface PatientInfo {
  id: string
  firstName: string
  lastName: string
  phone: string
}

export interface AppointmentInfo {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  patient: PatientInfo
}

export interface MessageInfo {
  conversationId: string
  patientName: string
  lastMessage: string
  isFromPatient: boolean
  unread: boolean
  createdAt: Date
}

export interface TodoInfo {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export interface DashboardData {
  consultationsThisMonth: number
  revenue: number
  attendanceRate: number
  newPatients: number
  nextAppointment: AppointmentInfo | null
  todayAppointments: AppointmentInfo[]
  waitingTeleconsultations: number
  recentMessages: MessageInfo[]
  todos: TodoInfo[]
}
