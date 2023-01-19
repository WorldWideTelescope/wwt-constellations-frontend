<template>
  <div class="vc-root"></div>
</template>

<script lang="ts">
import { Place } from '@wwtelescope/engine';

export default defineNuxtComponent({
  methods: {
    async setupForWtml(url: string): Promise<void> {
      console.log("In setupForWtml");
      if (url == null) {
        return;
      }
      const store = this.$engineStore(this.$pinia);
      const folder = await store.loadImageCollection({
        url: url,
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
        store.addImageSetLayer({
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

<style>
#vc-root {
  display: none;
}
</style>
