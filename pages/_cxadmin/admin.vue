<template>
  <div id="superuser-root">
    <h1>Superuser Controls</h1>

    <p><button @click="onCheck">Check status</button></p>

    <p>Am I superuser? {{ superuserStatus }}</p>

    <div v-if="loggedIn && roles.length > 0">
      <p>My roles</p>
      <ul>
        <li v-for="role in roles">
          {{ role }}
        </li>
      </ul>
    </div>

    <div v-if="isSuperuser">
      <h3>Config Database</h3>
      <p><button @click="onConfigDatabase">Do it</button> Result: {{ configDatabaseResult }}</p>
    </div>

    <div v-if="isSuperuser || roles.includes('manage-handles')">
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
    </div>

    <div v-if="isSuperuser || roles.includes('update-timeline')">
      <h3>Regenerate Global Timeline</h3>
      <p>Lead Scene ID: <input type="text" id="regen-timeline-scene" name="regen-timeline-scene"
          v-model="regenTimelineScene" /></p>
      <p><button @click="onRegenTimeline">Do it</button> Result: {{ regenTimelineResult }}</p>
    </div>

    <div v-if="isSuperuser || roles.includes('update-global-tessellation')">
      <h3>Regenerate Global Tessellation</h3>
      <p><button @click="onRegenTessellation">Do it</button> Result: {{ regenTessellationResult }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConstellationsStore } from "~/stores/constellations";
import {
  addHandleOwner,
  amISuperuser,
  createHandle,
  miscConfigDatabase,
} from "~/utils/apis";

import { storeToRefs } from "pinia";

const { $backendAuthCall, $keycloak } = useNuxtApp();

const constellationsStore = useConstellationsStore();
const {
  loggedIn,
} = storeToRefs(constellationsStore);

definePageMeta({
  layout: 'admin'
});

// In case you are getting excited about security weaknesses, note that all of
// the backend APIs used here have independent security checks. The
// "amISuperuser" test is only something superficial to determine whether to
// display the UI and give the admin an indicator as to whether they're properly
// logged in.

const isSuperuser = ref(false);
const superuserStatus = ref("unknown");

const roles = ref<string[]>([]);

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

// Regenerate global tessellation

const regenTessellationResult = ref("N/A");

async function onRegenTessellation() {
  try {
    const fetcher = await $backendAuthCall();
    regenTessellationResult.value = "sending ...";
    await miscUpdateGlobalTessellation(fetcher);
    regenTessellationResult.value = "OK";
  } catch (err) {
    regenTessellationResult.value = `error: ${err}`;
  }
}

watch(
  loggedIn,
  async (newLoggedIn) => {
    if (process.client && newLoggedIn) {
      roles.value = $keycloak.realmAccess?.roles ?? [];
    } else {
      roles.value = [];
    }
  },
  { immediate: true }
);

</script>

<style scoped lang="less"></style>
