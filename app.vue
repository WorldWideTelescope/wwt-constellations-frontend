<template>
  <div id="app">
    <WWTViewSSR ref="wwt"/>
    <NuxtPage class="page"/>
    <button @click="logInOut" id="logout">
      {{ loggedIn ? 'Log out' : 'Log in' }}
    </button>
  </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  created() {
    console.log(this);
  },

  data() {
    return {
      loggedIn: false
    }
  },

  methods: {
    logInOut() {
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
