<template>
  <div>
    <h1>
      <NuxtLink :to="`/@${image_data?.handle.handle}/dashboard`">
        <n-button circle>
          <template #icon>
            <ArrowBackRound />
          </template>
        </n-button>
      </NuxtLink>
      Image Editor
    </h1>

    <p>Hello image!</p>
  </div>
</template>

<script setup lang="ts">
import { RouteLocationNormalized } from "vue-router";

import { ArrowBackRound } from "@vicons/material";

import { getImage } from "~/utils/apis";

import {
  NButton,
} from "~/utils/fixnaive.mjs";

definePageMeta({
  layout: "naiveui",

  middleware: ["image-editor"],

  // Does this page actually exist?
  validate: async (route: RouteLocationNormalized) => {
    // As far as I can tell, this closure can't use bindings from the outer
    // module, so we have to re-import $backendCall.
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;
    const id = route.params.id as string;

    const { data: image_data } = await useAsyncData(`image-${id}`, async () => {
      return getImage($backendCall, id);
    });

    if (!image_data.value) {
      return false;
    }

    // We could perhaps return a redirect if the handle does not match the
    // scene's owner? But it looks like we'd have to write some middleware for
    // that. For now just make it a 404.

    return image_data.value.handle.handle == handle;
  }
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall } = useNuxtApp();

const route = useRoute();
const id = route.params.id as string;

const { data: image_data } = await useAsyncData(`image-${id}`, async () => {
  return getImage($backendCall, id);
});
</script>
