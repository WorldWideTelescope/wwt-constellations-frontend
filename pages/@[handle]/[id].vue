<template>
  <div id="scene-page-root">
    <NuxtLink to="/" id="home-link">Home</NuxtLink>
    <!-- <WTMLViewSSR :wtml-url="wtmlUrl" /> -->

    <div class="info">
      <h1>@{{ $route.params.handle }}'s scene</h1>
      <p>{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouteLocationNormalized } from "vue-router";

import { getScene } from "~/utils/apis";

definePageMeta({
  // Does this page actually exist?
  validate: async (route: RouteLocationNormalized) => {
    // As far as I can tell, this closure can't use bindings from the outer
    // module, so we have to re-import $backendCall.
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;
    const id = route.params.id as string;

    const { data } = await useAsyncData(`scene-${id}`, async () => {
      return getScene($backendCall, id);
    });

    if (!data.value) {
      return false;
    }

    // We could perhaps return a redirect if the handle does not match the
    // scene's owner? But it looks like we'd have to write some middleware for
    // that. For now just make it a 404.

    return data.value.handle.handle == handle;
  }
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall } = useNuxtApp();

const route = useRoute();
const id = route.params.id as string;

const { data } = await useAsyncData(`scene-${id}`, async () => {
  return getScene($backendCall, id);
});

const text = computed(() => {
  return data.value === null ? "Loading ..." : data.value.text;
});
</script>

<style scoped lang="less">
#scene-page-root {
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
