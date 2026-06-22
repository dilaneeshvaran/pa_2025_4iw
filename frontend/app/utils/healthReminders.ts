import type { HealthReminderStatus } from "@medicote/shared";

export type HealthReminderStatusVariant = "default" | "success" | "danger";

export const getHealthReminderStatusLabel = (
  status: HealthReminderStatus,
): string => {
  const labels: Record<HealthReminderStatus, string> = {
    ACTIVE: "Actif",
    CANCELLED: "Arrêté",
    COMPLETED: "Terminé",
  };
  return labels[status];
};

export const getHealthReminderStatusVariant = (
  status: HealthReminderStatus,
): HealthReminderStatusVariant => {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "danger";
  return "default";
};
