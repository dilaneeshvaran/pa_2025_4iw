export interface MedibotPractitioner {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string | null;
  specialty: string | null;
  city: string | null;
  address: string | null;
  clinicName: string | null;
  baseConsultationFee: number;
  teleconsultationFee: number | null;
  teleconsultationEnabled: boolean;
  averageRating: number | null;
  totalReviews: number;
}

export interface MedibotSlotsDay {
  date: string;
  slots: string[];
}

export interface MedibotBooking {
  practitionerId: string;
  practitionerName: string;
  appointmentDate: string;
  startTime: string;
  type: "IN_PERSON" | "TELECONSULTATION";
  reason: string | null;
  fee: number;
  currency: string;
  requiresPayment: boolean;
}

export type MedibotAction =
  | { type: "practitioners"; practitioners: MedibotPractitioner[] }
  | {
      type: "slots";
      practitionerId: string;
      practitionerName: string;
      days: MedibotSlotsDay[];
    }
  | { type: "booking_confirm"; booking: MedibotBooking }
  | { type: "auth"; mode: "login" | "signup" | "reset" }
  | { type: "logout" }
  | { type: "navigate"; path: string; label: string }
  /** closed question: one-tap answers, typing stays possible */
  | { type: "quick_replies"; options: string[] };

export interface MedibotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: MedibotAction[];
  /** transient states rendered by the UI */
  pending?: boolean;
  error?: boolean;
  /** reveal the text word by word (fresh replies only, never history) */
  animate?: boolean;
}

export interface MedibotSendResponse {
  success: boolean;
  data: {
    conversationId: string;
    message: string;
    actions: MedibotAction[];
  };
  message?: string;
}
