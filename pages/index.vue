<template>
  <ClientOnly>
    <MainOverlay :scene-potentially-editable="false" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { nextTick } from "vue";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { timelineSource } = storeToRefs(constellationsStore);

onMounted(() => {
  timelineSource.value = "";

  nextTick(async () => {
    await constellationsStore.ensureTimelineCoverage(8);
  });
});
</script>
