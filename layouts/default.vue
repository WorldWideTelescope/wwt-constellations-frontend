<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-notification-provider>
      <n-layout style="height: 100%; background: none;">
        <n-layout-header id="header" :class="{'header-mobile': isMobile}">
          <n-space :align="'center'" :size="'small'">
            <n-button-group>
              <n-button v-model="drawer" @click="drawer = !drawer" :bordered="false" size="small"
                style="padding-right: 0px;">
                <n-icon size="24">
                  <MenuRound />
                </n-icon>
              </n-button>
            </n-button-group>
            <n-divider vertical style="height: 24px;" />
            <img :src="require('~/assets/images/wwtlogo.png')" style="width: 24px;" />
            <Breadcrumb />
          </n-space>
        </n-layout-header>

        <n-layout-content style="height: 100%; background: none;">
          <!-- NDrawer has some kind of problem that seems to prevent it from
            working in Nuxt SSR dev mode, no matter what I try. But I don't see
            any ways in which it is particularly important to SSR the drawer,
            and if we make it client-only, things work. So that's what we do for
            now. -->
          <ClientOnly>
            <n-drawer v-model:show="drawer" :width="502" :placement="placement">
              <n-drawer-content>
                <template #header>
                  <n-space :align="'center'" size="small">
                    <img :src="require('/assets/images/wwtlogo.png')" style="width: 24px;" />
                    WorldWide Telescope
                  </n-space>
                </template>
                <template #footer>
                  <n-button @click="logInOut">
                    {{ loggedIn ? 'Log out' : 'Log in' }}
                  </n-button>
                </template>
              </n-drawer-content>
            </n-drawer>
          </ClientOnly>
          <div style="position:relative">
            <slot />
          </div>
        </n-layout-content>
      </n-layout>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useConstellationsStore } from '../stores/constellations';
import { storeToRefs } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue'
import { MenuRound } from "@vicons/material"
import {
  darkTheme,
  DrawerPlacement,
} from "naive-ui";

import {
  NButton,
  NButtonGroup,
  NConfigProvider,
  NDivider,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NNotificationProvider,
  NSpace,
} from "~/utils/fixnaive.mjs";

const constellationsStore = useConstellationsStore();
const { loggedIn } = storeToRefs(constellationsStore);

const { $keycloak } = useNuxtApp();

const drawer = ref(false)
const placement = ref<DrawerPlacement>('left')
const drawerWidth = ref('502px')

function logInOut() {
  if (!process.client) {
    return;
  }

  if (loggedIn.value) {
    $keycloak.logout({
      redirectUri: window.location.href
    }).then(() => {
      loggedIn.value = false;
    }).catch((error: Error) => {
      console.log(`Error logging out: ${error.message}`);
    });
  } else {
    $keycloak.login({
      redirectUri: window.location.href,
      prompt: 'login'
    }).then(() => {
      loggedIn.value = true;
    }).catch((error: Error) => {
      console.log(`Error logging in: ${error.message}`);
    });
  }
}

onMounted(() => {
  updateDrawerWidth();
  window.addEventListener('resize', updateDrawerWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateDrawerWidth);
});

function updateDrawerWidth() {
  if (window.innerWidth < 1000) {
    drawerWidth.value = `${window.innerWidth * 0.70}px`;
  } else {
    drawerWidth.value = '502px';
  }
}

</script>


<style type="less">
#header {
  padding: 2px;
  pointer-events: all;
  line-height: 1em;
  background: none;
  z-index: 100;
  position: relative;
}

.header-mobile {
  position: absolute !important;
}

</style>