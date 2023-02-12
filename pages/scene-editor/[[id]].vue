<template>
<div id="scene-editor-root">
  <NuxtLink to="/" id="home-link">Home</NuxtLink>
  <div id="editing-panel">
    <div>
      <span>Scene Name:</span>
      <input v-model="sceneName"/>
    </div>
    <div>
      <button @click="submit">Submit</button>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
const { params } = useRoute();
const { $engineStore } = useNuxtApp();
import { Scene } from "~/utils/types";

let store: ReturnType<typeof $engineStore> | null;
if (process.client) {
  store = $engineStore();
}

// If no parameter is given
// (e.g. the route is /scene-editor/),
// this is interpreted as the empty string
// so let's be a bit more explicit about
// the fact that we don't have a value
const id = ref(params.id || null);
const sceneName = ref("");

function getScene(): Scene {
  return {
    name: sceneName.value,
    imageIDs: [],
    user: "",
    place: {
      raRad: store?.raRad ?? 0,
      decRad: store?.decRad ?? 0,
      zoomDeg: store?.zoomDeg ?? 360,
      rollRad: store?.rollRad ?? 0
    }
  }
}

function create(scene: Scene) {
}

function update(scene: Record<string,any>) {

}

function submit() {
  if (store === null) {
    return;
  }
  const scene = getScene();

  if (id.value === null) {
    create(scene);
  } else {
    update(scene);
  }
}

</script>

<style scoped lang="less">
#scene-editor-root {
  pointer-events: none;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
}

#home-link {
  pointer-events: auto;
  position: fixed;
  background: black;
  border: 1px solid white;
  text-decoration: none;
  margin: auto;
  border-radius: 2px;
  top: 50px;
  right: 10px;
  font-size: 20pt;
  padding: 3px;
}

#editing-panel {
  pointer-events: auto;
  position: fixed;
  left: 2%;
  top: 5%;
  height: 90%;
  background: rgba(65, 65, 65, 0.6);
  border: 2px solid white;
  border-radius: 10px;
  padding: 5px;
  color: white;
}
</style>
