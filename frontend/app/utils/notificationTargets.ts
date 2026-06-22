export type NotificationUserRole =
  | "PATIENT"
  | "PRACTITIONER"
  | "ADMIN"
  | "STAFF"
  | "CABINET_ADMIN"
  | string;

export type NotificationMetadata = Record<string, unknown> | null | undefined;

export interface NotificationTargetInput {
  type: string;
  metadata?: NotificationMetadata;
}

const safeInternalPath = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return value;
};

const metadataString = (
  metadata: NotificationMetadata,
  key: string,
): string | null => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const metadataBoolean = (
  metadata: NotificationMetadata,
  key: string,
): boolean => metadata?.[key] === true;

const withQuery = (
  path: string,
  params: Record<string, string | null | undefined>,
) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
};

const roleDashboard = (role: NotificationUserRole) => {
  switch (role) {
    case "PRACTITIONER":
      return "/practitioner/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "STAFF":
      return "/staff/dashboard";
    case "CABINET_ADMIN":
      return "/cabinet/dashboard";
    case "PATIENT":
    default:
      return "/patient/dashboard";
  }
};

const messageTarget = (
  role: NotificationUserRole,
  metadata: NotificationMetadata,
) => {
  const conversationId = metadataString(metadata, "conversationId");

  if (role === "PRACTITIONER") {
    return withQuery("/practitioner/messages", { conversationId });
  }

  if (role === "PATIENT") {
    return withQuery("/patient/messages", { conversationId });
  }

  return roleDashboard(role);
};

const appointmentTarget = (
  role: NotificationUserRole,
  notificationType: string,
  metadata: NotificationMetadata,
) => {
  const appointmentId = metadataString(metadata, "appointmentId");
  const appointmentType = metadataString(metadata, "appointmentType");
  const isTeleconsultation =
    appointmentType === "TELECONSULTATION" ||
    metadataBoolean(metadata, "teleconsultation") ||
    Boolean(metadataString(metadata, "teleconsultationId")) ||
    Boolean(metadataString(metadata, "sessionId"));

  if (role === "PRACTITIONER") {
    return isTeleconsultation
      ? withQuery("/practitioner/teleconsultations", { appointmentId })
      : withQuery("/practitioner/agenda", { appointmentId });
  }

  if (role === "PATIENT") {
    if (isTeleconsultation) {
      return withQuery("/patient/teleconsultations", { appointmentId });
    }

    return withQuery("/patient/appointments", {
      appointmentId,
      tab: notificationType === "APPOINTMENT_CANCELLATION" ? "cancelled" : null,
    });
  }

  return role === "ADMIN" ? "/admin/dashboard#appointments" : roleDashboard(role);
};

const documentTarget = (
  role: NotificationUserRole,
  metadata: NotificationMetadata,
) => {
  const documentId = metadataString(metadata, "documentId");
  const patientId = metadataString(metadata, "patientId");

  if (role === "PRACTITIONER") {
    return patientId
      ? withQuery(`/practitioner/patients/${patientId}/medical-record`, {
          tab: "documents",
          documentId,
        })
      : "/practitioner/patients";
  }

  if (role === "PATIENT") {
    return withQuery("/patient/documents", { documentId });
  }

  return role === "ADMIN" ? "/admin/audit-logs" : roleDashboard(role);
};

const paymentTarget = (role: NotificationUserRole) => {
  if (role === "PRACTITIONER") {
    return "/practitioner/billing?tab=received";
  }

  if (role === "PATIENT") {
    return "/patient/billing?tab=invoices";
  }

  return role === "ADMIN" ? "/admin/subscriptions" : roleDashboard(role);
};

const healthReminderTarget = (role: NotificationUserRole) => {
  if (role === "PATIENT") {
    return "/patient/dashboard#health-reminders";
  }

  return roleDashboard(role);
};

export const getNotificationTarget = (
  notification: NotificationTargetInput,
  role: NotificationUserRole,
): string => {
  const metadata = notification.metadata;
  const explicitTarget = safeInternalPath(metadata?.targetPath);

  if (explicitTarget) {
    return explicitTarget;
  }

  switch (notification.type) {
    case "MESSAGE_RECEIVED":
      return messageTarget(role, metadata);
    case "APPOINTMENT_REMINDER":
    case "APPOINTMENT_CONFIRMATION":
    case "APPOINTMENT_CANCELLATION":
      return appointmentTarget(role, notification.type, metadata);
    case "DOCUMENT_SHARED":
      return documentTarget(role, metadata);
    case "PAYMENT_RECEIVED":
      return paymentTarget(role);
    case "HEALTH_REMINDER":
      return healthReminderTarget(role);
    case "CAMPAIGN_MESSAGE":
      return role === "ADMIN" ? "/admin/campaigns" : roleDashboard(role);
    case "SYSTEM_ALERT":
    default:
      return roleDashboard(role);
  }
};
