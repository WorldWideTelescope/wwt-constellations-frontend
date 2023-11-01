// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  telemetry: false,
  css: ["~/assets/main.less"],
  build: {
    transpile:
      // magic needed by naive-ui:
      (process.env.NODE_ENV === "production"
        ? [
          "naive-ui",
          "@css-render/vue3-ssr",
        ] : []).concat(
          [
            "vueuc",
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
    '@dargmuesli/nuxt-cookie-control'
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
      googleAnalyticsTag: "",
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
  cookieControl: {
    colors: {
      checkboxActiveBackground: '#7fe7c4',
      barButtonHoverColor: '#7fe7c4',
      controlButtonHoverBackground: '#7fe7c4',
    },
    closeModalOnClickOutside: true,
    isControlButtonEnabled: false,
    isDashInDescriptionEnabled: false,
    cookies: {
      necessary: [
        {
          name: 'Functionality cookies',
          description: 'These cookies are required for the website to function properly.',
        },
      ],
      optional: [
        {
          id: 'ga',
          name: 'Google Analytics',
          // In production, `src` (and everything else in this file!) is frozen
          // at build time, so it can't depend on a runtime environment variable
          // as we would like. So, `plugins/vue-gtag.client.ts` updates this
          // field based on the public `googleAnalyticsTag` setting defined
          // above, which in turn can be configured at runtime with
          // $NUXT_PUBLIC_GOOGLE_ANALYTICS_TAG.
          src: 'https://www.googletagmanager.com/gtag/js?id=defaulted',
          targetCookieIds: ['cookie_control_consent', 'cookie_control_enabled_cookies']
        },
      ],
    },
    isCookieIdVisible: false,
  }
});
