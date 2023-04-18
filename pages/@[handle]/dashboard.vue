<template>
  <div id="handle-dashboard-root">
    <h1>DASHBOARD for {{ display_name }}</h1>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouteLocationNormalized } from "vue-router";

import { getHandle } from "~/utils/apis";

definePageMeta({
  layout: 'admin',

  // FIXME: code duplication with index page
  validate: async (route: RouteLocationNormalized) => {
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;

    const { data } = await useAsyncData(`handle-${handle}`, async () => {
      return getHandle($backendCall, handle);
    });

    return !!data.value;
  },

  middleware: ["handle-admin"],
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall } = useNuxtApp();
const route = useRoute();
const handle = route.params.handle as string;

const { data } = await useAsyncData(`handle-${handle}`, async () => {
  return getHandle($backendCall, handle);
});

const display_name = computed(() => {
  return data.value === null ? "Loading ..." : data.value.display_name;
});

</script>

<style scoped lang="less"></style>
