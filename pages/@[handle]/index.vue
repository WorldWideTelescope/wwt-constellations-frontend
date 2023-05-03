<template>
  <div id="handle-page-root">
    <ClientOnly>
      <MainOverlay />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, nextTick } from "vue";
import { RouteLocationNormalized } from "vue-router";

import { getHandle, handlePermissions } from "~/utils/apis";
import { useConstellationsStore } from "~/stores/constellations";

definePageMeta({
  // Does this page actually exist? I'm not sure if I'm doing this right, but it
  // seems to work.
  validate: async (route: RouteLocationNormalized) => {
    // As far as I can tell, this function can't use bindings from the outer
    // module, so we have to re-import $backendCall.
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;

    const { data } = await useAsyncData(`handle-${handle}`, async () => {
      return getHandle($backendCall, handle);
    });

    return !!data.value;
  }
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall, $backendAuthCall } = useNuxtApp();

const constellationsStore = useConstellationsStore();
const { loggedIn, timelineSource } = storeToRefs(constellationsStore);

const route = useRoute();
const handle = route.params.handle as string;

const { data } = await useAsyncData(`handle-${handle}`, async () => {
  return getHandle($backendCall, handle);
});

const display_name = computed(() => {
  return data.value === null ? "Loading ..." : data.value.display_name;
});

const can_dashboard = ref(false);

watchEffect(async () => {
  if (!loggedIn.value) {
    can_dashboard.value = false;
  } else {
    const fetcher = await $backendAuthCall();
    const result = await handlePermissions(fetcher, handle);
    can_dashboard.value = result && result.view_dashboard || false;
  }
});

onMounted(() => {
  timelineSource.value = handle;
  nextTick(() => {
    constellationsStore.ensureTimelineCoverage(8);
  });
});
</script>

<style scoped lang="less">
#handle-page-root {
  color: #FFF;
}

#home-link {
  pointer-events: auto;
  position: fixed;
  background: black;
  border: 1px solid white;
  text-decoration: none;
  margin: auto;
  border-radius: 2px;
  top: 10px;
  left: 240px;
  font-size: 20pt;
  padding: 3px;
}

.info {
  position: absolute;
  overflow: scroll;
  z-index: 10;
  max-width: 12%;
  min-width: 200px;
  top: 50px;
  left: 240px;
}
</style>
