import { VueEternalLoading } from "@ts-pro/vue-eternal-loading";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("VueEternalLoading", VueEternalLoading);
});
