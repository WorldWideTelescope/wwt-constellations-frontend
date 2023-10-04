<template>
  <MainOverlay />
</template>

<script setup lang="ts">
import { nextTick } from "vue";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();

useHead({
  title: 'WorldWide Telescope',
  meta: [{
    name: 'WorldWide Telescope',
    content: 'Explore astronomical images visualized by the WorldWide Telescope engine'
  }]
})

onMounted(() => {
  constellationsStore.useGlobalTimeline();

  nextTick(async () => {
    await constellationsStore.ensureForwardCoverage(8);
  });
});
</script>
