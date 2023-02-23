<template>
<div id="scene-editor-root">
  <NuxtLink to="/" id="home-link">Home</NuxtLink>
  <div id="editing-panel">
    <div>
      <span>Scene Name:</span>
      <input v-model="sceneName"/>
    </div>
    <ClientOnly>
      <Popper>
        <button
          @click="showImagePopper = !showImagePopper"
        >
          Select images
        </button>
        <template #content>
          <div
            id="imageset-chooser"
          >
            <img
              v-for="image in imagesets"
              :key="image.get_imageSetID()"
              :class="selectedImagesets.includes(image) ? 'selected' : ''"
              :src="image.get_thumbnailUrl()"
              :alt="image.get_name()"
              @click="onThumbnailClick(image)"
            />
          </div>
        </template>
      </Popper>
    </ClientOnly>
    <div>
      <img
        v-for="image in selectedImagesets"
        :key="image.get_imageSetID()"
        :src="image.get_thumbnailUrl()"
        :alt="image.get_name()"
      />
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
import { OptionalFields } from "~/utils/type-helpers";
import { Scene } from "~/utils/types";
import { API_URL } from "~/utils/constants";

import { Imageset } from "@wwtelescope/engine";

type SceneUpdates = OptionalFields<Scene>;

let store: ReturnType<typeof $engineStore> | null;

let lastSubmittedScene: Scene | null = null;

// If no parameter is given
// (e.g. the route is /scene-editor/),
// this is interpreted as the empty string
// so let's be a bit more explicit about
// the fact that we don't have a value
const idStr = typeof params.id === 'object' ? params.id.join(",") : (params.id || null);
const id = ref(idStr);
const sceneName = ref("");
const selectedImagesets = reactive([] as Imageset[]);

const imagesets = reactive([] as Imageset[]);

const showImagePopper = ref(false);

if (id.value !== null) {
  const scene = await queryForScene(id.value);
  sceneName.value = scene.name;
}

// We only want to run this client-side
onMounted(() => {
  store = $engineStore();

  // If we don't wrap this in nextTick,
  // the WWT instance hasn't been linked yet
  // (for some reason)
  nextTick(() => {
    if (store === null) {
      return;
    }
    store.loadImageCollection({
      url: `${API_URL}/images?page=1&size=100`,
      loadChildFolders: false
    }).then((folder) => {
      console.log(folder);
      const children = folder?.get_children() ?? [];
      children.forEach((child) => {
        if (child instanceof Imageset) {
          console.log(child);
          imagesets.push(child);
        }
      });
    });
  });
});

function getScene(): Scene {
  return {
    name: sceneName.value,
    imageIDs: selectedImagesets.map((iset) => `${iset.get_imageSetID()}`),
    user: "",
    place: {
      raRad: store?.raRad ?? 0,
      decRad: store?.decRad ?? 0,
      zoomDeg: store?.zoomDeg ?? 360,
      rollRad: store?.rollRad ?? 0
    }
  }
}

function onThumbnailClick(iset: Imageset) {;
  const index = selectedImagesets.indexOf(iset);
  console.log(index);
  if (index > -1) {
    selectedImagesets.splice(index, 1);
  } else {
    selectedImagesets.push(iset);
  }
  console.log(selectedImagesets);
}

async function queryForScene(id: string): Promise<Scene> {
  const { data } = await useFetch(`${API_URL}/scenes/${id}`) as { data: any };
  return data.value;
}

function sceneUpdates(scene: Scene): SceneUpdates {
  const updates = { ...scene };
  let key: keyof Scene;
  for (key in updates) {
    if (updates[key] === undefined || 
        (lastSubmittedScene !== null) && (updates[key] === lastSubmittedScene[key])
       ) {
      delete updates[key];
    }
  }
  return updates;
}

async function submit() {
  if (store === null) {
    return;
  }
  const scene = getScene();

  if (id.value === null) {
    const { data } = await useFetch(`${API_URL}/scenes/create`, {
      method: 'POST',
      body: { scene }
    }) as { data: any };
    if (data.value.created) {
      navigateTo(`/scene-editor/${data.value.id}`);
    }
  } else {
    useFetch(`${API_URL}/scenes/update/${id.value}:update`, {
      method: 'POST',
      body: {
        id: id.value,
        updates: sceneUpdates(scene)
      }
    });
  }
  lastSubmittedScene = scene;
}

</script>

<style lang="less">
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

#imageset-chooser {
  background: black;
  padding: 5px;
  border: 2px solid white;
  border-radius: 3px;
  height: calc(3 * 45px + 10px); // Thumbnails are 96x45
  width: calc(2 * 96px + 10px);
  overflow-y: scroll;
  pointer-events: auto;
}

img {
  border: 1px solid white;
  border-radius: 2px;
  pointer-events: auto;

  &.selected {
    border-color: dodgerblue;
  }
}
</style>
