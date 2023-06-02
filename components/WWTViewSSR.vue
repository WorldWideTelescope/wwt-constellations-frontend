<template>
  <div>
    <ClientOnly>
      <WorldWideTelescope wwt-namespace="wwt-constellations" ref="wwt"></WorldWideTelescope>
      <template #fallback>
        <div>WorldWide Telescope component</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ComponentPublicInstance } from "vue";

import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";
import { useConstellationsStore } from "~/stores/constellations";
import { addImpression } from "~/utils/apis";

const engineStore = getEngineStore();
const constellationsStore = useConstellationsStore();
const {
  desiredScene,
  describedScene,
  viewportBottomBlockage,
  viewportLeftBlockage,
  isMovingToScene
} = storeToRefs(constellationsStore);

const wwt = ref<ComponentPublicInstance | null>(null);

const tweenInCancellers: Function[] = [];
const tweenOutCancellers: Function[] = [];

const { $backendCall } = useNuxtApp();

watch(desiredScene, async (newScene) => {
  // Cancel any pending tweens

  tweenInCancellers.forEach(t => t());
  tweenInCancellers.length = 0;

  tweenOutCancellers.forEach(t => t());
  tweenOutCancellers.length = 0;

  // If no scene, delete all layers and call it a day, I guess?

  if (newScene === null) {
    Object.keys(engineStore.imagesetLayers).forEach((id) => engineStore.deleteLayer(id));
    return;
  }

  // Set up new engine elements

  const imageset_info = [];

  if (newScene.content.image_layers) {
    for (var imgdef of newScene.content.image_layers) {
      const imgset = imageInfoToSet(imgdef.image);
      engineStore.addImagesetToRepository(imgset);
      imageset_info.push({ url: imgset.get_url(), opacity: imgdef.opacity });
    }
  }

  // Figure out where we're going, which is a function of both the region-of-interest
  // of the target place as well as the current shape of the viewport.

  const viewport_shape = {
    width: wwt.value ? wwt.value.$el.offsetWidth : 1,
    height: wwt.value ? wwt.value.$el.offsetHeight : 1,
    left_blockage: viewportLeftBlockage.value,
    bottom_blockage: viewportBottomBlockage.value,
  };

  const setup = wwtSetupForPlace(newScene.place, viewport_shape);

  let bgImageset;
  if (newScene.content.background) {
    bgImageset = backgroundInfoToSet(newScene.content.background);
    engineStore.addImagesetToRepository(bgImageset);
  } else {
    // Note that when we're first starting up, this may be null.
    bgImageset = engineStore.lookupImageset("Digitized Sky Survey (Color)");
  }

  const needBgUpdate = bgImageset?.get_name() !== engineStore.backgroundImageset?.get_name();

  // If the WWT view is starting out in a pristine state, initialize it to be in
  // a nice position relative to our target scene. We do this up here so that we
  // can correctly calculate the amount of time the camera move will take.
  //
  // Right now we just have an extremely simpleminded thing where we start the
  // camera more zoomed out, with clamping to reasonable values. We could try
  // something fancier like a random offset, or maybe even a little roll?

  if (constellationsStore.viewNeedsInitialization) {
    const zoom = Math.max(Math.min(setup.zoomDeg * 60, 360), 60);

    await engineStore.gotoRADecZoom({
      raRad: setup.raRad,
      decRad: setup.decRad,
      zoomDeg: zoom,
      rollRad: setup.rollRad,
      instant: true
    });

    constellationsStore.viewNeedsInitialization = false;
  }

  // Figure out move parameters and set up to fade out, then remove, existing layers

  const moveTime = timeToPlace(newScene.place, viewport_shape);
  const minMoveTime = 2000;

  Object.keys(engineStore.imagesetLayers).forEach((id) => {
    const layer = engineStore.imagesetLayerById(id);

    if (layer !== null) {
      // If the layer is already at partial opacity,
      // we can make the fadeout that much quicker
      const tweenTime = layer.opacity * Math.min(moveTime, minMoveTime);
      tweenOutCancellers.push(tweenLayerOutToDelete(layer, tweenTime));
    }
  });

  // Set up the new layers and fade them in

  if (needBgUpdate && bgImageset) {
    tweenToBackgroundForMove(bgImageset, moveTime, minMoveTime);
  }

  for (var img_info of imageset_info) {
    engineStore.addImageSetLayer({
      url: img_info.url,
      name: img_info.url,
      mode: "preloaded",
      goto: false
    }).then((layer) => {
      applyImageSetLayerSetting(layer, ["opacity", 0]);
      tweenInCancellers.push(tweenLayerInForMove(layer, img_info.opacity, moveTime, minMoveTime));
    });
  }

  // Finally, launch the goto
  isMovingToScene.value = true;

  engineStore.gotoRADecZoom({
    raRad: setup.raRad,
    decRad: setup.decRad,
    zoomDeg: setup.zoomDeg,
    rollRad: setup.rollRad,
    instant: false
  }).finally(() => {
    isMovingToScene.value = false;
  }).then(() => {
    addImpression($backendCall, newScene.id).then((success) => {
      if (describedScene.value && success) {
        describedScene.value.impressions++;
      }
    });
  });
});
</script>
