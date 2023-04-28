<template>
  <div id="feed-root">
    <ClientOnly>
      <n-grid cols="1" y-gap="5" style="position: absolute; top: 0; padding: 24px; width: 440px;">
        <n-grid-item>
          <Skymap
            :scenes="items.slice(0, 3).map((item) => ({ itemId: item.id, place: item.place, content: item.content }))"
            @selected="itemSelected" />
        </n-grid-item>
        <n-grid-item>
          <n-space justify="space-between">
            <n-space justify="start">
              <n-button class="action-button" :bordered="false">
                <n-icon size="30">
                  <StarBorderRound />
                </n-icon>
                <n-text class="action-button-label">
                  {{ selectedItem?.likes }}
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
            <ShareButton v-if="selectedItem" title="WorldWide Telescope" :url="getExternalItemURL(selectedItem)"
              :description="selectedItem.text" />
          </n-space>
        </n-grid-item>
        <template v-if="selectedItem">
          <n-grid-item>
            <n-space justify="space-between">
              <NuxtLink class="text-no-decoration" :to="`/@${encodeURIComponent(selectedItem.handle.handle)}`">
                <n-text class="text-strong">@{{ selectedItem.handle.handle }}</n-text>
              </NuxtLink>
              <NuxtLink class="text-no-decoration"
                :to="`/@${encodeURIComponent(selectedItem.handle.handle)}/${selectedItem.id}`">
                <n-text class=" text-strong">
                  {{ formatDate(selectedItem.creation_date) }}
                </n-text>
              </NuxtLink>
            </n-space>
          </n-grid-item>
          <n-grid-item>
            {{ selectedItem.text }}
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
        </template>
      </n-grid>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NIcon,
  NText
} from "naive-ui";

import { StarBorderRound, StarRound, RocketLaunchOutlined, RemoveRedEyeOutlined } from '@vicons/material'
import { useConstellationsStore } from "~/stores/constellations";
import { getHomeTimeline, getHandleTimeline, GetSceneResponseT } from "../utils/apis";
import { $Fetch } from "ofetch";
import { nextTick } from "vue";
import ShareButton from './ShareButton.vue'
const nuxtConfig = useRuntimeConfig();

const props = defineProps<{
  mobile?: boolean,
  sourceType: string,
}>();

const { sourceType } = toRefs(props);
const page = ref<number>(0);
const pageSize = ref<number>(3);
const items = ref<GetSceneResponseT[]>([]);
const selectedItem = ref<GetSceneResponseT | undefined>(undefined);
const getTimeline = ref<Function>(getHomeTimeline);


onMounted(() => {
  if (sourceType.value.length != 0) {
    getTimeline.value = (fetcher: $Fetch, page: number) => getHandleTimeline(fetcher, sourceType.value, page);
  }

  nextTick(() => {
    loadInitialItems();
  });
});

async function loadItems(page: number): Promise<GetSceneResponseT[]> {
  // Note that we are currently using $backendCall, not $backendAuth call,
  // because our feed isn't personalized. To get a personalized feed we'll
  // need to change that.
  const { $backendCall } = useNuxtApp();
  const result = await getTimeline.value($backendCall, page);
  return result.results;
};


async function loadNextPage(): Promise<GetSceneResponseT[]> {
  const loadedItems = await loadItems(page.value);
  items.value.push(...loadedItems);
  page.value++;
  return loadedItems;
};

async function loadIfNeeded(index: number) {
  if (index >= (page.value - 2) * pageSize.value) {
    loadNextPage();
  }
};

async function itemSelected(id: String) {
  selectedItem.value = items.value.find(item => item.id == id);
  if (selectedItem.value) {
    useConstellationsStore().desiredScene = {
      place: selectedItem.value.place,
      content: selectedItem.value.content,
    };
  }

};

async function loadInitialItems() {
  loadNextPage().then(() => {
    itemSelected(items.value[0].id);
  });
}

function formatDate(date: string): string {
  const now = Date.now();
  const then = Date.parse(date);
  const daysBetween = Math.floor((now - then) / 86400000);

  return daysBetween > 10
    ? new Date(then).toLocaleDateString()
    : daysBetween + " days ago"
}

function getExternalItemURL(item: GetSceneResponseT): string {
  if (selectedItem.value) {
    return `${nuxtConfig.public.hostUrl}/@${encodeURIComponent(selectedItem.value.handle.handle)}/${selectedItem.value.id}`;
  } else {
    return "";
  }

}
</script>


<style scoped lang="less">
#feed-root {
  pointer-events: all;
}

.action-button {
  padding: 0;
}

.action-button-label {
  margin-left: 5px;
}

.text-no-decoration {
  text-decoration: none;
}

.text-strong {
  font-weight: bold;
  font-size: medium;
}
</style>