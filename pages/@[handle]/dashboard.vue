<template>
  <div>
    <h1>
      <NuxtLink :to="`/@${handle}/`">
        <n-button circle>
          <template #icon>
            <ArrowBackRound />
          </template>
        </n-button>
      </NuxtLink>
      Dashboard for @{{ handle }}
    </h1>

    <n-row>
      <n-col :span="6">
        <n-statistic label="Images" :value="stats.images.count">
        </n-statistic>
      </n-col>
      <n-col :span="6">
        <n-statistic label="Scenes" :value="stats.scenes.count">
        </n-statistic>
      </n-col>
      <n-col :span="6">
        <n-statistic label="Impressions" :value="stats.scenes.impressions">
        </n-statistic>
      </n-col>
      <n-col :span="6">
        <n-statistic label="Likes" :value="stats.scenes.likes">
        </n-statistic>
      </n-col>
    </n-row>

    <n-divider></n-divider>

    <n-tabs default-value="my-scenes">
      <n-tab-pane name="my-scenes" tab="My Scenes">
        <n-data-table remote striped :columns="sceneColumns" :data="sceneData" :loading="sceneIsLoading"
          :row-key="sceneRowKey" :pagination="scenePagination" @update:page="onSceneTablePageChange">
        </n-data-table>
      </n-tab-pane>
      <n-tab-pane name="my-images" tab="My Images" display-directive="show:lazy">
        <n-data-table remote striped :columns="myImagesColumns" :data="myImagesData" :loading="myImagesIsLoading"
          :row-key="myImagesRowKey" :pagination="myImagesPagination" @update:page="onMyImagesTablePageChange">
        </n-data-table>
      </n-tab-pane>
    </n-tabs>

    <n-divider></n-divider>

    <n-form>
      <n-form-item label="Display name:">
        <n-input v-model:value="display_name" type="text" placeholder="Display name"
          @change="onUpdateDisplayName"></n-input>
      </n-form-item>
      <n-row :gutter="[0, 24]">
        <n-col :span="24">
          <div style="display: flex; justify-content: flex-end">
            <n-button :loading="display_name_loading" @click="onUpdateDisplayName">
              Update
            </n-button>
          </div>
        </n-col>
      </n-row>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouteLocationNormalized } from "vue-router";

import { ArrowBackRound } from "@vicons/material";

import {
  NButton,
  NButtonGroup,
  NCol,
  NDataTable,
  NDivider,
  NEllipsis,
  NForm,
  NFormItem,
  NInput,
  NRow,
  NStatistic,
  NTabs,
  NTabPane,
  useNotification
} from "~/utils/fixnaive.mjs";

import {
  getHandle,
  HandleImageInfoT,
  handleSceneInfo,
  HandleSceneInfoT,
  handleStats,
  HandleStatsResponseT,
  updateHandle,
} from "~/utils/apis";

import { PlaceDetailsT, SceneContentT, SceneCreationInfoT } from "~/utils/types";
import { useConstellationsStore } from "~/stores/constellations";

const {
  describedScene,
  desiredScene,
  knownScenes,
  timelineSource,
} = storeToRefs(useConstellationsStore());

definePageMeta({
  layout: 'naiveui',

  // FIXME: code duplication with index page
  validate: async (route: RouteLocationNormalized) => {
    const { $backendCall } = useNuxtApp();
    const handle = route.params.handle as string;

    const { data } = await useAsyncData(`handle-${handle}`, async () => {
      return getHandle($backendCall, handle);
    });

    return !!data.value;
  },

  middleware: ["handle-admin"],
});

// Now the main page implementation, which has to repeat some of the work done
// in the validate callback.

const { $backendCall, $backendAuthCall } = useNuxtApp();
const route = useRoute();
const notification = useNotification();
const handle = route.params.handle as string;

const { data: handle_data } = await useAsyncData(`handle-${handle}`, async () => {
  return getHandle($backendCall, handle);
});

// Display name

const display_name = ref("");

watchEffect(() => {
  if (handle_data.value !== null) {
    display_name.value = handle_data.value.display_name;
  }
});

const display_name_loading = ref(false);

async function onUpdateDisplayName() {
  const fetcher = await $backendAuthCall();
  display_name_loading.value = true;
  await updateHandle(fetcher, handle, { display_name: display_name.value });
  notification.success({ content: "Display name updated.", duration: 3000 });
  display_name_loading.value = false;
}

// Stats

const stats = ref<HandleStatsResponseT>({
  handle: "",
  images: { count: 0 },
  scenes: { count: 0, impressions: 0, likes: 0 },
});

onMounted(async () => {
  const fetcher = await $backendAuthCall();
  stats.value = await handleStats(fetcher, handle);
});

// Scene table

const TABLE_PAGE_SIZE = 10;

