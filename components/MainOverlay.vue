<template>
  <div id="feed-root">
    <ClientOnly>
      <n-grid cols="1" y-gap="5" style="position: absolute; top: 0; padding: 14px; width: 440px;">
        <n-grid-item>
          <Skymap
            :scenes="items.slice(0, 3).map((item) => ({ itemId: item.id, place: item.place, content: item.content }))"
            @selected="itemSelected" />
        </n-grid-item>

        <n-grid-item v-if="selectedItem">
          <ScenePanel :scene="selectedItem" />
        </n-grid-item>
      </n-grid>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  NGrid,
  NGridItem,
} from "naive-ui";

import { useConstellationsStore } from "~/stores/constellations";
import { getHomeTimeline, getHandleTimeline, GetSceneResponseT } from "../utils/apis";
import { $Fetch } from "ofetch";
import { nextTick } from "vue";

const props = defineProps<{
  mobile?: boolean,
  sourceType: string,
}>();

const { sourceType } = toRefs(props);
const page = ref<number>(0);
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