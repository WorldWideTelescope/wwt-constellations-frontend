<template>
  <div>
    <WorldWideTelescope
      wwt-namespace="wwt-constellations"
    ></WorldWideTelescope>
  </div>
</template>

<script lang="ts">
import { ImageSetLayer, Place } from '@wwtelescope/engine';

export default defineNuxtComponent({
  props: {
    wtmlUrl: {
      type: String,
      default: null,
      required: false
    }
  },
  watch: {
    wtmlUrl(_url: string) {
      this.setupForWtml();
    }
  },
  data() {
    return {
      layer: null as (ImageSetLayer | null),
      place: null as (Place | null)
    }
  },
  async mounted() {
    this.setupForWtml();
  },
  methods: {
    async setupForWtml(): Promise<void> {
      console.log("In setupForWtml");
      if (this.wtmlUrl == null) {
        return;
      }
      const store = this.$engineStore(this.$pinia);
      const folder = await store.loadImageCollection({
        url: this.wtmlUrl,
        loadChildFolders: false
      });

      // TODO: Add some sort of error handling
      // Maybe go to some "default" location
      // or some "lost in space" 404 page
      const children = folder.get_children() ?? [];
      if (children.length == 0) {
        return;
      }
      const item = children[0];
      if (!(item instanceof Place)) {
        return;
      }
      const imageset = item.get_studyImageset() ?? item.get_backgroundImageset();
      if (imageset !== null) {
        this.layer = await store.addImageSetLayer({
          url: imageset.get_url(),
          name: imageset.get_name(),
          mode: "autodetect",
          goto: true
        });
      } else {
        store.gotoRADecZoom({
          raRad: item.get_RA(),
          decRad: item.get_dec(),
          zoomDeg: item.get_zoomLevel(),
          instant: false
        });
      }
      console.log("End of setupForWtml");
    }
  }
});
</script>
