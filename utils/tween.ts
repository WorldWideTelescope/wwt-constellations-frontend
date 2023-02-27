import { Imageset, ImageSetLayer } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";
import { tween } from "femtotween";
import { getStore, raDecForImageset } from "./helpers";

const MIN_MOVE_TIME = 2000;

interface TweenOptions {
  time?: number;
  done?: Function;
  ease?: Function;
}

export function timeToImageset(imageset: Imageset, zoomDeg: number): number {
  const store = getStore();
  const raDecZoom = raDecForImageset(imageset);
  return store.timeToRADecZoom({ ...raDecZoom, zoomDeg }) * 1000;
}

export function tweenLayerIn(layer: ImageSetLayer, options?: TweenOptions) {
  return tween(0, 1, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

export function tweenLayerOut(layer: ImageSetLayer, options?: TweenOptions): Function {
  return tween(layer.opacity, 0, (value) => applyImageSetLayerSetting(layer, ["opacity", value]), options);
}

// If the time is <= minMoveTime, the tween will start immediately
export function tweenLayerInForGoto(layer: ImageSetLayer, zoomDeg: number, minMoveTime = MIN_MOVE_TIME): Function {
  
  const moveTime = timeToImageset(layer.get_imageSet(), zoomDeg);
  
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
      return Math.pow(A*(t-t0), 1);
    }
  }
  return tweenLayerIn(layer, tweenOptions);
}

export function tweenLayerOutToDelete(layer: ImageSetLayer, duration: number): Function {
  const store = getStore();
  const tweenOptions = {  
    time: duration,
    done: () => store.deleteLayer(layer.id)
  };
  return tweenLayerOut(layer, tweenOptions);
}
