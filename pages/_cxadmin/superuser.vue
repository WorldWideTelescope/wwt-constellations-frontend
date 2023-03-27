<template>
  <div id="superuser-root">
    <h1>Superuser Controls</h1>

    <p><button @click="onCheck">Check status</button></p>

    <p>Am I superuser? {{ superuserStatus }}</p>
  </div>
</template>

<script setup lang="ts">
import { amISuperuser } from "~/utils/apis";

const { $backendAuthCall } = useNuxtApp();

definePageMeta({
  layout: 'admin'
});

const isSuperuser = ref(false);
const superuserStatus = ref("unknown");

function onCheck() {
  amISuperuser($backendAuthCall()).then((resp) => {
    isSuperuser.value = resp.result;
    superuserStatus.value = resp.result ? "yes" : "no";
  }).catch((err) => {
    isSuperuser.value = false;
    superuserStatus.value = `no; error: ${err}`;
  });
}
</script>

<style scoped lang="less"></style>
