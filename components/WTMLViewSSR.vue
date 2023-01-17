<template>
  <div>
    <client-only>
      <WTMLView
        :wtml-url="wtmlUrl"
      />
    </client-only>
  </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
  props: {
    wtmlUrl: {
      type: String,
      default: null,
      required: false
    }
  }
});
</script>
