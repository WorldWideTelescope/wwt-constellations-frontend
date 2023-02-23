// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  css: ["~/assets/main.less"],
  build: {
    transpile: [
      "@wwtelescope/engine",
      "@wwtelescope/engine-pinia",
      "@wwtelescope/engine-helpers",
      "@wwtelescope/engine-types",
      "@wwtelescope/astro"
    ],
  },
  builder: "webpack"
});
