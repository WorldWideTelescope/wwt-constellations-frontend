import { createPinia, setActivePinia } from "pinia";

export default defineNuxtPlugin(nuxtApp => {
  //setActivePinia(wwtPinia);
  nuxtApp.vueApp.use(createPinia());
});
