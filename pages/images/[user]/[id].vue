<template>
<div id="app">
  <WTMLViewSSR
    :wtml-url="wtmlUrl"
  />
</div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  created() {
    const params = this.$route.params;
    this.user = params.user as string;
    this.id = params.id as string;
    this.wtmlUrl = `http://localhost:8000/item/${this.user}/{this.id}`;
  },
  data() {
    return {
      user: "",
      id: "",
      wtmlUrl: null as (string | null)
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
</style>
