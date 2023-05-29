import VueGtag from "vue-gtag";

export default defineNuxtPlugin(nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  if (nuxtConfig.public.googleAnalyticsTag) {
    nuxtApp.vueApp.use(VueGtag, {
      config: { id: nuxtConfig.public.googleAnalyticsTag }
    });
  }
});