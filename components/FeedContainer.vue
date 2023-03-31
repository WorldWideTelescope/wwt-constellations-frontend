<template>
  <div>
    <ClientOnly>
      <Feed id="feed" ref="feed" :horizontal="mobile" :source-type="sourceType" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mobile?: boolean,
  sourceType: string,
}>();
</script>
