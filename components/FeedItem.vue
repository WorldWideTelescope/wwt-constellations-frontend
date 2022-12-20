<template>
<div
  class="feed-item-root"
  @click="handleClick"
  >
    <img
      class="thumbnail"
      :src="item.place.get_thumbnailUrl()"
    />
    
    <h3 class="name"> {{ item.place.get_name() }}</h3>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ImageSetLayer, Place } from '@wwtelescope/engine';

const D2R = Math.PI / 180.0;

export default defineComponent({
  props: {
    item: {
      type: Object,
      default: null
    }
  },

  methods: {
    async handleClick() {
      const store = this.$engineStore(this.$pinia);
      const place = this.item.place as Place;
      const iset = place.get_studyImageset();
      console.log(place);
      console.log(iset);
      if (iset !== null) {
        const layer = await store.addImageSetLayer({
          url: this.item.url,
          name: place.get_name(),
          mode: "preloaded",
          goto: true
        });
        console.log(layer);
        console.log(place.get_name());
        console.log(this.item.url);
      }
      store.gotoRADecZoom({
        raRad: D2R * place.get_RA(),
        decRad: D2R * place.get_dec(),
        zoomDeg: place.get_zoomLevel(),
        instant: false
      });
    }
  },
})
</script>

<style scoped>
.feed-item-root {
  align-content: center;
  background: black;
  border: 1px solid white;
  border-radius: 5px;
}

img {
  margin: auto;
}

.name, p {
  color: white;
  font-size: 10pt;
  margin: auto;
}
</style>
