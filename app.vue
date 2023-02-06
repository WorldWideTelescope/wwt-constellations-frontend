<template>
  <div id="app">
    <WWTViewSSR ref="wwt"/>
    <NuxtPage class="page"/>
    <button @click="logout" id="logout">Logout</button>
  </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  created() {
    console.log(this);
  },

  methods: {
    logout() {
      this.$keycloak.logout({
        redirectUri: window.location.href
      });
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
