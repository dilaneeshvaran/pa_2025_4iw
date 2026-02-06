import { fileURLToPath } from "url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@nuxtjs/google-fonts",
    "@vueuse/nuxt",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./", import.meta.url)),
        "@": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.FRONTEND_API_BASE_URL || "http://localhost:3000",
      stripePublicKey: process.env.FRONTEND_STRIPE_PUBLIC_KEY,
      googleClientId: process.env.FRONTEND_GOOGLE_CLIENT_ID,
    },
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
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  nitro: {
    compressPublicAssets: true,
  },
});
