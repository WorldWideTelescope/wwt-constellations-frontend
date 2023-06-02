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
        <n-text depth="3">
          Internal note/name (not shown to users):
        </n-text>
        <n-input v-model:value="note" type="text" placeholder="Image note ..." class="cxinput"
          @change="onUpdateNote"></n-input>
        <n-space justify="end">
          <n-button :loading="note_loading" @click="onUpdateNote">
            Update
          </n-button>
        </n-space>
      </n-grid-item>

      <n-grid-item class="note">
        <n-text depth="3">
          <strong>Credits</strong>. Freeform text acknowledging the people
          and/or institutions that created the image. This field is in HTML, but
          only basic tags are allowed. Make sure to escape &amp;, &lt;, and &gt;
          if needed. May be left empty, but generally shouldn’t be. Do not
          include “Credit:” here.
        </n-text>
        <n-input v-model:value="credits" type="text" placeholder="(No credits)" class="cxinput"
          @change="onUpdateCredits"></n-input>
        <n-space justify="end">
          <n-button :loading="note_loading" @click="onUpdateCredits">
            Update
          </n-button>
        </n-space>
      </n-grid-item>

      <n-grid-item class="note">
        <n-text depth="3">
          <strong>Copyright</strong>. A copyright statement identifying the
          legal owner of the image, generally of the form “Copyright 2020
          Henrietta Swan Leavitt”. If an image is in the public domain, put
          “Public domain” — but, under global intellectual property law, nearly
          all images in Constellations will be copyrighted.
        </n-text>
        <n-input v-model:value="copyright" type="text" placeholder="Copyright {year}, {person}." class="cxinput"
          @change="onUpdateCopyright"></n-input>
        <n-space justify="end">
          <n-button :loading="note_loading" @click="onUpdateCopyright">
            Update
          </n-button>
        </n-space>
      </n-grid-item>

      <n-grid-item class="note">
        <n-text depth="3">
          <strong>SPDX License Expression</strong>. An <a href="https://spdx.org/licenses/" target="_blank">SPDX License
            Expression</a>
          indicating the terms under which people are allowed to reproduce the
          image. A common choice might be <code>CC-BY-4.0</code> for the
          <a href="https://spdx.org/licenses/CC-BY-4.0.html" target="_blank">Creative Commons Attribution 4.0
            International</a>
          license. Use <code>CC-PDDC</code> for public domain imagery. Use
          <code>LicenseRef-None</code> to indicate “All rights reserved”, i.e.
          that people should not even make personal copies of the image. There
          is, however, no effective way to enforce this desire when an image is
          shared digitally.
        </n-text>
        <n-input v-model:value="license" type="text" placeholder="CC-PDDC" class="cxinput"
          @change="onUpdateLicense"></n-input>
        <n-space justify="end">
          <n-button :loading="note_loading" @click="onUpdateLicense">
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

// Editing - image permissions

const credits = ref("");
const credits_loading = ref(false);

watchEffect(() => {
  credits.value = image.value?.permissions.credits ?? "";
  credits_loading.value = false;
});

const copyright = ref("");
const copyright_loading = ref(false);

watchEffect(() => {
  copyright.value = image.value?.permissions.copyright ?? "";
  copyright_loading.value = false;
});

const license = ref("");
const license_loading = ref(false);

watchEffect(() => {
  license.value = image.value?.permissions.license ?? "";
  license_loading.value = false;
});

async function updatePermissions(loading_indicator: Ref<boolean>, success_message: string) {
  const permissions = {
    credits: credits.value,
    copyright: copyright.value,
    license: license.value,
  };

  if (!loading_indicator.value) {
    const fetcher = await $backendAuthCall();
    loading_indicator.value = true;

    try {
      await updateImage(fetcher, id, { permissions });
      notification.success({ content: success_message, duration: 3000 });
    } catch (err: any) {
      notification.error({ content: `Error updating permissions: ${err}`, duration: 5000 });
    }

    loading_indicator.value = false;
  }
}

async function onUpdateCredits() {
  await updatePermissions(credits_loading, "Credits updated.");
}

async function onUpdateCopyright() {
  await updatePermissions(copyright_loading, "Copyright updated.");
}

async function onUpdateLicense() {
  await updatePermissions(license_loading, "License ID updated.");
}
</script>

<style scoped lang="less">
.note {
  color: #ffffff;
  margin-top: 3rem;
}

.cxinput {
  margin: 0.5rem 0;
}
</style>