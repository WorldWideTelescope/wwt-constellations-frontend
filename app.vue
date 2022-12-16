<template>
  <div id="app">
    <client-only>
      <Feed id="feed"/>
      <WorldWideTelescope wwt-namespace="wwt-constellations"></WorldWideTelescope>
    </client-only>
    <button @click="test">BUTTON</button>
  </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  created() {
    if (process.client) {
      console.log("created client");
    } else {
      console.log("created server");
    }
  },
  methods: {
    test() {
      const store = this.$engineStore(this.$pinia);
      store.gotoRADecZoom({raRad: 10, decRad: 10, zoomDeg: 60, instant: false});
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

  .wwtelescope-component {
    width: 100vw;
    height: 100vh;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
  }

}

#feed {
  position: absolute;
  overflow: scroll;
  z-index: 10;
  height: 100%;
}
</style>
