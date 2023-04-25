<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-notification-provider>
      <n-layout style="height: 100%;">
        <n-layout-header id="header">
          <n-space align="center">
            <n-button-group>
              <n-button v-model="drawer" @click="drawer = !drawer" :bordered="false">
                <n-icon size="40">
                  <MenuRound />
                </n-icon>
              </n-button>
            </n-button-group>
            <n-divider vertical style="height: 2em;" />
            <n-image src="https://web.wwtassets.org/webclient/images/wwtlogo.png" width="35" />
            <n-h1 :align-text="true" style="margin:0">
              WorldWide Telescope
            </n-h1>
          </n-space>
        </n-layout-header>
        <n-layout-content style="height: 100%;">
          <n-drawer v-model:show="drawer" :width="502" :placement="placement">
            <n-drawer-content>
              <template #header>
                <n-space align="center">
                  <n-image src="https://web.wwtassets.org/webclient/images/wwtlogo.png" width="35" />
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
          <Breadcrumb />
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
import { ref } from 'vue'
import { MenuRound } from "@vicons/material"
import {
  darkTheme,
  NConfigProvider,
  NNotificationProvider,
  NButton,
  NDrawer,
  NButtonGroup,
  NDrawerContent,
  NIcon,
  DrawerPlacement,
  NDivider,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSpace,
  NH1,
  NImage,
  NEl
} from "naive-ui";

const constellationsStore = useConstellationsStore();
const { loggedIn } = storeToRefs(constellationsStore);

const { $keycloak } = useNuxtApp();

const drawer = ref(false)
const placement = ref<DrawerPlacement>('left')

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

</script>


<style type="less">
#header {
  padding: 10px;
  pointer-events: all;
}
</style>