<template>
  <div>
    <h1>
      <NuxtLink :to="`/@${handle}/`">
        <n-button circle>
          <template #icon>
            ←
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
import {
  NButton,
  NCol,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NRow,
  NStatistic,
  useNotification
} from "naive-ui";
import { RouteLocationNormalized } from "vue-router";

import { getHandle, handleStats, HandleStatsResponseT, updateHandle } from "~/utils/apis";

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

</script>
