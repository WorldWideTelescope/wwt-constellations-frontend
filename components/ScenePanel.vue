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

    <n-grid-item class="outgoing" v-if="outgoingUrl">
      <i>Learn more at <a :href="outgoingUrl" target="_blank">{{ outgoingLinkText }}</a></i> 🚀
    </n-grid-item>

    <n-grid-item v-show="permissionsText">
      <n-text depth="3" class="permissions">{{ permissionsText }}</n-text>
    </n-grid-item>

    <n-grid-item>
      <n-space justify="space-between">
        <n-space justify="start">
          <n-button class="action-button" :on-click="() => toggleLike()" :bordered="false" aria-label="Like button">
            <n-icon size="30">
              <StarRound v-if="scene.liked" />
              <StarBorderRound v-else />
            </n-icon>
            <n-text class="action-button-label">
              {{ scene.likes }}
            </n-text>
          </n-button>
          <n-button class="action-button" :bordered="false" aria-label="Views">
            <n-icon size="30">
              <RemoveRedEyeOutlined />
            </n-icon>
            <n-text class="action-button-label">
              {{ scene.impressions }}
            </n-text>
          </n-button>
        </n-space>

        <n-space justify="end">
          <ShareButton title="WorldWide Telescope" :url="externalItemUrl" :description="scene.text"
            :handle="scene.handle.handle" />

          <NuxtLink :to="`/@${encodeURIComponent(scene.handle.handle)}/${scene.id}/edit`">
            <n-button class="action-button" :bordered="false" v-if="can_edit" aria-label="Edit scene button">
              <n-icon size="30">
                <ModeEditOutlined />
              </n-icon>
            </n-button>
          </NuxtLink>
        </n-space>
      </n-space>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import * as escapeHtml from "escape-html";
import { storeToRefs } from "pinia";
import { format as formatTimeAgo } from 'timeago.js';

import {
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NIcon,
  NText,
} from "~/utils/fixnaive.mjs";

import {
  ModeEditOutlined,
  RemoveRedEyeOutlined,
  StarBorderRound,
  StarRound,
} from "@vicons/material";

import { useConstellationsStore } from "~/stores/constellations";
import { GetSceneResponseT, addLike } from "~/utils/apis";
import ShareButton from "./ShareButton.vue";

const { $backendAuthCall, $backendCall } = useNuxtApp();

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
  return formatTimeAgo(Date.parse(date));
}

const externalItemUrl = computed(() => {
  if (scene.value) {
    return `${nuxtConfig.public.hostUrl}/@${encodeURIComponent(scene.value.handle.handle)}/${scene.value.id}`;
  } else {
    return "";
  }
});

const outgoingUrl = computed(() => {
  // For some reason, I seem to need to wrap the scene's parameter in this
  // computed property in order to get proper updating when navigating a
  // timeline. The toggling of the visibility also seems to require a v-if, not
  // just a v-show.

  if (scene.value.outgoing_url) {
    return scene.value.outgoing_url;
  }

  return "";
});

const outgoingLinkText = computed(() => {
  if (!scene.value.outgoing_url) {
    return "";
  }

  const parsed = new URL(scene.value.outgoing_url);
  const host = parsed.hostname;

  if (host.startsWith("www.")) {
    return host.substring(4);
  }

  return host;
});

async function toggleLike() {
  if (scene.value.liked) {
    const success = await removeLike($backendCall, scene.value.id);
    if (success) {
      scene.value.liked = false;
      scene.value.likes--;
    }
  } else {
    const success = await addLike($backendCall, scene.value.id);
    if (success) {
      scene.value.liked = true;
      scene.value.likes++;
    }
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

// Image permissions

const permissionsText = computed(() => {
  const layers = scene.value.content.image_layers;
  if (!layers) {
    return "";
  }

  // This will need improvement when we actually support multi-image scenes.

  const items = [];

  for (const layer of layers) {
    const c = layer.image.permissions.credits;
    if (c) {
      items.push(`Image credits: ${c}.`);
    }

    // Credits are delivered as restricted HTML, and so this value gets
    // exposed as `v-html`. But copyright is plain text, so we need
    // to escape it

    const o = layer.image.permissions.copyright;
    if (o) {
      items.push(`${escapeHtml(o)}.`);
    }
  }

  if (items.length == 0)
    return "";

  return items.join(" ");
});
</script>

<style scoped lang="less">
.scene-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 3px;
  box-sizing: border-box;
  padding: 4px;
}

.mobile-full-page>.scene-panel {
  font-size: 70%;
  line-height: 1.15;
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

.outgoing {
  width: 100%;
  text-align: right;
  box-sizing: border-box;
  padding: 0.2rem;

  a {
    text-decoration: none;
    color: #7fe7c4;

    &:hover {
      color: #5acea7;
      text-decoration: underline;
    }

    &:visited {
      color: #7fe7c4;
    }
  }
}

.permissions {
  font-size: 80%;
  overflow-wrap: break-word;
}
</style>
