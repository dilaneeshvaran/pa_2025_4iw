// https://nuxt.com/docs/api/configuration/nuxt-config
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
    optimizeDeps: {
      include: ["leaflet"],
    },
    ssr: {
      noExternal: ["leaflet"],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.FRONTEND_API_BASE_URL || "http://localhost:3001/api",
      stripePublicKey: process.env.FRONTEND_STRIPE_PUBLIC_KEY,
      googleClientId: process.env.FRONTEND_GOOGLE_CLIENT_ID,
    },
  },

  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700],
    },
    display: "swap",
  },

  app: {
    head: {
      title: "Medical Appointment App",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Book medical appointments in Côte d'Ivoire",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
      // Anti-FOUC: apply the persisted/system theme on <html> before first paint.
      // Storage key kept in sync with useTheme() (composables/useTheme.ts).
      script: [
        {
          innerHTML: `(function(){try{var p=localStorage.getItem('medicote-theme');var d=p==='dark'||((!p||p==='auto')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.remove('dark','light');e.classList.add(d?'dark':'light');}catch(e){}})();`,
          tagPosition: "head",
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  ignore: ["**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"],

  nitro: {
    compressPublicAssets: true,
  },
});
