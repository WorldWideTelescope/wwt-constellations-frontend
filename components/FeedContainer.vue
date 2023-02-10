<template>
  <div>
    <ClientOnly>
      <Feed
        id="feed"
        ref="feed"
        :horizontal="mobile"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  props: {
    mobile: {
      type: Boolean,
      default: false
    }
  }
});
</script>