const sceneColumns = [
  {
    title: "Text",
    key: "_id",
    render: (row: HandleSceneInfoT) => {
      return h(resolveComponent("NuxtLink"), { to: `/@${handle}/${row._id}` }, () =>
        [h(NEllipsis, { style: "max-width: 30em" }, () => [row.text])]
      );
    }
  },
  {
    title: "Impressions",
    key: "impressions",
  },
  {
    title: "Likes",
    key: "likes",
  },
];

const sceneData = ref<HandleSceneInfoT[]>([]);

const sceneIsLoading = ref(true);

function sceneRowKey(row: HandleSceneInfoT) {
  return row._id;
}

const scenePagination = reactive({
  page: 1,
  pageCount: 1,
  itemCount: 0,
  pageSize: TABLE_PAGE_SIZE,
});

async function onSceneTablePageChange(page: number) {
  if (!sceneIsLoading.value) {
    sceneIsLoading.value = true;

    const fetcher = await $backendAuthCall();
    const result = await handleSceneInfo(fetcher, handle, page - 1, TABLE_PAGE_SIZE);

    sceneData.value = result.results;
    scenePagination.page = page;
    scenePagination.itemCount = result.total_count;
    sceneIsLoading.value = false;
  }
}

onMounted(() => {
  sceneIsLoading.value = false;
  onSceneTablePageChange(1);
});

// The "My Images" table

async function onEditImage(img: HandleImageInfoT) {
  await navigateTo(`/@${encodeURIComponent(handle)}/image/${img._id}/edit`);
}

async function onNewSceneFromImage(img: HandleImageInfoT) {
  const fullInfo = await getImage($backendCall, img._id);

  if (!fullInfo) {
    return;
  }

  // The place calculations are rough, but the intention is that they'll be
  // polished up in the scene editor anyway.

  let roi_height_deg = fullInfo.wwt.base_degrees_per_tile;

  if (fullInfo.wwt.projection == "SkyImage") {
    // For untiled SkyImages, the base_degrees_per_tile is degrees per pixel. We
    // don't know the image height, though! Let's just guess:
    roi_height_deg *= 1024;
  }

  roi_height_deg = Math.min(Math.max(roi_height_deg, 0.01), 60);

  const place: PlaceDetailsT = {
    ra_rad: fullInfo.wwt.center_x * D2R,
    dec_rad: fullInfo.wwt.center_y * D2R,
    roll_rad: 0,
    roi_height_deg,
    roi_aspect_ratio: 1,
  };

  const content: SceneContentT = {
    image_layers: [
      {
        image_id: img._id,
        opacity: 1.0,
      }
    ]
  };

  const scene: SceneCreationInfoT = {
    place,
    content,
    text: fullInfo.note,
  };

  const fetcher = await $backendAuthCall();

  try {
    const result = await createScene(fetcher, handle, scene);
    const info = await getScene(fetcher, result.id);

    if (info === null) {
      throw new Error(`creation succeeded (ID ${result.id}) but fetch did not`);
    }

    knownScenes.value.set(result.id, info);
    describedScene.value = info;
    await navigateTo(`/@${encodeURIComponent(handle)}/${result.id}/edit`);
  } catch (err) {
    notification.error({ content: `Error creating scene: ${err}`, duration: 5000 });
  }
}

const myImagesColumns = [
  {
    title: "Note",
    key: "note",
    render: (row: HandleImageInfoT) => {
      return h(NEllipsis, { style: "max-width: 30em" }, () => [row.note]);
    }
  },
  {
    title: "Actions",
    key: "_id",
    render: (row: HandleImageInfoT) => {
      return h(NButtonGroup, {}, () => [
        h(NButton, { onClick: () => onEditImage(row) }, () => ["Edit"]),
        h(NButton, { onClick: () => onNewSceneFromImage(row) }, () => ["New scene"]),
      ]);
    }
  },
];

const myImagesData = ref<HandleImageInfoT[]>([]);

const myImagesIsLoading = ref(true);

function myImagesRowKey(row: HandleImageInfoT) {
  return row._id;
}

const myImagesPagination = reactive({
  page: 1,
  pageCount: 1,
  itemCount: 0,
  pageSize: TABLE_PAGE_SIZE,
});

async function onMyImagesTablePageChange(page: number) {
  if (!myImagesIsLoading.value) {
    myImagesIsLoading.value = true;

    const fetcher = await $backendAuthCall();
    const result = await handleImageInfo(fetcher, handle, page - 1, TABLE_PAGE_SIZE);

    myImagesData.value = result.results;
    myImagesPagination.page = page;
    myImagesPagination.itemCount = result.total_count;
    myImagesIsLoading.value = false;
  }
}

onMounted(() => {
  myImagesIsLoading.value = false;
  onMyImagesTablePageChange(1);
});
</script>
