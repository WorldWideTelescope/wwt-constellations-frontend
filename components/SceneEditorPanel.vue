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
      <n-input v-model:value="text" type="textarea" class="cxinput" placeholder="Scene text ..."
        @change="onUpdateText"></n-input>
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
      <n-input v-model:value="outgoing_url" type="text" class="cxinput" placeholder="https://..."
        @change="onUpdateOutgoingUrl"></n-input>
      <n-space justify="end">
        <n-button :loading="outgoing_url_loading" @click="onUpdateOutgoingUrl">
          Update
        </n-button>
      </n-space>
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Aspect ratio:
      </n-text>
      <n-slider v-model:value="log_roi_aspect" :min="-100" :max="100" :tooltip="false" />
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Size adjust:
      </n-text>
      <n-slider v-model:value="log_roi_adjust" :min="-100" :max="100" :tooltip="false" />
    </n-grid-item>

    <n-grid-item>
      <n-space justify="space-between">
        <n-button class="action-button" @click="onRecenter" style="padding-right: 5px">
          <n-icon size="30">
            <FilterCenterFocusRound />
          </n-icon>
          Recenter
        </n-button>
        <n-button :loading="place_loading" @click="onUpdatePlace">
          Update
        </n-button>
      </n-space>
    </n-grid-item>

    <n-grid-item>
      <n-text depth="3" style="font-size: smaller;">
        Background:
      </n-text>
      <n-select v-model:value="background_selection" :options="background_options" @update:value="onSelectNewBackground"
        class="cxinput" />
      <n-space justify="end">
        <n-button :loading="background_loading" @click="onUpdateBackground">
          Update
        </n-button>
      </n-space>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useResizeObserver } from "@vueuse/core";
import { FilterCenterFocusRound } from "@vicons/material";

import {
  NButton,
  NIcon,
  NInput,
  NGrid,
  NGridItem,
  NSelect,
  NSlider,
  NSpace,
  NText,
} from "~/utils/fixnaive.mjs";

import { GetSceneResponseT, builtinBackgrounds, updateScene } from "~/utils/apis";
import { useConstellationsStore } from "~/stores/constellations";

const { $backendCall, $backendAuthCall } = useNuxtApp();

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
//
// This editor needs to have its own reactive variable for the "text", since we
// don't want to update the scene's text (even our in-app representation of it)
// until any changes are committed. However, we should reset the text if/when we
// change from editing one scene to editing a different scene. As far as I can
// tell, the reliable way to do this is with a watchEffect as below. In
// principle we should also have a framework that will prevent navigation away
// from the scene editor if "text" has been changed but not committed, but for
// now we're not implementing that.

const text = ref("");
const text_loading = ref(false);

watchEffect(() => {
  text.value = scene.value.text;
  text_loading.value = false;
});

async function onUpdateText() {
  const fetcher = await $backendAuthCall();
  text_loading.value = true;
  await updateScene(fetcher, scene.value.id, { text: text.value });
  notification.success({ content: "Text updated.", duration: 3000 });
  text_loading.value = false;
}

// Editing - outgoing URL
//
// This and all other pieces of this editor that depend on the `scene` prop
// follow the same pattern as above.

const outgoing_url = ref("");
const outgoing_url_loading = ref(false);

watchEffect(() => {
  outgoing_url.value = scene.value.outgoing_url ?? "";
  outgoing_url_loading.value = false;
});

async function onUpdateOutgoingUrl() {
  const fetcher = await $backendAuthCall();
  outgoing_url_loading.value = true;
  await updateScene(fetcher, scene.value.id, { outgoing_url: outgoing_url.value });
  notification.success({ content: "URL updated.", duration: 3000 });
  outgoing_url_loading.value = false;
}

// Editing - managing the region-of-interest visualization

const engineStore = getEngineStore();

const {
  decRad: wwt_dec_rad,
  raRad: wwt_ra_rad,
  rollRad: wwt_roll_rad,
  zoomDeg: wwt_zoom_deg,
} = storeToRefs(engineStore);

const viewport_dimensions = ref([1, 1]);

useResizeObserver(document.body, (entries) => {
  const entry = entries[0];
  viewport_dimensions.value[0] = entry.contentRect.width;
  viewport_dimensions.value[1] = entry.contentRect.height;
});

// The ROI aspect setting is a logarithmic value going from -100 (=> 10:1
// aspect ratio) to +100 (1:10 aspect ratio).

const log_roi_aspect = ref(0.0);

