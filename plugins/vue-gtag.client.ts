import VueGtag from "vue-gtag";

export default defineNuxtPlugin(nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  if (nuxtConfig.public.googleAnalyticsTag) {
    const cookieControl = useCookieControl();

    // The cookie-control package holds a list of the cookie IDs associated with
    // this framework. These are mostly set in `nuxt.config.ts`, but there is
    // one whose ID depends on the analytics tag. We'd like to configure that
    // tag at runtime, but that means that we can't configure the cookie ID
    // since the settings in the config file are frozen at *build* time. So, add
    // in the ID here. This list only seems to be used for deleting cookies
    // if/when permission is revoked, which frankly doesn't seem like a very
    // important use case, but let's try to get it right.
    for (const desc of cookieControl.moduleOptions.cookies.optional) {
      if (desc.id == "ga") {
        desc.targetCookieIds?.push(nuxtConfig.public.googleAnalyticsTag.replace("G-", "_ga_"));
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
        }, useRouter());
      }
    });
  }
});