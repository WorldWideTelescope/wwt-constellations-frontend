<template>
  <n-space justify="space-between" class="handle-panel">
    <n-space justify="start" class="displayname">
      {{ handleData.display_name }}
    </n-space>

    <n-space justify="end">
      <NuxtLink :to="`/@${encodeURIComponent(handleData.handle)}/dashboard`">
        <n-button class="action-button" v-if="can_dashboard">
          <n-icon size="30">
            <InsertChartRound />
          </n-icon>
          Dashboard
        </n-button>
      </NuxtLink>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import {
  NButton,
  NSpace,
  NIcon,
} from "~/utils/fixnaive.mjs";

import { InsertChartRound } from "@vicons/material";

import { useConstellationsStore } from "~/stores/constellations";
import { GetHandleResponseT } from "~/utils/apis";

const { $backendAuthCall } = useNuxtApp();

const constellationsStore = useConstellationsStore();
const {
  loggedIn,
} = storeToRefs(constellationsStore);

const props = defineProps<{
  handleData: GetHandleResponseT,
}>();

const { handleData } = toRefs(props);

// Whether we should show the dashboard link.

const can_dashboard = ref(false);

watchEffect(async () => {
  if (!loggedIn.value) {
    can_dashboard.value = false;
  } else {
    const fetcher = await $backendAuthCall();
    const result = await handlePermissions(fetcher, handleData.value.handle);
    can_dashboard.value = result && result.view_dashboard || false;
  }
});
</script>

<style scoped lang="less">
.handle-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 3px;
  box-sizing: border-box;
  padding: 4px;
}

.displayname {
  color: #ffffff;
  font-size: 120%;
  font-weight: 700;
}

.action-button {
  padding-left: 0px;
  padding-right: 5px;
}
</style>