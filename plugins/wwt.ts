import { engineStore, WWTComponent, wwtPinia } from "@wwtelescope/engine-pinia";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("WorldWideTelescope", WWTComponent);
  nuxtApp.vueApp.use(wwtPinia);
  return {
    provide: {
      engineStore,
      wwtPinia
    }
  };
});


// export default defineNuxtPlugin(nuxtApp => {});
