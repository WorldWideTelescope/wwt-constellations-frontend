<template>
  <div>
    <slot />
    <button @click="logInOut" id="logout">
      {{ loggedIn ? 'Log out' : 'Log in' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useConstellationsStore } from '../stores/constellations';
import { storeToRefs } from 'pinia';

const constellationsStore = useConstellationsStore();
const { loggedIn } = storeToRefs(constellationsStore);

const { $keycloak } = useNuxtApp();

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
#logout {
  position: fixed;
  top: 3px;
  right: 3px;
}
</style>
