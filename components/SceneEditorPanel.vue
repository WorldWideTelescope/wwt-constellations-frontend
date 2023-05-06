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
import { storeToRefs } from "pinia";
import { useResizeObserver } from "@vueuse/core";

import {
  NButton,
  NGrid,
  NGridItem,
  NSpace,
  NInput,
  NText,
} from "~/utils/fixnaive.mjs";

import { GetSceneResponseT, updateScene } from "~/utils/apis";
import { useConstellationsStore } from "~/stores/constellations";

const { $backendAuthCall } = useNuxtApp();

const props = defineProps<{
  scene: GetSceneResponseT,
}>();

const { scene } = toRefs(props);

const {
  roiEditHeightPercentage,
  roiEditWidthPercentage,
} = storeToRefs(useConstellationsStore());

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

// Editing - managing the region-of-interest visualization

const roi_height_deg = ref(props.scene.place.roi_height_deg);
const roi_aspect_ratio = ref(props.scene.place.roi_aspect_ratio);
const { zoomDeg: wwt_zoom_deg } = storeToRefs(getEngineStore());
const viewport_dimensions = ref([1, 1]);

watchEffect(() => {
  // The zoom setting is the viewport height in degrees times six,
  // so the ratio of 1% of the viewport height to degrees is:
  const cur_vert_pct_per_deg = 600 / wwt_zoom_deg.value;

  // The height of the ROI indicator in percentage is therefore:
  const roi_height_pct = cur_vert_pct_per_deg * roi_height_deg.value;

  // Update the displayed height to be that, with clamping:
  roiEditHeightPercentage.value = Math.min(roi_height_pct, 100);

  // The width of the ROI in degrees:
  const roi_width_deg = roi_height_deg.value * roi_aspect_ratio.value;

  // The horizontal degrees-to-percent conversion factor varies with
  // the viewport aspect ratio, since the WWT display always has pixels
  // that are square in angular dimensions.
  const cur_horz_pct_per_deg = cur_vert_pct_per_deg * viewport_dimensions.value[1] / viewport_dimensions.value[0];

  // The displayed width comes derives from those, also with clamping
  roiEditWidthPercentage.value = Math.min(roi_width_deg * cur_horz_pct_per_deg, 100);
});

useResizeObserver(document.body, (entries) => {
  const entry = entries[0];
  viewport_dimensions.value[0] = entry.contentRect.width;
  viewport_dimensions.value[1] = entry.contentRect.height;
});
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