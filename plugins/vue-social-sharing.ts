import VueSocialSharing from "vue-social-sharing";

export default defineNuxtPlugin(nuxtApp => {
  // Due to the usual JavaScript module tomfoolery, on the
  // server side the import that *should* work doesn't,
  // and we need to work around:
  const plugin = process.server ? VueSocialSharing.default : VueSocialSharing;
  nuxtApp.vueApp.use(plugin);
});