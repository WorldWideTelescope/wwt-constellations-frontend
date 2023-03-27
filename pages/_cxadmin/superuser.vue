<template>
  <div id="superuser-root">
    <h1>Superuser Controls</h1>

    <p><button @click="onCheck">Check status</button></p>

    <p>Am I superuser? {{ superuserStatus }}</p>

    <div v-if="isSuperuser">
      <h3>Config Database</h3>

      <p><button @click="onConfigDatabase">Do it</button> Result: {{ configDatabaseResult }}</p>

      <h3>Create Handle</h3>

      <p>Name: <input type="text" id="create-handle-name" name="create-handle-name" v-model="createHandleName" /></p>
      <p>Display name: <input type="text" id="create-handle-display" name="create-handle-display"
          v-model="createHandleDisplay" /></p>
      <p><button @click="onCreateHandle">Do it</button> Result: {{ createHandleResult }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { amISuperuser, miscConfigDatabase, createHandle } from "~/utils/apis";

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

// Config database

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

// Create handle

const createHandleName = ref("");
const createHandleDisplay = ref("");
const createHandleResult = ref("unknown");

async function onCreateHandle() {
  try {
    const req = {
      handle: createHandleName?.value,
      display_name: createHandleDisplay?.value,
    };

    const fetcher = await $backendAuthCall();
    const resp = await createHandle(fetcher, req);
    createHandleResult.value = resp.error ? "error" : `OK: ${resp.id}`;
  } catch (err) {
    createHandleResult.value = `error: ${err}`;
  }
}
</script>

<style scoped lang="less"></style>
