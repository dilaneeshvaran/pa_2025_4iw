// common types shared between frontend and backend
export interface User {
  id: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  firstName: string;
  lastName: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
