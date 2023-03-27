<template>
  <div id="image-page-root">
    <NuxtLink to="/" id="home-link">Home</NuxtLink>
    <WTMLViewSSR :wtml-url="wtmlUrl" />
  </div>
</template>

<script lang="ts">
const nuxtConfig = useRuntimeConfig();

export default defineNuxtComponent({
  created() {
    console.log("In specific page created")
    const params = this.$route.params;
    this.user = params.user as string;
    this.id = params.id as string;
    this.wtmlUrl = `${nuxtConfig.apiUrl}/item/${this.user}/{this.id}`;
  },
  data() {
    return {
      user: "",
      id: "",
      wtmlUrl: undefined as string | undefined
    }
  }
});
</script>

<style scoped lang="less">
#image-page-root {
  pointer-events: none;
}

#home-link {
  pointer-events: auto;
  position: fixed;
  background: black;
  border: 1px solid white;
  text-decoration: none;
  margin: auto;
  border-radius: 2px;
  top: 10px;
  left: 10px;
  font-size: 20pt;
  padding: 3px;
}
</style>
