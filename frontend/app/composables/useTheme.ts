import { computed } from "vue";
import { useColorMode } from "@vueuse/core";

export type ThemePreference = "auto" | "light" | "dark";

/**
 * Centralised theme state for the app.
 *
 * Wraps VueUse `useColorMode` so that:
 *  - the `.dark` class is toggled on <html> (matches tailwind `darkMode: "class"`),
 *  - the user choice is persisted under `medicote-theme` (kept in sync with the
 *    anti-FOUC inline script declared in nuxt.config.ts),
 *  - the preference can be "auto" (follow the OS), "light" or "dark".
 */
export const useTheme = () => {
  const colorMode = useColorMode({
    selector: "html",
    attribute: "class",
    storageKey: "medicote-theme",
    modes: { light: "light", dark: "dark" },
  });

  // raw user preference: "auto" | "light" | "dark"
  const preference = colorMode.store;
  // resolved system scheme when preference is "auto"
  const system = colorMode.system;
  // whether dark styles are currently applied
  const isDark = computed(() => colorMode.value === "dark");

  const order: ThemePreference[] = ["auto", "light", "dark"];

  /** auto -> light -> dark -> auto */
  const cycle = () => {
    const next = order[(order.indexOf(preference.value) + 1) % order.length];
    preference.value = next;
  };

  const setPreference = (value: ThemePreference) => {
    preference.value = value;
  };

  return { preference, system, isDark, cycle, setPreference };
};
