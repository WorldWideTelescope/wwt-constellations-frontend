<template>
  <MainOverlay />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

import bannerUrl from "~/assets/images/wwt_banner.jpg";

const constellationsStore = useConstellationsStore();

const { nextSceneSource } = storeToRefs(constellationsStore);

useHead({
  title: "WorldWide Telescope",
  meta: [{
    name: "WorldWide Telescope",
    content: "Explore and share beautiful, real images from the world’s best telescopes."
  }]
})

// https://github.com/harlan-zw/zhead/blob/main/src/metaFlat.ts
// https://api.slack.com/reference/messaging/link-unfurling#classic_unfurl
// https://ogp.me/#implementations -> links to testing tools from various services

const nuxtConfig = useRuntimeConfig();
const route = useRoute();

const previewImageUrl = new URL(bannerUrl, nuxtConfig.public.hostUrl).href;
useServerSeoMeta({
  applicationName: "WorldWide Telescope",
  ogTitle: "WorldWide Telescope",
  ogDescription: "Explore and share beautiful, real images from the world’s best telescopes.",
  ogSiteName: "WorldWide Telescope",
  ogUrl: `${nuxtConfig.public.hostUrl}${route.fullPath}`,
  ogImage: previewImageUrl,
  ogImageSecureUrl: previewImageUrl,
  ogImageWidth: 1280,
  ogImageHeight: 350,
  ogImageType: "image/jpeg",
  ogImageAlt: "WorldWide Telescope banner",
  ogType: "website",
  twitterSite: "@wwtelescope",
  twitterCard: "summary_large_image",
  twitterImage: previewImageUrl,
});

onMounted(async () => {
  if (nextSceneSource.value.type == "single-scene") {
    await constellationsStore.useNearbyTimeline(nextSceneSource.value.id);
  } else if (nextSceneSource.value.type == "handle") {
    await constellationsStore.useGlobalTimeline();
  }
});
</script>
