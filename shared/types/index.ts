// common types shared between frontend and backend
export interface User {
  id: string;
  email: string;
  role: "PATIENT" | "PRACTITIONER" | "STAFF" | "CABINET_ADMIN" | "ADMIN";
  firstName: string;
  lastName: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  practitionerId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW"
    | "RESCHEDULED";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export * from './reviews.contract';
export * from './health-reminders.contract';
