<template>
  <div id="feed-root">
    <ClientOnly>
      <n-grid cols="1" y-gap="5" style="position: absolute; top: 0; padding: 14px; width: 440px;">
        <n-grid-item v-if="timelineSource !== null">
          <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
        </n-grid-item>

        <n-grid-item v-if="describedScene">
          <ScenePanel :scene="describedScene" />
        </n-grid-item>
      </n-grid>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  NGrid,
  NGridItem,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { nextTick } from "vue";

import { useConstellationsStore } from "~/stores/constellations";
import { SceneDisplayInfoT } from "~/utils/types";

defineProps<{
  mobile?: boolean,
}>();

const constellationsStore = useConstellationsStore();
const {
  describedScene,
  desiredScene,
  knownScenes,
  timeline,
  timelineIndex,
  timelineSource,
} = storeToRefs(constellationsStore);

const skymapScenes = computed<SceneDisplayInfoT[]>(() => {
  const i0 = Math.max(timelineIndex.value - 5, 0);
  const i1 = Math.min(timelineIndex.value + 6, timeline.value.length);
  return timeline.value.slice(i0, i1).map((id, relIndex) => {
    const scene = knownScenes.value.get(id)!;
    return { itemIndex: i0 + relIndex, place: scene.place, content: scene.content };
  });
});

onMounted(() => {
  if (timelineSource.value !== null) {
    nextTick(() => {
      constellationsStore.ensureTimelineCoverage(8);
    });
  }
});

function onItemSelected(index: number) {
  timelineIndex.value = index;
}

watchEffect(async () => {
  if (timelineIndex.value >= 0) {
    const id = timeline.value[timelineIndex.value];
    describedScene.value = knownScenes.value.get(id)!;

    if (describedScene.value) {
      desiredScene.value = {
        place: describedScene.value.place,
        content: describedScene.value.content,
      };
    }

    await constellationsStore.ensureTimelineCoverage(8);
  }
});
</script>

<style scoped lang="less">
#feed-root {
  pointer-events: all;
}

.action-button {
  padding: 0;
}

.action-button-label {
  margin-left: 5px;
}

.text-no-decoration {
  text-decoration: none;
}

.text-strong {
  font-weight: bold;
  font-size: medium;
}
</style>