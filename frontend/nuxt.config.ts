// https://nuxt.com/docs/api/configuration/nuxt-config
const parsePositiveInteger = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const hmrClientPort = parsePositiveInteger(process.env.NUXT_HMR_CLIENT_PORT);
const pollingInterval = parsePositiveInteger(
  process.env.NUXT_VITE_POLLING_INTERVAL,
);

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@nuxtjs/google-fonts",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxt/eslint",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    server: {
      hmr:
        process.env.NUXT_HMR_HOST || hmrClientPort
          ? {
              protocol: "ws",
              host: process.env.NUXT_HMR_HOST,
              clientPort: hmrClientPort,
            }
          : undefined,
      watch:
        process.env.NUXT_VITE_USE_POLLING === "true"
          ? {
              usePolling: true,
              interval: pollingInterval ?? 250,
              ignored: [
                "**/node_modules/**",
                "**/.git/**",
                "**/.nuxt/**",
                "**/.output/**",
              ],
            }
          : undefined,
    },
    optimizeDeps: {
      include: ["leaflet"],
    },
    ssr: {
      noExternal: ["leaflet", "vue-toastification"],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.FRONTEND_API_BASE_URL || '/api',
      stripePublicKey: process.env.FRONTEND_STRIPE_PUBLIC_KEY,
      googleClientId: process.env.FRONTEND_GOOGLE_CLIENT_ID,
      umamiUrl: process.env.NUXT_PUBLIC_UMAMI_URL || "",
      umamiWebsiteId: process.env.NUXT_PUBLIC_UMAMI_WEBSITE_ID || "",
      umamiEnabled: process.env.NUXT_PUBLIC_UMAMI_ENABLED !== "false",
      webrtcIceServers: process.env.NUXT_PUBLIC_WEBRTC_ICE_SERVERS || "",
    },
  },

  googleFonts: {
    families: {
      "Plus Jakarta Sans": [400, 500, 600, 700],
      Outfit: [400, 500, 600, 700, 800, 900],
    },
    display: "swap",
  },

  app: {
    head: {
      title: "MediCôte - Plateforme médicale en Côte d'Ivoire",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "MediCôte - Prenez rendez-vous avec un professionnel de santé en Côte d'Ivoire. Consultations en cabinet et téléconsultations.",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  ignore: [
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.spec.ts",
  ],

  nitro: {
    compressPublicAssets: true,
  },
});
