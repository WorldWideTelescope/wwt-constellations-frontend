<template>
  <div>
    <ClientOnly>
      <WTMLView
        :wtml-url="wtmlUrl"
      />
      <template #fallback>
        <div>WorldWide Telescope component</div>
      </template>
    </ClientOnly>
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
