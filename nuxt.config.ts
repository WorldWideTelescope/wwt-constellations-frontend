// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  css: ["~/assets/main.less"],
  build: {
    transpile: [
      "@wwtelescope/engine-pinia"
    ],
  },
  builder: "webpack"
});