function roi_aspect_ratio(): number {
  return Math.pow(10, -0.01 * log_roi_aspect.value);
}

// The ROI size is handled as an "original" value that is then adjusted with a
// logarithmic setting analogous to the aspect-ratio setting.

const orig_roi_height_deg = ref(1.0);
const log_roi_adjust = ref(0.0);

function effective_roi_height_deg(): number {
  return orig_roi_height_deg.value * Math.pow(10, 0.01 * log_roi_adjust.value);
}

// Reset the ROI variables when the current `scene` changes:
watchEffect(() => {
  log_roi_aspect.value = -100 * Math.log10(scene.value.place.roi_aspect_ratio);
  orig_roi_height_deg.value = scene.value.place.roi_height_deg;
  log_roi_adjust.value = 0.0;
});

// Update the the ROI visualization when the internal variables change:
watchEffect(() => {
  // The zoom setting is the viewport height in degrees times six,
  // so the ratio of 1% of the viewport height to degrees is:
  const cur_vert_pct_per_deg = 600 / wwt_zoom_deg.value;

  // The height of the ROI indicator in percentage is therefore:
  const roi_height_pct = cur_vert_pct_per_deg * effective_roi_height_deg();

  // Update the displayed height to be that, with clamping:
  roiEditHeightPercentage.value = Math.min(roi_height_pct, 100);

  // The width of the ROI in degrees:
  const roi_width_deg = effective_roi_height_deg() * roi_aspect_ratio();

  // The horizontal degrees-to-percent conversion factor varies with
  // the viewport aspect ratio, since the WWT display always has pixels
  // that are square in angular dimensions.
  const cur_horz_pct_per_deg = cur_vert_pct_per_deg * viewport_dimensions.value[1] / viewport_dimensions.value[0];

  // The displayed width comes derives from those, also with clamping
  roiEditWidthPercentage.value = Math.min(roi_width_deg * cur_horz_pct_per_deg, 100);
});


async function onRecenter() {
  // Note that we intentionally do not use wwtSetupForPlace here, since in the
  // editor we match the place center with the WWT viewport center.
  await engineStore.gotoRADecZoom({
    raRad: scene.value.place.ra_rad,
    decRad: scene.value.place.dec_rad,
    zoomDeg: wwt_zoom_deg.value,
    rollRad: wwt_roll_rad.value,
    instant: false,
  });
}

const place_loading = ref(false);

async function onUpdatePlace() {
  const place = {
    ra_rad: wwt_ra_rad.value,
    dec_rad: wwt_dec_rad.value,
    roll_rad: wwt_roll_rad.value,
    roi_height_deg: effective_roi_height_deg(),
    roi_aspect_ratio: roi_aspect_ratio(),
  };

  const fetcher = await $backendAuthCall();
  place_loading.value = true;
  await updateScene(fetcher, scene.value.id, { place });
  notification.success({ content: "Placement updated.", duration: 3000 });

  place_loading.value = false;
  scene.value.place = place;
}

// Background selection

const background_selection = ref("");
const background_options = ref<{ label: string; value: string; }[]>([]);
const background_loading = ref(false);

const { data: background_data } = await useAsyncData("backgrounds", async () => {
  // One day the results here might depend on the user login status
  return builtinBackgrounds($backendCall);
});

watchEffect(() => {
  const bgdata = background_data.value;

  if (bgdata) {
    background_options.value = bgdata.map((item) => {
      return {
        label: item.note,
        value: item._id,
      };
    });
    background_selection.value = bgdata[0]._id;
  }
});

watchEffect(async () => {
  const current_background = scene.value.content.background?.id;

  if (current_background) {
    background_selection.value = current_background;
    background_loading.value = false;
    await onSelectNewBackground(current_background);
  }
});

async function onSelectNewBackground(new_id: string) {
  const image = await getImage($backendCall, new_id);

  if (image === null) {
    return;
  }

  let imgset = backgroundInfoToSet(image);
  imgset = engineStore.addImagesetToRepository(imgset);
  engineStore.setBackgroundImageByName(imgset.get_name());
}

async function onUpdateBackground() {
  const fetcher = await $backendAuthCall();
  background_loading.value = true;
  await updateScene(fetcher, scene.value.id, { content: { background_id: background_selection.value } });
  notification.success({ content: "Background updated.", duration: 3000 });
  background_loading.value = false;
}

</script>

<style scoped lang="less">
.scene-editor-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 3px;
  box-sizing: border-box;
  padding: 4px;
}

.cxinput {
  margin: 0.5rem 0;
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