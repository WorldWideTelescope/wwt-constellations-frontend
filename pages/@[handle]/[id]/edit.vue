<template>
  <div id="roibox" :style="roi_style"></div>
  <MainOverlay :show-scene-editor="true" />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { type RouteLocationNormalized } from "vue-router";

import { useConstellationsStore } from "~/stores/constellations";
import { getScene } from "~/utils/apis";

definePageMeta({
  middleware: ["scene-editor"],

  // Does this page actually exist?
  validate: async (route: RouteLocationNormalized) => {
    // As far as I can tell, this closure can't use bindings from the outer
    // module, so we have to re-import $backendCall.
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;
    const id = route.params.id as string;

    const { data } = await useAsyncData(`scene-${id}`, async () => {
      return getScene($backendCall, id);
    });

    if (!data.value) {
      return false;
    }

    // We could perhaps return a redirect if the handle does not match the
    // scene's owner? But it looks like we'd have to write some middleware for
    // that. For now just make it a 404.

    return data.value.handle.handle == handle;
  }
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall } = useNuxtApp();

const constellationsStore = useConstellationsStore();
const {
  roiEditHeightPercentage,
  roiEditWidthPercentage,
} = storeToRefs(constellationsStore);
const store = getEngineStore();
const route = useRoute();

const id = route.params.id as string;

const { data: scene_data } = await useAsyncData(`scene-${id}`, async () => {
  return getScene($backendCall, id);
});

// Managing the "desired scene" state.
//
// For this, the editor, we have an extra wrinkle where we need to futz with the
// "blockage" setup to auto-center the view the way we would like. In order for
// this futzing to "take", we need to force an update to `desiredScene`, even if
// it matches the current scene -- which will be the overwhelmingly common case,
// since the main way to edit a scene is from its scene-specific page.

watch(scene_data,
  async (newSceneData) => {
    if (newSceneData !== null) {
      constellationsStore.desiredScene = null;
      constellationsStore.viewportBottomBlockage = 0;
      constellationsStore.viewportLeftBlockage = 0;
      await constellationsStore.setupForSingleScene(newSceneData);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // This is all to handle the case when `scene_data` is non-null right off the bat,
  // given that we have to wait for the store to become ready to apply our
  // changes. Is there a cleaner way to unify this and the `watch()` codepath?
  nextTick(async () => {
    if (store === null) {
      return;
    }

    await store.waitForReady();

    if (scene_data.value !== null) {
      constellationsStore.desiredScene = null;
      constellationsStore.viewportBottomBlockage = 0;
      constellationsStore.viewportLeftBlockage = 0;
      await constellationsStore.setupForSingleScene(scene_data.value);
    }
  });
});

// Managing the region-of-interest overlay

const roi_style = computed(() => {
  return {
    width: `${roiEditWidthPercentage.value}vw`,
    left: `${50 - 0.5 * roiEditWidthPercentage.value}vw`,
    height: `${roiEditHeightPercentage.value}vh`,
    top: `${50 - 0.5 * roiEditHeightPercentage.value}vh`,
  }
})

</script>

<style>
#roibox {
  border: 4px #dddd00 solid;
  box-sizing: border-box;
  position: fixed;
  pointer-events: none;
  opacity: 0.8;
}
</style>
