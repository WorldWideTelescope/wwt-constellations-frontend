<template>
  <div>
    <h1>
      <NuxtLink :to="`/@${image?.handle.handle}/dashboard`">
        <n-button circle>
          <template #icon>
            <ArrowBackRound />
          </template>
        </n-button>
      </NuxtLink>
      Image Metadata Editor
    </h1>

    <n-grid cols="1" y-gap="5" class="scene-editor-panel">
      <n-grid-item class="note">
        <n-text depth="3" style="font-size: smaller;">
          Internal note/name (not shown to users):
        </n-text>
        <n-input v-model:value="note" type="text" placeholder="Image note ..." @change="onUpdateNote"></n-input>
        <n-space justify="end">
          <n-button :loading="note_loading" @click="onUpdateNote">
            Update
          </n-button>
        </n-space>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { RouteLocationNormalized } from "vue-router";

import { ArrowBackRound } from "@vicons/material";

import { getImage } from "~/utils/apis";

import {
  NButton,
  NGrid,
  NGridItem,
  NInput,
  NSpace,
  NText,
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

    const { data: image } = await useAsyncData(`image-${id}`, async () => {
      return getImage($backendCall, id);
    });

    if (!image.value) {
      return false;
    }

    // We could perhaps return a redirect if the handle does not match the
    // scene's owner? But it looks like we'd have to write some middleware for
    // that. For now just make it a 404.

    return image.value.handle.handle == handle;
  }
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendAuthCall, $backendCall } = useNuxtApp();

const notification = useNotification();

const route = useRoute();
const id = route.params.id as string;

const { data: image } = await useAsyncData(`image-${id}`, async () => {
  return getImage($backendCall, id);
});

// Editing - image "note"

const note = ref("");
const note_loading = ref(false);

watchEffect(() => {
  note.value = image.value?.note ?? "";
  note_loading.value = false;
});

async function onUpdateNote() {
  const fetcher = await $backendAuthCall();
  note_loading.value = true;
  await updateImage(fetcher, id, { note: note.value });
  notification.success({ content: "Note updated.", duration: 3000 });
  note_loading.value = false;
}
</script>

<style scoped lang="less">
.note {
  color: #ffffff;
}
</style>