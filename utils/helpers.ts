import { Imageset, Place } from "@wwtelescope/engine";

export function getStore() {
  const { $engineStore, $wwtPinia } = useNuxtApp();
  return $engineStore($wwtPinia);
}

export function raDecForImageset(imageset: Imageset) {
  return {
    raRad: D2R * imageset.get_centerX(),
    decRad: D2R * imageset.get_centerY(),
  };
}

export function raDecZoomForPlace(place: Place) {
  return {
    raRad: D2R * place.get_RA(),
    decRad: H2R * place.get_dec(),
    zoomDeg: place.get_zoomLevel(),
  };
}
