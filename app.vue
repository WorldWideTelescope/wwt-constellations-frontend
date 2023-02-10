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
  $keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: '/silent-check-sso'
  }).then(() => {
    loggedIn.value = $keycloak.authenticated ?? false;
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

<!-- <script lang="ts">
import { mapWritableState } from 'pinia';
import { useConstellationsStore } from './stores/constellations';

export default defineNuxtComponent({
  created() {
    console.log(this);
  },

  mounted() {
    this.$keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso'
    }).then(() => {
      // console.log("Initialized keycloak");
      // console.dir(JSON.stringify(this.$keycloak));
      // console.log(this.$keycloak.authenticated);
      this.loggedIn = this.$keycloak.authenticated;
      //console.log(this.loggedIn);
    });
  },

  // computed: {
  //   ...mapWritableState(useConstellationsStore, {
  //     loggedIn: 'userLoggedIn'
  //   })
  // },

  data() {
    return {
      loggedIn: false
    }
  },

  methods: {
    logInOut() {
      if (!process.client) {
        return
      }
      if (this.loggedIn) {
        this.$keycloak.logout({
          redirectUri: window.location.href
        }).then(() => {
          this.loggedIn = false;
        }).catch((error: Error) => {
          console.log(`Error logging out: ${error.message}`);
        });
      } else {
        this.$keycloak.login({
          redirectUri: window.location.href,
          prompt: 'login'
        }).then(() => {
           this.loggedIn = true;
        }).catch((error: Error) => {
          console.log(`Error logging in: ${error.message}`);
        });
      }
    }
  }
});
</script> -->

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
