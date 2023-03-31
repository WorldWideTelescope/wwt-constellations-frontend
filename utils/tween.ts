import { Imageset, ImageSetLayer } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";
import { tween } from "femtotween";

import { getEngineStore, raDecForImageset } from "./helpers";
import { PlaceDetailsT } from "./types";

const MIN_MOVE_TIME = 2000;

interface TweenOptions {
  time?: number;
  done?: Function;
  ease?: Function;
}

export function timeToImageset(imageset: Imageset, zoomDeg: number): number {
  const store = getEngineStore();
  const raDecZoom = raDecForImageset(imageset);
  return store.timeToRADecZoom({ ...raDecZoom, zoomDeg }) * 1000;
}

/** Returns a time in milliseconds */
export function timeToPlace(place: PlaceDetailsT): number {
  const store = getEngineStore();
  return store.timeToRADecZoom({
    raRad: place.ra_rad,
    decRad: place.dec_rad,
    zoomDeg: place.zoom_deg,
    rollRad: place.roll_rad ?? 0.,
  }) * 1000;
}

export function tweenLayerIn(layer: ImageSetLayer, finalOpacity: number, options?: TweenOptions) {
  return tween(0, finalOpacity, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

export function tweenLayerOut(layer: ImageSetLayer, options?: TweenOptions): Function {
  return tween(layer.opacity, 0, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

// If the time is <= minMoveTime, the tween will start immediately
export function tweenLayerInForMove(layer: ImageSetLayer, finalOpacity: number, moveTime: number, minMoveTime = MIN_MOVE_TIME): Function {
  // The tweening takes place over a "time" interval from 0 to 1
  // t0 represents the "time" at which the animation will start
  // (i.e. the easing function is 0 before t0)
  // In actual clock time, t0 represents the fraction that we are
  // through the motion when the animation starts
  const t0 = Math.max((moveTime - minMoveTime) / moveTime, 0);
  const A = 1 / (1 - t0);
  const tweenOptions = {
    time: moveTime,
    ease: (t: number) => {
      if (t < t0) { return 0; }
      return Math.pow(A * (t - t0), 1);
    }
  }
  return tweenLayerIn(layer, finalOpacity, tweenOptions);
}

export function tweenLayerOutToDelete(layer: ImageSetLayer, duration: number): Function {
  const store = getEngineStore();
  const tweenOptions = {
    time: duration,
    done: () => store.deleteLayer(layer.id)
  };
  return tweenLayerOut(layer, tweenOptions);
}
