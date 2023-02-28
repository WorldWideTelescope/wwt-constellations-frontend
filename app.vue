<template>
  <div id="app">
    <WWTViewSSR ref="wwt"/>
    <NuxtPage class="page"/>
    <button @click="logInOut" id="logout">
      {{ loggedIn ? 'Log out' : 'Log in' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useConstellationsStore } from './stores/constellations';
import { storeToRefs } from 'pinia';

const constellationsStore = useConstellationsStore();
const { loggedIn } = storeToRefs(constellationsStore);

const { $keycloak } = useNuxtApp();

onMounted(() => {
  // See the example of silent SSO checking at
  // https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
  $keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso`
  }).then(() => {
    loggedIn.value = $keycloak.authenticated ?? false;

    // Example of periodic token refreshing

    // setInterval(() => {
    //   $keycloak.updateToken(70).then((refreshed) => {
    //     if (refreshed) {
    //       console.log("Token refreshed " + refreshed);
    //     } else {
    //       console.warn(`Token not refreshed, valid for ${Math.round($keycloak.tokenParsed!.exp! + keycloak.timeSkew! - new Date().getTime() / 1000)} seconds`);
    //     }
    //   }).catch(() => {
    //     console.error("Failed to refresh token");
    //   })
    // }, 6000);
  });
});

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
  }

}

.page {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

#logout {
  position: fixed;
  top: 3px;
  right: 3px;
}
</style>
