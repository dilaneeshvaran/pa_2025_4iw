const PRACTITIONER_PROFILE_TABS = [
  "about",
  "availability",
  "reviews",
  "location",
] as const;

export type PractitionerProfileTab = (typeof PRACTITIONER_PROFILE_TABS)[number];

export const parsePractitionerProfileTab = (
  tab: unknown,
): PractitionerProfileTab => {
  return typeof tab === "string" &&
    PRACTITIONER_PROFILE_TABS.includes(tab as PractitionerProfileTab)
    ? (tab as PractitionerProfileTab)
    : "about";
};
