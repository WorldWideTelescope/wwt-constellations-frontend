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
  NForm,
  NFormItem,
  NInput,
  NRow,
  useNotification
} from "naive-ui";
import { RouteLocationNormalized } from "vue-router";

import { getHandle, updateHandle } from "~/utils/apis";

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

const { data } = await useAsyncData(`handle-${handle}`, async () => {
  return getHandle($backendCall, handle);
});

const display_name = ref("");

watchEffect(() => {
  if (data.value !== null) {
    display_name.value = data.value.display_name;
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

</script>
