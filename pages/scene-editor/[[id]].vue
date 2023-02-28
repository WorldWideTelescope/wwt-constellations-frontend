<template>
<div id="scene-editor-root">
  <NuxtLink to="/" id="home-link">Home</NuxtLink>
  <div id="editing-panel">
    <h2>Scene Editor</h2>
    <div>
      <div>Scene Name:</div>
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
              :class="layers.map(l => l.get_imageSet()).includes(image) ? 'selected' : ''"
              :src="image.get_thumbnailUrl()"
              :alt="image.get_name()"
              @click="onThumbnailClick(image)"
            />
          </div>
        </template>
      </Popper>
    </ClientOnly>
    <div id="image-layer-controls">
      <ClientOnly>
        <imageset-item
          v-for="layer in layers"
          :layer="layer"
          :key="layer.id.toString()"
        />
      </ClientOnly>
    </div>
    <div>
      <div>Background imagery:</div>
      <select v-model="curBackgroundImagesetName">
        <option
          v-for="bg in backgroundImagesets"
          v-bind:value="bg.imagesetName"
          v-bind:key="bg.imagesetName"
        >
          {{ bg.displayName }}
        </option>
      </select>
    </div>
    <div>
      <button @click="submit">Submit</button>
      <div v-show="submitMessage">{{ submitMessage }}</div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
const { params } = useRoute();
const { $engineStore, $keycloak } = useNuxtApp();
import { OptionalFields } from "~/utils/type-helpers";
import { ImagesetLayerDetails, Scene } from "~/utils/types";
import { API_URL } from "~/utils/constants";

import { Imageset, ImageSetLayer } from "@wwtelescope/engine";

type SceneUpdates = OptionalFields<Scene>;

const store: ReturnType<typeof $engineStore> | null = getStore();
console.log(store);
let lastSubmittedScene: Scene | null = null;

// If no parameter is given
// (e.g. the route is /scene-editor/),
// this is interpreted as the empty string
// so let's be a bit more explicit about
// the fact that we don't have a value
const idStr = typeof params.id === 'object' ? params.id.join(",") : (params.id || null);
const id = ref(idStr);
const sceneName = ref("");
const layers = reactive([] as ImageSetLayer[]);
const imagesets = reactive([] as Imageset[]);
const backgroundImagesets = reactive(SKY_BACKGROUND_IMAGESETS);
const submitMessage = ref("");
const showImagePopper = ref(false);
let curBackgroundImagesetName = computed({
  get() {
    return store?.backgroundImageset?.get_name() ?? "";
  },
  set(name: string) {
    store?.setBackgroundImageByName(name);
  }
});


// We only want to run this client-side
onMounted(() => {
  // If we don't wrap this in nextTick,
  // the WWT instance hasn't been linked yet
  // (for some reason)
  nextTick(async () => {
    if (store === null) {
      return;
    }
    await store.waitForReady();
    store.loadImageCollection({
      url: `${API_URL}/images?page=1&size=100`,
      loadChildFolders: false
    }).then((folder) => {
      console.log(folder);
      const children = folder?.get_children() ?? [];
      console.log(children.length);
      children.forEach((child) => {
        if (child instanceof Imageset) {
          imagesets.push(child);
        }
      });
    });

    if (id.value !== null) {
      sceneSetup(id.value);
    }
  });
});

async function sceneSetup(id: string) {
  const scene = await queryForScene(id);
  sceneName.value = scene.name;
  const layerProms = scene.imagesetLayers.map((iset: ImagesetLayerDetails) => {
    return store?.addImageSetLayer({
      mode: "autodetect",
      url: iset.url,
      name: iset.name,
      goto: false
    }).then((layer) => {
      layer.set_opacity(iset.opacity)
      return layer;
    });
  });

  Promise.all(layerProms).then(added => {
    added.forEach((layer: ImageSetLayer | undefined) => {
      if (layer) {
        layers.push(layer);
      }
    });
  });

  if (isPlaceDetails(scene.place)) {
    store?.gotoRADecZoom({...scene.place, instant: false});
  }
}

function onThumbnailClick(iset: Imageset) {
  const index = layers.map(layer => layer.get_imageSet()).indexOf(iset);
  if (index > -1) {
    store?.deleteLayer(layers[index].id.toString());
    layers.splice(index, 1);
  } else {
    store?.addImageSetLayer({
      mode: "autodetect",
      url: iset.get_url(),
      name: iset.get_name(),
      goto: true
    }).then((layer) => {
      layers.push(layer);
    });
  }
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

function getCurrentScene(): Scene {
  return {
    name: sceneName.value,
    imagesetLayers: layers.map((layer) => {
      const iset = layer.get_imageSet();
      return {
        url: iset.get_url(),
        name: iset.get_name(),
        opacity: layer.get_opacity()
      }
    }),
    user: $keycloak.subject ?? "",
    place: {
      raRad: store?.raRad ?? 0,
      decRad: store?.decRad ?? 0,
      zoomDeg: store?.zoomDeg ?? 360,
      rollRad: store?.rollRad ?? 0
    }
  }
};

type SubmitMessageClass = 'good' | 'neutral' | 'bad';
function showSubmitMessage(message: string, type: SubmitMessageClass) {
  submitMessage.value = message;
  setTimeout(() => {
    submitMessage.value = "";
  }, 5000);
}

async function submit() {
  if (store === null) {
    return;
  }

  const scene = getCurrentScene();
  if (id.value === null) {
    useFetch(`${API_URL}/scenes/create`, {
      method: 'POST',
      body: { scene }
    }).then((res: { data: any }) => {
      if (res.data.value.created) {
        lastSubmittedScene = scene;
        navigateTo(`/scene-editor/${res.data.value.id}`);
      }
    });
  } else {
    useFetch(`${API_URL}/scenes/${id.value}:update`, {
      method: 'POST',
      body: {
        id: id.value,
        updates: sceneUpdates(scene)
      }
    }).then((res: { data: any }) => {
      if (res.data.value.updated) {
        showSubmitMessage("Scene successfully updated", 'good');
      } else {
        showSubmitMessage("There was an error while updating your scene", 'bad');
      }
    });
    
  }
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
  display: flex;
  flex-direction: column;
  gap: 20px;
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

  input {
    width: auto;
    margin: 2px;
  }

  button {
    background-color: transparent;
    outline: none;
    color: white;
    border: solid 2px white;
    font-size: 13pt;
    border-radius: 5px;

    &:hover {
      cursor: pointer;
      background-color: black;
    }
  }
}

#image-layer-controls {
  display: flex;
  flex-direction: column;
}

#imageset-chooser {
  background: black;
  padding: 10px;
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
