<template>
  <div id="app">
    <client-only>
      <Feed
        id="feed"
        ref="feed"
        :wwt-ready="wwtReady"
        :horizontal="mobile"
        />
      <WorldWideTelescope
        wwt-namespace="wwt-constellations"
        @hook:mounted="(() => { logReady(); wwtReady = true; })()"
        ></WorldWideTelescope>
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
  data() {
    return {
      wwtReady: false,
      mobile: false
    };
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
    this.onResize();
  },
  methods: {
    test() {
      const store = this.$engineStore(this.$pinia);
      store.gotoRADecZoom({raRad: 10, decRad: 10, zoomDeg: 60, instant: false});
    },
    logReady() { console.log("Ready!"); },
    onResize() {

      // Very primitive way, we should improve this
      this.mobile = window.innerWidth < 600;
      console.log(`Mobile: ${this.mobile}`);
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
  max-width: 15%;
  min-width: 200px;
}

@media(max-width: 600px) {
  #feed {
    top: 80%;
    max-width: 100%;
    max-height: 20%;
  }
}
</style>
