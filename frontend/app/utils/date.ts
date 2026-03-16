// day + long month + year = 1 janvier 2025
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// weekday + day + long month + year = lundi 1 janvier 2025
export const formatDateLong = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// day + short month + year = 1 janv. 2025
export const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// short date + time = 1 janv. 2025 14:30
export const formatDateWithTime = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// month + year = janvier 2025
export const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
};

// full date with time = 1 janvier 2025 à 14:30
export const formatConsentDate = (dateStr: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// time only (HH:mm) = 14:30
export const formatMessageTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// "maintenant", "5min", "2h", "3j", or short date for older
export const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "maintenant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

// "aujourdhui", "Hier", or "lundi 1 janvier" - for message group headers
export const formatDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// "aujourdhui", "hier", "il y a x jours", or formatted date - for notifications
export const formatNotificationTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(dateStr);
};
