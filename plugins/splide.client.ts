import { Splide, SplideSlide } from "@splidejs/vue-splide";
import "../node_modules/@splidejs/splide/dist/css/splide.min.css";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("Splide", Splide);
  nuxtApp.vueApp.component("SplideSlide", SplideSlide);
});
