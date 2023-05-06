<template>
  <n-grid cols="1" y-gap="5" class="scene-panel">
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

    <n-grid-item class="description">
      {{ scene.text }}
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

    <n-grid-item>
      <n-space justify="space-between">
        <n-space justify="start">
          <n-button class="action-button" :bordered="false">
            <n-icon size="30">
              <StarBorderRound />
            </n-icon>
            <n-text class="action-button-label">
              {{ scene.likes }}
            </n-text>
          </n-button>
          <n-button class="action-button" :bordered="false">
            <n-icon size="30">
              <RemoveRedEyeOutlined />
            </n-icon>
            <n-text class="action-button-label">
              -1
            </n-text>
          </n-button>
        </n-space>

        <n-space justify="end">
          <ShareButton v-if="scene" title="WorldWide Telescope" :url="getExternalItemURL(scene)"
            :description="scene.text" />

          <n-button class="action-button" :bordered="false" v-if="can_edit">
            <n-icon size="30">
              <ModeEditOutlined />
            </n-icon>
          </n-button>
        </n-space>
      </n-space>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import {
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NIcon,
  NText,
} from "~/utils/fixnaive.mjs";

import { ModeEditOutlined, StarBorderRound, RemoveRedEyeOutlined } from "@vicons/material";

import { useConstellationsStore } from "~/stores/constellations";
import { GetSceneResponseT } from "~/utils/apis";
import ShareButton from "./ShareButton.vue";

const { $backendAuthCall } = useNuxtApp();

const nuxtConfig = useRuntimeConfig();

const constellationsStore = useConstellationsStore();
const {
  loggedIn,
} = storeToRefs(constellationsStore);

const props = defineProps<{
  scene: GetSceneResponseT,
  potentiallyEditable: boolean,
}>();

const { scene } = toRefs(props);

function formatDate(date: string): string {
  const now = Date.now();
  const then = Date.parse(date);
  const daysBetween = Math.floor((now - then) / 86400000);

  return daysBetween > 10
    ? new Date(then).toLocaleDateString()
    : daysBetween + " days ago"
}

function getExternalItemURL(item: GetSceneResponseT): string {
  if (scene.value) {
    return `${nuxtConfig.public.hostUrl}/@${encodeURIComponent(scene.value.handle.handle)}/${scene.value.id}`;
  } else {
    return "";
  }
}

// Editability

const can_edit = ref(false);

watchEffect(async () => {
  if (!loggedIn.value || !props.potentiallyEditable) {
    can_edit.value = false;
  } else {
    const fetcher = await $backendAuthCall();
    const result = await scenePermissions(fetcher, scene.value.id);
    can_edit.value = result && result.edit || false;
  }
});

</script>

<style scoped lang="less">
.scene-panel {
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

.description {
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