<template>
  <div id="admin-root">
    <slot />
  </div>
</template>

<style lang="less">
#admin-root {
  color: #FFF;
  pointer-events: all;
}
</style>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { showWWT } = storeToRefs(constellationsStore);

onMounted(() => {
  showWWT.value = false;
});

onUnmounted(() => {
  showWWT.value = true;
});
</script>