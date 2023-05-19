<template>
  <MainOverlay />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { nextTick } from "vue";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { timelineSource } = storeToRefs(constellationsStore);

useHead({
  title: 'WorldWide Telescope',
  meta: [{
    name: 'WorldWide Telescope',
    content: 'Explore astronomical images visualized by the WorldWide Telescope engine'
  }]
})

onMounted(() => {
  timelineSource.value = "";

  nextTick(async () => {
    await constellationsStore.ensureTimelineCoverage(8);
  });
});
</script>
