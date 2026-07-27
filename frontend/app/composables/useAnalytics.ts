import {
  stripQueryParams,
  isDntActive,
  isAllowedEvent,
  buildScriptElement,
  type AllowedEvent,
} from "~/utils/analytics";

declare global {
  interface Window {
    umami?: {
      track: {
        (callback: (props: Record<string, any>) => Record<string, any>): void;
        (
          eventName: string,
          data?: Record<string, string | number | boolean>,
        ): void;
      };
    };
  }
}

const analyticsLoaded = ref(false);
const isClient = () => import.meta.client || typeof window !== "undefined";

export function useAnalytics() {
  const config = useRuntimeConfig();

  const isAnalyticsLoaded = computed(() => analyticsLoaded.value);

  const initAnalytics = (): void => {
    if (!isClient()) return;
    if (isDntActive(navigator, window)) return;
    if (!config.public.umamiEnabled) return;
    if (!config.public.umamiUrl || !config.public.umamiWebsiteId) return;
    if (analyticsLoaded.value) return;

    const existing = document.querySelector("script[data-website-id]");
    if (existing) {
      analyticsLoaded.value = true;
      return;
    }

    const script = buildScriptElement(
      String(config.public.umamiUrl),
      String(config.public.umamiWebsiteId),
      window.location.hostname,
    );
    script.onload = () => {
      analyticsLoaded.value = true;
    };
    document.head.appendChild(script);
  };

  const trackPageView = (path?: string): void => {
    if (!isClient()) return;
    if (isDntActive(navigator, window)) return;
    if (!analyticsLoaded.value || !window.umami) return;

    const url = path
      ? stripQueryParams(path)
      : stripQueryParams(window.location.href);
    window.umami.track((props) => ({ ...props, url }));
  };

  const trackEvent = (
    eventName: AllowedEvent,
    data?: Record<string, string | number | boolean>,
  ): void => {
    if (!isClient()) return;
    if (isDntActive(navigator, window)) return;
    if (!analyticsLoaded.value || !window.umami) return;
    if (!isAllowedEvent(eventName)) return;

    window.umami.track(eventName, data);
  };

  return { initAnalytics, trackPageView, trackEvent, isAnalyticsLoaded };
}
