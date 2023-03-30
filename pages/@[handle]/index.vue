<template>
  <div id="handle-page-root">
    <NuxtLink to="/" id="home-link">Home</NuxtLink>

    <div class="info">
      <h1>@{{ $route.params.handle }}</h1>
      <h2>{{ display_name }}</h2>

      <p>Handle page!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouteLocationNormalized } from "vue-router";

import { getHandle } from "~/utils/apis";

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

<style scoped lang="less">
#handle-page-root {
  pointer-events: none;
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
  left: 10px;
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
  left: 20px;
}
</style>
