<template>
  <div id="page-root">
    <ClientOnly>
      <Feed
        id="feed"
        ref="feed"
        :horizontal="mobile"
        />
    </ClientOnly>
    <!-- <WTMLViewSSR/> -->
  </div>
</template>
  
<script lang="ts">
export default defineNuxtComponent({
  
  created() {
    console.log(this);
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
    //window.addEventListener("resize", this.onResize);
    //this.onResize();
  },
  methods: {
    logReady() { console.log("Ready!"); },
    onResize() {

      // Very primitive way, we should improve this
      // this.mobile = window.innerWidth < 600;
      // console.log(`Mobile: ${this.mobile}`);
    }
  }
});
</script>
  
  
<style lang="less">
#page-root {
  pointer-events: none;
}

#feed {
  position: absolute;
  overflow: scroll;
  z-index: 10;
  height: 100%;
  max-width: 12%;
  min-width: 200px;
  pointer-events: auto;
}

@media(max-width: 600px) {
  #feed {
    top: 80%;
    max-width: 100%;
    max-height: 20%;
  }
}
</style>
  