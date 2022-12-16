import { wwtPinia, WWTComponent } from "@wwtelescope/engine-pinia";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("WorldWideTelescope", WWTComponent);
  nuxtApp.vueApp.use(wwtPinia);
});


// export default defineNuxtPlugin(nuxtApp => {});
