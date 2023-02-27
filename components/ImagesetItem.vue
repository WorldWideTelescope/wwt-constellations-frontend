<template>
  <div
    class="root"
  >
    <div class="main">
      <img
        :src="imageset.get_thumbnailUrl()"
        :alt="imageset.get_name()"
        @click="(e) => expanded = !expanded"
      />
    </div>
    <div
      v-if="expanded"
      class="controls"
    >
      <div>
        <span>Opacity:</span>
        <vue-slider
          class="scrubber"
          v-model="opacity"
          contained
          hide-label
          use-keyboard
          :min="0"
          :max="1"
          :interval="0.01"
        />
      </div>
      <div v-if="isFits">
        <span class="prompt">Colormap:</span>
          <select v-model="colorMapperName">
            <option
              v-for="x in FITS_COLORMAPS"
              v-bind:value="x.wwt"
              v-bind:key="x.desc"
            >
              {{ x.desc }}
            </option>
          </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ImageSetLayer } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";

import { FITS_COLORMAPS } from "~/utils/constants";

const { $engineStore } = useNuxtApp();
const store = $engineStore();

const props = defineProps<{ layer: ImageSetLayer }>();
const { layer } = toRefs(props);
const imageset = ref(layer.value.get_imageSet());
const expanded = ref(false);
const isFits = ref(layer.value.getFitsImage() !== null);

const opacity = computed({
  get() {
    return layer.value.get_opacity();
  },
  set(o: number) {
    applyImageSetLayerSetting(layer.value, ["opacity", o]);
  }
});

const colorMapperName = computed({
  get() {
    return layer.value.get_colorMapperName()
  },
  set(name: string) {
    applyImageSetLayerSetting(layer.value, ["colorMapperName", name]);
  }
});

</script>

<style scoped lang="less">
.root {
  display: flex;
  flex-direction: column;
  align-content: center;
  gap: 3px;
}

.main {
  height: fit-content;
}

img {
  border-radius: 2px;
  pointer-events: auto;
  width: 100%;
}

.controls {
  display: flex;
  flex-direction: column;
}

.scrubber {
  flex: 1;
  cursor: pointer;
}
</style>
