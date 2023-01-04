<template>
  <div>
    <client-only>
      <Feed
        id="feed"
        ref="feed"
        :horizontal="mobile"
      />
    </client-only>
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
