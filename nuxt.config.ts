// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  css: ["~/assets/main.less"],
  build: {
    transpile:
      // magic needed by naive-ui:
      (process.env.NODE_ENV === "production"
        ? [
          "naive-ui",
          "vueuc",
          "@css-render/vue3-ssr",
        ] : []).concat(
          [
            "date-fns",
            "@juggle/resize-observer",
            "@wwtelescope/engine",
            "@wwtelescope/engine-pinia",
            "@wwtelescope/engine-helpers",
            "@wwtelescope/engine-types",
            "@wwtelescope/astro"
          ]),
  },
  modules: [
    '@vueuse/nuxt',
  ],
  builder: "webpack",
  vite: {
    // magic needed by naive-ui:
    optimizeDeps: {
      include:
        process.env.NODE_ENV === "development"
          ? ["naive-ui", "vueuc", "date-fns-tz/esm/formatInTimeZone", "axe-core"]
          : []
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: "http://localhost:7000",
      keycloakUrl: "http://localhost:8080/",
      hostUrl: "http://localhost:3000"
    }
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en"
      }
    }
  },
});
