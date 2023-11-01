import VueGtag from "vue-gtag";

export default defineNuxtPlugin(nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  if (nuxtConfig.public.googleAnalyticsTag) {
    const cookieControl = useCookieControl();

    // When this cookie is activated, the cookie-control package makes a request
    // to the `src` URL defined in `nuxt.config.ts`. But we'd like to configure
    // our analytics tag at runtime, whereas those config settings are frozen at
    // build time. So, override the frozen setting manually here, on plugin
    // startup.
    for (const desc of cookieControl.moduleOptions.cookies.optional) {
      if (desc.id == "ga") {
        desc.src = "https://www.googletagmanager.com/gtag/js?id=" + nuxtConfig.public.googleAnalyticsTag;
      }
    }

    // By watching the cookies-enabled setting, we can react to the user's
    // acceptance of the cookie banner and send the analytics request
    // immediately. This matters because if we're not responsive like that,
    // we'll never get a report for a visitor who only loads the page once but
    // *does* agree to accept cookies.
    watchEffect(() => {
      if (cookieControl.cookiesEnabledIds.value?.includes("ga")) {
        nuxtApp.vueApp.use(VueGtag, {
          config: { id: nuxtConfig.public.googleAnalyticsTag }
        });
      }
    });
  }
});