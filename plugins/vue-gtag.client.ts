import VueGtag from "vue-gtag";

export default defineNuxtPlugin(nuxtApp => {
  const nuxtConfig = useRuntimeConfig();
  const cookieControl = useCookieControl();

  if (nuxtConfig.public.googleAnalyticsTag && cookieControl.cookiesEnabledIds.value?.includes('ga')) {
    nuxtApp.vueApp.use(VueGtag, {
      config: { id: nuxtConfig.public.googleAnalyticsTag }
    });
  }
});