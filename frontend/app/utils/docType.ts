// french for document type
export const getDocTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    PRESCRIPTION: "Ordonnance",
    LAB_RESULT: "Analyse",
    RADIOLOGY: "Imagerie",
    MEDICAL_REPORT: "Rapport médical",
    CERTIFICATE: "Certificat",
    CONSENT_FORM: "Consentement",
    INSURANCE: "Assurance",
    OTHER: "Autre",
  };
  return labels[type] || "Document";
};

// css for document type icon
export const getDocTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    PRESCRIPTION: "bg-blue-100 text-blue-600",
    LAB_RESULT: "bg-green-100 text-green-600",
    RADIOLOGY: "bg-cyan-100 text-cyan-600",
    MEDICAL_REPORT: "bg-purple-100 text-purple-600",
    CERTIFICATE: "bg-amber-100 text-amber-600",
    CONSENT_FORM: "bg-pink-100 text-pink-600",
    INSURANCE: "bg-indigo-100 text-indigo-600",
    OTHER: "bg-gray-100 text-gray-600",
  };
  return colors[type] || "bg-gray-100 text-gray-600";
};

// css for document type badge
export const getDocTypeBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    PRESCRIPTION: "bg-blue-50 text-blue-700",
    LAB_RESULT: "bg-green-50 text-green-700",
    RADIOLOGY: "bg-cyan-50 text-cyan-700",
    MEDICAL_REPORT: "bg-purple-50 text-purple-700",
    CERTIFICATE: "bg-amber-50 text-amber-700",
    CONSENT_FORM: "bg-pink-50 text-pink-700",
    INSURANCE: "bg-indigo-50 text-indigo-700",
    OTHER: "bg-gray-50 text-gray-700",
  };
  return colors[type] || "bg-gray-50 text-gray-700";
};
