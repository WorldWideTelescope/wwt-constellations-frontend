import { Imageset, ImageSetLayer } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";
import { tween } from "femtotween";

import { getEngineStore, ViewportShape } from "./helpers";
import { PlaceDetailsT } from "./types";

const MIN_MOVE_TIME = 2000;

interface TweenOptions {
  time?: number;
  done?: Function;
  ease?: Function;
}

/** Returns a time in milliseconds */
export function timeToPlace(place: PlaceDetailsT, viewport_shape: ViewportShape): number {
  const store = getEngineStore();
  return store.timeToRADecZoom(wwtSetupForPlace(place, viewport_shape)) * 1000;
}

export function tweenLayerIn(layer: ImageSetLayer, finalOpacity: number, options?: TweenOptions) {
  return tween(0, finalOpacity, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

export function tweenLayerOut(layer: ImageSetLayer, options?: TweenOptions): Function {
  return tween(layer.opacity, 0, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

export function powerEaseWithDelay(exponent: number, delay = 0): (t: number) => number {
  // The tweening takes place over a "time" interval from 0 to 1
  // t0 represents the "time" at which the animation will start
  // (i.e. the easing function is 0 before t0)
  const A = 1 / (1 - delay);
  return (t: number) => {
    if (t < delay) { return 0; }
    return Math.pow(A * (t - delay), exponent);
  }
}

export function tweenInOptionsForMove(moveTime: number, minMoveTime = MIN_MOVE_TIME, exponent = 1): TweenOptions {
  // In actual clock time, t0 represents the fraction that we are
  // through the motion when the animation starts
  const t0 = Math.max((moveTime - minMoveTime) / moveTime, 0);
  return {
    time: moveTime,
    ease: powerEaseWithDelay(exponent, t0),
  }
}

// If the time is <= minMoveTime, the tween will start immediately
export function tweenLayerInForMove(layer: ImageSetLayer, finalOpacity: number, moveTime: number, minMoveTime = MIN_MOVE_TIME): Function {
  const tweenOptions = tweenInOptionsForMove(moveTime, minMoveTime);
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

export async function tweenToBackgroundForMove(bgImageset: Imageset, moveTime: number, minMoveTime = MIN_MOVE_TIME): Function {
  const store = getEngineStore();

  const layer = await store.addImageSetLayer({
    url: bgImageset.get_url(),
    name: bgImageset.get_name(),
    mode: "preloaded",
    goto: false
  });

  const tweenOptions = tweenInOptionsForMove(moveTime, minMoveTime);
  tweenOptions.done = () => {
    store.setBackgroundImageByName(bgImageset.get_name());
    setTimeout(() => {
      store.deleteLayer(layer.id);
    }, 300);
  };

  return tweenLayerIn(layer, 1, tweenOptions);
}

