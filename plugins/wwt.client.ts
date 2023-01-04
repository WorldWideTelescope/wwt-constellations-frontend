import { engineStore, wwtPinia, WWTComponent } from "@wwtelescope/engine-pinia";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("WorldWideTelescope", WWTComponent);
  nuxtApp.vueApp.use(wwtPinia);
  return {
    provide: {
      engineStore,
    }
  };
});


// export default defineNuxtPlugin(nuxtApp => {});
