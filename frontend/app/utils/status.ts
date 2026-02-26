//appointment & payment status helpers

type BadgeVariant = "success" | "warning" | "danger" | "default" | "primary";

// badge appointment status
export const getStatusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    PENDING: "warning",
    CONFIRMED: "primary",
    COMPLETED: "success",
    CANCELLED: "danger",
    NO_SHOW: "danger",
    RESCHEDULED: "default",
  };
  return map[status] || "default";
};

// french for appointment status
export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmé",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
    NO_SHOW: "Absent",
    RESCHEDULED: "Reporté",
  };
  return map[status] || status;
};

// french for teleconsultation session status
export const getTeleconsultationStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    SCHEDULED: "Planifiée",
    WAITING: "En attente",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
    FAILED: "Échouée",
    NO_SHOW: "Non présenté",
  };
  return map[status] || status;
};

// badge for teleconsultation session status
export const getTeleconsultationStatusBadgeVariant = (
  status: string,
): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    IN_PROGRESS: "success",
    WAITING: "warning",
    SCHEDULED: "warning",
    COMPLETED: "primary",
    FAILED: "danger",
    CANCELLED: "danger",
    NO_SHOW: "danger",
  };
  return map[status] || "default";
};

// badge for payment status
export const getPaymentStatusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    COMPLETED: "success",
    PENDING: "warning",
    REFUNDED: "warning",
    FAILED: "danger",
    CANCELLED: "danger",
  };
  return map[status] || "default";
};

// french for payment status
export const getPaymentStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    COMPLETED: "Payé",
    PENDING: "En attente",
    REFUNDED: "Remboursé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
  };
  return map[status] || status;
};
