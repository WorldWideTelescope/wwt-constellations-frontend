import VueGtag from "vue-gtag";

export default defineNuxtPlugin(nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  if (nuxtConfig.public.googleAnalyticsTag) {
    const cookieControl = useCookieControl();

    // By watching the cookies-enabled setting, we can react to the user's
    // acceptance of the cookie banner and send the analytics request
    // immediately. This matters because if we're not responsive like that,
    // we'll never get a report for a visitor who only loads the page once but
    // *does* agree to accept cookies.
    watchEffect(() => {
      if (cookieControl.cookiesEnabledIds.value?.includes('ga')) {
        nuxtApp.vueApp.use(VueGtag, {
          config: { id: nuxtConfig.public.googleAnalyticsTag }
        });
      }
    });
  }
});