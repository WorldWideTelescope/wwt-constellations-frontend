import { engineStore, wwtPinia, WWTComponent } from "@wwtelescope/engine-pinia";
import { WWTInstance } from "@wwtelescope/engine-helpers";
import { WWTGlobalState } from "@wwtelescope/engine-pinia";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("WorldWideTelescope", WWTComponent);
  nuxtApp.vueApp.use(wwtPinia);
  //const wwt = new WWTInstance();
  return {
    provide: {
      engineStore,
      //wwt,
    }
  };
});


// export default defineNuxtPlugin(nuxtApp => {});
