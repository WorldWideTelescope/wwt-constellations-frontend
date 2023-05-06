<template>
  <n-grid cols="1" y-gap="5" class="scene-editor-panel">
    <n-grid-item>
      <n-space justify="space-between">
        <NuxtLink class="metadata" :to="`/@${encodeURIComponent(scene.handle.handle)}`">
          <n-text>@{{ scene.handle.handle }}</n-text>
        </NuxtLink>
        <NuxtLink class="metadata" :to="`/@${encodeURIComponent(scene.handle.handle)}/${scene.id}`">
          <n-text>{{ formatDate(scene.creation_date) }}</n-text>
        </NuxtLink>
      </n-space>
    </n-grid-item>

    <n-grid-item class="text">
      <n-input v-model:value="text" type="textarea" placeholder="Scene text ..." @change="onUpdateText"></n-input>
      <n-space justify="end">
        <n-button :loading="text_loading" @click="onUpdateText">
          Update
        </n-button>
      </n-space>
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Outgoing URL:
      </n-text>
      <n-input v-model:value="outgoing_url" type="text" placeholder="https://..." @change="onUpdateOutgoingUrl"></n-input>
      <n-space justify="end">
        <n-button :loading="outgoing_url_loading" @click="onUpdateOutgoingUrl">
          Update
        </n-button>
      </n-space>
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Credits: TBA
      </n-text>
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Copyright: TBA
      </n-text>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import {
  NButton,
  NGrid,
  NGridItem,
  NSpace,
  NInput,
  NText,
} from "~/utils/fixnaive.mjs";

import { GetSceneResponseT, updateScene } from "~/utils/apis";

const { $backendAuthCall } = useNuxtApp();

const props = defineProps<{
  scene: GetSceneResponseT,
}>();

const { scene } = toRefs(props);

const notification = useNotification();

function formatDate(date: string): string {
  const now = Date.now();
  const then = Date.parse(date);
  const daysBetween = Math.floor((now - then) / 86400000);

  return daysBetween > 10
    ? new Date(then).toLocaleDateString()
    : daysBetween + " days ago"
}

// Editing - scene text

const text = ref(props.scene.text);
const text_loading = ref(false);

async function onUpdateText() {
  const fetcher = await $backendAuthCall();
  text_loading.value = true;
  await updateScene(fetcher, scene.value.id, { text: text.value });
  notification.success({ content: "Text updated.", duration: 3000 });
  text_loading.value = false;
}

// Editing - outgoing URL

const outgoing_url = ref(props.scene.outgoing_url);
const outgoing_url_loading = ref(false);

async function onUpdateOutgoingUrl() {
  const fetcher = await $backendAuthCall();
  outgoing_url_loading.value = true;
  await updateScene(fetcher, scene.value.id, { outgoing_url: outgoing_url.value });
  notification.success({ content: "URL updated.", duration: 3000 });
  outgoing_url_loading.value = false;
}
</script>

<style scoped lang="less">
.scene-editor-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 3px;
  box-sizing: border-box;
  padding: 4px;
}

.metadata {
  text-decoration: none;
  color: #999;
  font-size: 90%;

  :hover {
    text-decoration: underline;
  }
}

.text {
  color: #ffffff;
  font-size: 120%;
}

.action-button {
  padding: 0;
}

.action-button-label {
  margin-left: 5px;
}
</style>