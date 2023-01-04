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
    wtmlUrl: String,
    default: null
  }
});
</script>
