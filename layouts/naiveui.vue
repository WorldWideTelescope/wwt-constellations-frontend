<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-notification-provider>
      <div id="wrapper">
        <div id="inner">
          <slot />
        </div>
      </div>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  darkTheme,
} from "naive-ui";
import { storeToRefs } from "pinia";

import {
  NConfigProvider,
  NNotificationProvider,
} from "~/utils/fixnaive.mjs";

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
  pointer-events: auto;
  overflow-y: scroll;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 6px;
}

#inner {
  max-width: 40rem;
  margin: 0 auto;
  color: #FFF;
}
</style>
