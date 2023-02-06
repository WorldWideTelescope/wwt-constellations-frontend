<template>
  <div></div>
</template>

<script lang="ts">
// See the example of silent SSO checking at
// https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
export default defineNuxtComponent({
  created() {
    parent.postMessage(location.href, location.origin);
  }
})
</script>
