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

      <h3>Add Handle Owner</h3>

      <p>Handle: <input type="text" id="add-handle-owner-handle" name="add-handle-owner-handle"
          v-model="addHandleOwnerHandle" /></p>
      <p>Account ID: <input type="text" id="add-handle-owner-account" name="add-handle-owner-account"
          v-model="addHandleOwnerAccount" /></p>
      <p><button @click="onAddHandleOwner">Do it</button> Result: {{ addHandleOwnerResult }}</p>

      <h3>Regenerate Global Timeline</h3>

      <p>Lead Scene ID: <input type="text" id="regen-timeline-scene" name="regen-timeline-scene"
          v-model="regenTimelineScene" /></p>
      <p><button @click="onRegenTimeline">Do it</button> Result: {{ regenTimelineResult }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  addHandleOwner,
  amISuperuser,
  createHandle,
  miscConfigDatabase,
} from "~/utils/apis";

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
const createHandleResult = ref("N/A");

async function onCreateHandle() {
  try {
    const req = {
      display_name: createHandleDisplay.value,
    };

    const fetcher = await $backendAuthCall();
    const resp = await createHandle(fetcher, createHandleName.value, req);
    createHandleResult.value = resp.error ? "error" : `OK: ${resp.id}`;
  } catch (err) {
    createHandleResult.value = `error: ${err}`;
  }
}

// Add handle owner

const addHandleOwnerHandle = ref("");
const addHandleOwnerAccount = ref("");
const addHandleOwnerResult = ref("N/A");

async function onAddHandleOwner() {
  try {
    const req = {
      account_id: addHandleOwnerAccount.value,
    };

    const fetcher = await $backendAuthCall();
    const resp = await addHandleOwner(fetcher, addHandleOwnerHandle.value, req);
    addHandleOwnerResult.value = resp.error ? "error" : "OK";
  } catch (err) {
    addHandleOwnerResult.value = `error: ${err}`;
  }
}

// Regenerate global timeline

const regenTimelineScene = ref("");
const regenTimelineResult = ref("N/A");

async function onRegenTimeline() {
  try {
    const fetcher = await $backendAuthCall();
    regenTimelineResult.value = "sending ...";
    await miscUpdateTimeline(fetcher, regenTimelineScene.value);
    regenTimelineResult.value = "OK";
  } catch (err) {
    regenTimelineResult.value = `error: ${err}`;
  }
}

</script>

<style scoped lang="less"></style>
