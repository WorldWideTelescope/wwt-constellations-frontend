<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-notification-provider>
      <div id="wrapper">
        <slot />
      </div>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  darkTheme,
  NConfigProvider,
  NNotificationProvider,
} from "naive-ui";
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

<style lang="less">
#wrapper {
  max-width: 40rem;
  margin: 0 auto;
  color: #FFF;
}
</style>
