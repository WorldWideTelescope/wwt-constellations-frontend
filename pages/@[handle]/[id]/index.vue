<template>
  <ClientOnly>
    <MainOverlay />
  </ClientOnly>

  <!--
  <div id="scene-page-root">
    <div class="info">
      <h1>@{{ $route.params.handle }}'s scene</h1>
      <p>{{ text }}</p>
      <p v-if="can_edit">[Editable!]</p>
    </div>
  </div>
  -->
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { RouteLocationNormalized } from "vue-router";

import { useConstellationsStore } from "~/stores/constellations";
import { getScene, scenePermissions } from "~/utils/apis";

definePageMeta({
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

const { $backendCall, $backendAuthCall } = useNuxtApp();

const nuxtConfig = useRuntimeConfig();

const constellationsStore = useConstellationsStore();
const {
  describedScene,
  desiredScene,
  loggedIn,
  timelineSource
} = storeToRefs(constellationsStore);
const store = getEngineStore();
const route = useRoute();

const id = route.params.id as string;

const { data: scene_data } = await useAsyncData(`scene-${id}`, async () => {
  return getScene($backendCall, id);
});

useServerSeoMeta({
  ogTitle: "WWT Constellations scene",
  ogUrl: `${nuxtConfig.public.hostUrl}${route.fullPath}`,
  ogVideo: scene_data.value.previews.video,
  ogVideoWidth: 800,
  ogVideoHeight: 600,
  ogImage: scene_data.value.previews.thumbnail,
  ogImageWidth: 800,
  ogImageHeight: 600,
  ogImageType: "image/png",
  ogImageAlt: scene_data.value.text,
  ogType: "website",

  twitterSite: "@wwtelescope",
  twitterCard: "summary_large_image",
  twitterImage: scene_data.value.previews.thumbnail,
  twitterImageAlt: scene_data.value.text,
  twitterPlayerStream: scene_data.value.previews.video,
  twitterPlayerWidth: 800,
  twitterPlayerHeight: 600,
});

// Managing the "desired scene" state

watch(scene_data, (newData) => {
  if (newData !== null) {
    describedScene.value = newData;
    desiredScene.value = {
      place: newData.place,
      content: newData.content,
    };
  }
});

onMounted(() => {
  timelineSource.value = null;

  // This is all to handle the case when `data` is non-null right off the bat,
  // given that we have to wait for the store to become ready to apply our
  // changes. Is there a cleaner way to unify this and the `watch()` codepath?
  nextTick(async () => {
    if (store === null) {
      return;
    }

    await store.waitForReady();

    if (scene_data.value !== null) {
      describedScene.value = scene_data.value;
      desiredScene.value = {
        place: scene_data.value.place,
        content: scene_data.value.content,
      };
    }
  });
});

// Data

const text = computed(() => {
  return scene_data.value === null ? "Loading ..." : scene_data.value.text;
});

// Editability

const can_edit = ref(false);

watchEffect(async () => {
  if (!loggedIn.value) {
    can_edit.value = false;
  } else {
    const fetcher = await $backendAuthCall();
    const result = await scenePermissions(fetcher, id);
    can_edit.value = result && result.edit || false;
  }
});
</script>

<style scoped lang="less">
#scene-page-root {
  color: #FFF;
}

.links {
  pointer-events: auto;
  position: fixed;
  background: black;
  border: 1px solid white;
  text-decoration: none;
  margin: auto;
  border-radius: 2px;
  top: 10px;
  left: 10px;
  font-size: 20pt;
  padding: 3px;
}

.info {
  pointer-events: auto;
  position: absolute;
  overflow: scroll;
  z-index: 10;
  max-width: 12%;
  min-width: 200px;
  top: 50px;
  left: 20px;
}
</style>
