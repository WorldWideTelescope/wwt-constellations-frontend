<template>
<div id="image-page-root">
  <NuxtLink to="/" id="home-link"></NuxtLink>
</div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  inject: ["wwtView"],
  
  created() {
    console.log("In specific page created")
    const params = this.$route.params;
    this.user = params.user as string;
    this.id = params.id as string;
    this.wtmlUrl = `http://localhost:8000/item/${this.user}/{this.id}`;
    console.log(this.wwtView);
  },
  data() {
    return {
      user: "",
      id: "",
      wtmlUrl: null as string | null
    }
  }
});
</script>

<style lang="less">
#home-link {
  position: fixed;
  background: salmon;
  width: 100px;
  height: 50px;
  top: 10px;
  left: 10px;
}
</style>
