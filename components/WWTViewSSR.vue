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

import { Place } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";
import { ImageSetType } from "@wwtelescope/engine-types";
import { useConstellationsStore } from "~/stores/constellations";

const engineStore = getEngineStore();
const constellationsStore = useConstellationsStore();
const { desiredScene } = storeToRefs(constellationsStore);

const wwt = ref<ComponentPublicInstance | null>(null);

const tweenInCancellers: Function[] = [];
const tweenOutCancellers: Function[] = [];

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

  const viewport_aspect = wwt.value && wwt.value.$el.offsetHeight > 0
    ? wwt.value.$el.offsetWidth / wwt.value.$el.offsetHeight
    : 1.0;

  const place = new Place();
  place.set_RA(newScene.place.ra_rad * R2H);
  place.set_dec(newScene.place.dec_rad * R2D);
  place.set_type(ImageSetType.sky);
  place.set_zoomLevel(wwtZoomForPlace(newScene.place, viewport_aspect));

  if (newScene.place.roll_rad !== undefined) {
    place.get_camParams().rotation = newScene.place.roll_rad * R2D;
  }

  const imageset_info = [];

  if (newScene.content.image_layers) {
    for (var imgdef of newScene.content.image_layers) {
      const imgset = imageInfoToSet(imgdef.image);
      engineStore.addImagesetToRepository(imgset);
      imageset_info.push({ url: imgset.get_url(), opacity: imgdef.opacity });
    }
  }

  // If the WWT view is starting out in a pristine state, initialize it to be in
  // a nice position relative to our target scene. We do this up here so that we
  // can correctly calculate the amount of time the camera move will take.
  //
  // Right now we just have an extremely simpleminded thing where we start the
  // camera more zoomed out, with clamping to reasonable values. We could try
  // something fancier like a random offset, or maybe even a little roll?

  if (constellationsStore.viewNeedsInitialization) {
    const zoom = Math.max(Math.min(place.get_zoomLevel() * 60, 360), 60);

    await engineStore.gotoRADecZoom({
      raRad: newScene.place.ra_rad,
      decRad: newScene.place.dec_rad,
      zoomDeg: zoom,
      rollRad: newScene.place.roll_rad ?? 0.,
      instant: true
    });

    constellationsStore.viewNeedsInitialization = false;
  }

  // Figure out move parameters and set up to fade out, then remove, existing layers

  const moveTime = timeToPlace(newScene.place, viewport_aspect);
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

  engineStore.gotoRADecZoom({
    raRad: newScene.place.ra_rad,
    decRad: newScene.place.dec_rad,
    zoomDeg: wwtZoomForPlace(newScene.place, viewport_aspect),
    rollRad: newScene.place.roll_rad ?? 0.,
    instant: false
  });
});
</script>