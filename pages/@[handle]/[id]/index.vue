<template>
  <MainOverlay :scene-potentially-editable="true" />
</template>

<script setup lang="ts">
import ellipsize from "ellipsize";
import { type RouteLocationNormalized } from "vue-router";

import { useConstellationsStore } from "~/stores/constellations";
import { getScene } from "~/utils/apis";

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

const { $backendCall } = useNuxtApp();

const nuxtConfig = useRuntimeConfig();

const constellationsStore = useConstellationsStore();
const store = getEngineStore();
const route = useRoute();

const id = route.params.id as string;
const handle = route.params.handle as string;

const { data: scene_data } = await useAsyncData(`scene-${id}`, async () => {
  return getScene($backendCall, id);
});

useHead({
  title: `@${handle}’s Scene - WorldWide Telescope`,
  meta: [{
    name: 'WorldWide Telescope',
    content: `Explore images by @${handle}, visualized in WorldWide Telescope`
  }]
})

// https://github.com/harlan-zw/zhead/blob/main/src/metaFlat.ts
// https://api.slack.com/reference/messaging/link-unfurling#classic_unfurl
// https://ogp.me/#implementations -> links to testing tools from various services

useServerSeoMeta({
  applicationName: "WorldWide Telescope",
  author: `@${handle}`,

  ogTitle: `@${handle}’s Scene`,
  ogDescription: ellipsize(scene_data.value!.text, 180),
  ogSiteName: "WorldWide Telescope",
  ogUrl: `${nuxtConfig.public.hostUrl}${route.fullPath}`,
  ogVideo: scene_data.value!.previews.video,
  ogVideoSecureUrl: scene_data.value!.previews.video,
  ogVideoWidth: 800,
  ogVideoHeight: 600,
  ogVideoType: "video/mp4",
  ogImage: scene_data.value!.previews.thumbnail,
  ogImageSecureUrl: scene_data.value!.previews.thumbnail,
  ogImageWidth: 800,
  ogImageHeight: 600,
  ogImageType: "image/png",
  ogImageAlt: scene_data.value!.text,
  ogType: "website",

  twitterSite: "@wwtelescope",
  twitterCard: "summary_large_image",
  twitterImage: scene_data.value!.previews.thumbnail,
  twitterImageAlt: scene_data.value!.text,
  twitterPlayerStream: scene_data.value!.previews.video,
  twitterPlayerWidth: 800,
  twitterPlayerHeight: 600,
});

// Managing the timeline / "desired scene" state

watch(scene_data,
  async (newSceneData) => {
    if (newSceneData !== null) {
      await constellationsStore.setupForSingleScene(newSceneData);
    }
  },
  { immediate: true }
);

onMounted(() => {
  // This is all to handle the case when `scene_data` is non-null right off the bat,
  // given that we have to wait for the store to become ready to apply our
  // changes. Is there a cleaner way to unify this and the `watch()` codepath?
  nextTick(async () => {
    if (store === null) {
      return;
    }

    await store.waitForReady();

    if (scene_data.value !== null) {
      await constellationsStore.setupForSingleScene(scene_data.value);
    }
  });
});
</script>
