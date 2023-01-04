<template>
  <div id="app">
    <FeedContainer/>
    <WTMLViewSSR/>
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
      mobile: false
    };
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
    this.onResize();
  },
  methods: {
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
  max-width: 12%;
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
  