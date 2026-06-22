export type DashboardRole =
  | "PATIENT"
  | "PRACTITIONER"
  | "STAFF"
  | "CABINET_ADMIN"
  | "ADMIN"
  | string
  | null
  | undefined;

export const getDashboardPath = (role: DashboardRole): string => {
  switch (role) {
    case "PRACTITIONER":
      return "/practitioner/dashboard";
    case "STAFF":
      return "/staff/dashboard";
    case "CABINET_ADMIN":
      return "/cabinet/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "PATIENT":
    default:
      return "/patient/dashboard";
  }
};
