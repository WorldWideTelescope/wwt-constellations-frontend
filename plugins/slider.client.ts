import VueSlider from "vue-slider-component";
import 'vue-slider-component/theme/default.css';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component("vue-slider", VueSlider);
});
