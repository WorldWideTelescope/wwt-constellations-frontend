<template>
  <div id="app">
    <NuxtLayout class="page">
      <WWTViewSSR ref="wwt" v-show="showWWT" />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { loggedIn, showWWT } = storeToRefs(constellationsStore);

const { $keycloak } = useNuxtApp();

onMounted(() => {
  // In most cases we need to initialize the Keycloak state, but it is possible
  // that a middleware has already done it.
  //
  // See the example of silent SSO checking at
  // https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter

  if (!$keycloak.refreshToken) {
    $keycloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso`
    }).then(() => {
      loggedIn.value = $keycloak.authenticated ?? false;
    });
  }
});
</script>

<style lang="less">
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
  position: fixed;

  .wwtelescope-component {
    width: 100vw;
    height: 100vh;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
    pointer-events: all;
  }
}

.page {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  // Don't eat up WWT events by default. Children should re-enable pointer
  // events as needed.
  pointer-events: none;
}
</style>
