<template>
  <div id="superuser-root">
    <h1>Superuser Controls</h1>

    <p><button @click="onCheck">Check status</button></p>

    <p>Am I superuser? {{ superuserStatus }}</p>

    <div v-if="isSuperuser">
      <h3>Config Database</h3>

      <p><button @click="onConfigDatabase">Do it</button> Result: {{ configDatabaseResult }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { amISuperuser, miscConfigDatabase } from "~/utils/apis";

const { $backendAuthCall } = useNuxtApp();

definePageMeta({
  layout: 'admin'
});

const isSuperuser = ref(false);
const superuserStatus = ref("unknown");

async function onCheck() {
  try {
    const fetcher = await $backendAuthCall();
    const resp = await amISuperuser(fetcher);
    isSuperuser.value = resp.result;
    superuserStatus.value = resp.result ? "yes" : "no";
  } catch (err) {
    isSuperuser.value = false;
    superuserStatus.value = `no; error: ${err}`;
  }
}

const configDatabaseResult = ref("N/A");

async function onConfigDatabase() {
  try {
    const fetcher = await $backendAuthCall();
    const resp = await miscConfigDatabase(fetcher);
    configDatabaseResult.value = resp.error ? "error" : "OK";
  } catch (err) {
    configDatabaseResult.value = `error: ${err}`;
  }
}
</script>

<style scoped lang="less"></style>
