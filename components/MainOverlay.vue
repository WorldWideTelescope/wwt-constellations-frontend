<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }" ref="feedRootRef">
    <ClientOnly>
      <n-button v-if="showNeighborArrows" v-for="neighbor in neighborScenes" class="neighbor-arrow" :bordered="false"
        @click="() => constellationsStore.setupForSingleScene(neighbor)" :style="neighborArrowStyle(neighbor)">
        <n-icon size="30" color="white">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1080"
            height="1080" viewBox="0 0 1080 1080" xml:space="preserve">
            <g transform="matrix(1 0 0 1 540 540)" id="5e37fbc9-afa3-4ee7-9700-3bde04719136">
            </g>
            <g transform="matrix(1 0 0 1 540 540)" id="3b68765a-11c4-4d1d-a495-a1bdf884d74f">
              <rect
                style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: currentColor; fill-rule: nonzero; opacity: 1; visibility: hidden;"
                vector-effect="non-scaling-stroke" x="-540" y="-540" rx="0" ry="0" width="1080" height="1080" />
            </g>
            <g transform="matrix(45 0 0 45 842.74 540)">
              <path
                style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: currentColor; fill-rule: nonzero; opacity: 1;"
                vector-effect="non-scaling-stroke" transform=" translate(-16.5, -12)"
                d="M 20.08 11.42 L 16.04 5.77 C 15.7 5.289999999999999 15.149999999999999 5 14.559999999999999 5 C 13.069999999999999 5 12.209999999999999 6.68 13.069999999999999 7.890000000000001 L 16 12 L 13.07 16.11 C 12.200000000000001 17.32 13.07 19 14.56 19 C 15.15 19 15.71 18.71 16.05 18.23 L 20.09 12.58 C 20.33 12.23 20.33 11.77 20.08 11.42 z"
                stroke-linecap="round" />
            </g>
            <g transform="matrix(45 0 0 45 527.74 540)">
              <path
                style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: currentColor; fill-rule: nonzero; opacity: 1;"
                vector-effect="non-scaling-stroke" transform=" translate(-9.5, -12)"
                d="M 13.08 11.42 L 9.05 5.77 C 8.7 5.29 8.15 5 7.56 5 C 6.07 5 5.2 6.68 6.07 7.89 L 9 12 L 6.07 16.11 C 5.2 17.32 6.07 19 7.56 19 C 8.15 19 8.709999999999999 18.71 9.049999999999999 18.23 L 13.09 12.58 C 13.33 12.23 13.33 11.77 13.08 11.42 z"
                stroke-linecap="round" />
            </g>
            <g transform="matrix(45 0 0 45 216.65 540)">
              <path
                style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: currentColor; fill-rule: nonzero; opacity: 1;"
                vector-effect="non-scaling-stroke" transform=" translate(-9.5, -12)"
                d="M 13.08 11.42 L 9.05 5.77 C 8.7 5.29 8.15 5 7.56 5 C 6.07 5 5.2 6.68 6.07 7.89 L 9 12 L 6.07 16.11 C 5.2 17.32 6.07 19 7.56 19 C 8.15 19 8.709999999999999 18.71 9.049999999999999 18.23 L 13.09 12.58 C 13.33 12.23 13.33 11.77 13.08 11.42 z"
                stroke-linecap="round" />
            </g>
          </svg>
        </n-icon>
      </n-button>
    </ClientOnly>
    <!-- Desktop -->
    <template v-if="!isMobile">
      <n-grid ref="desktop_overlay" cols="1" y-gap="2" class="desktop-panel">
        <n-grid-item v-if="describedHandle">
          <HandlePanel :handle-data="describedHandle" />
        </n-grid-item>
        <n-grid-item>
          <n-collapse-transition appear :show="nextSceneSource.type !== 'single-scene'">
            <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
          </n-collapse-transition>
        </n-grid-item>
        <n-grid-item>
          <Toolbar @goPrev="goPrev" @goNext="goNext" @centerScene="recenter"
            :isCenterButtonEnabled="targetOutsideViewport && !isMovingToScene" />
        </n-grid-item>
        <n-grid-item v-if="describedScene">
          <SceneEditorPanel v-if="showSceneEditor" :scene="describedScene" />
          <ScenePanel v-else :scene="describedScene" :potentially-editable="scenePotentiallyEditable" />
        </n-grid-item>
      </n-grid>
    </template>
    <!-- Mobile -->
    <template v-else>
      <div id="toolbar">
        <Toolbar @goPrev="goPrev" @goNext="goNext" @setExploreMode="(iem: boolean) => isExploreMode = iem"
          :isExploreMode="isExploreMode" @centerScene="recenter"
          :isCenterButtonEnabled="targetOutsideViewport && !isMovingToScene" />
      </div>

      <template v-if="isExploreMode">
        <n-icon class="arrow arrow-left bounce-x-fade" size="50">
          <KeyboardArrowLeftFilled />
        </n-icon>
        <n-icon class="arrow arrow-right bounce-x-fade-reverse" size="50">
          <KeyboardArrowRightFilled />
        </n-icon>
        <n-icon class="arrow arrow-top bounce-y-fade" size="50">
          <KeyboardArrowUpFilled />
        </n-icon>
        <n-icon class="arrow arrow-bottom bounce-y-fade-reverse" size="50">
          <KeyboardArrowDownFilled />
        </n-icon>
      </template>
      <template v-else>
        <div class="mobile-full-page-container" ref="fullPageContainerRef">
          <div class="mobile-full-page" ref="mobileScenePanelRef"
            :style="{ 'height': mobile_page_height + 'px', bottom: mobileScenePanelBottom }">
            <transition name="fade" appear>
              <ScenePanel :class="{ bouncy: showSwipeAnimation }" v-if="describedScene !== null" :scene="describedScene"
                :potentially-editable="scenePotentiallyEditable" ref="mobile_overlay" />
            </transition>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  NButton,
  NCollapseTransition,
  NGrid,
  NGridItem,
  NIcon,
} from "~/utils/fixnaive.mjs";

import { storeToRefs } from "pinia";
import { nextTick, ref } from "vue";
import { useResizeObserver } from "@vueuse/core";
import {
  DoubleArrowRound,
  KeyboardArrowDownFilled,
  KeyboardArrowUpFilled,
  KeyboardArrowLeftFilled,
  KeyboardArrowRightFilled,
} from "@vicons/material";

import { distance } from "@wwtelescope/astro";
import { Color } from "@wwtelescope/engine";

import { useConstellationsStore } from "~/stores/constellations";
import { GetHandleResponseT, GetSceneResponseT } from "~/utils/apis";
import { PlaceDetailsT, SceneDisplayInfoT, SkymapSceneInfo } from "~/utils/types";

import { useSwipe } from "@vueuse/core";

const props = withDefaults(defineProps<{
  scenePotentiallyEditable?: boolean,
  showSceneEditor?: boolean,
  describedHandle?: GetHandleResponseT,
}>(), {
  scenePotentiallyEditable: false,
  showSceneEditor: false,
  describedHandle: undefined,
});

const isExploreMode = ref(false);

const { $backendCall } = useNuxtApp();

const constellationsStore = useConstellationsStore();
const {
  describedScene,
  desiredScene,
  isMobile,
  sceneHistory,
  currentHistoryNode,
  futureScenes,
  viewportBottomBlockage,
  viewportLeftBlockage,
  isMovingToScene,
  nextSceneSource
} = storeToRefs(constellationsStore);

// The list of scenes shown in the skymap

const CURRENT_SCENE_COLOR = Color.fromArgb(255, 37, 232, 166);
const ADJACENT_SCENE_COLOR = Color.fromArgb(255, 31, 191, 137);
const GENERAL_SCENE_COLOR = Color.fromArgb(255, 111, 111, 122);
const skymapScenes = computed<SkymapSceneInfo[]>(() => {

  let scenes = [];
  let currentIndex = 0;
  const previousScene = constellationsStore.previousScene();
  if (previousScene) {
    scenes.push(previousScene);
    currentIndex += 1;
  }
  const fromHistory: GetSceneResponseT[] = [];
  let sceneNode = currentHistoryNode.value;
  let needed = 5;
  while (sceneNode && needed > 0) {
    fromHistory.push(sceneNode.value);
    sceneNode = sceneNode.next;
    needed -= 1;
  }
  scenes = scenes.concat(fromHistory).concat(futureScenes.value.slice(0, needed));
  return scenes.map((s, relIndex) => {
    const currentScene = relIndex === currentIndex;
    const adjacent = Math.abs(relIndex - currentIndex) === 1;
    const color = currentScene ? CURRENT_SCENE_COLOR : (adjacent ? ADJACENT_SCENE_COLOR : GENERAL_SCENE_COLOR);
    return {
      id: s.id,
      content: s.content,
      place: s.place,
      color,
      linewidth: currentScene ? 2 : 1,
      current: currentScene,
      adjacent: adjacent,
    };
  });
});

interface ContextSceneInfo extends GetSceneResponseT {
  currentlyShown: boolean;
}

// The list of scenes used to construct the set of ScenePanels in mobile mode.
// In timeline mode, this grows indefinitely to make the Instagram-style
// infinite scroll possible. When we're not in timeline mode, it contains just
// the scene that's currently being viewed. This list should almost never be
// empty, but it can be empty when the app is starting up and no data have been
// loaded.
const contextScenes = computed<ContextSceneInfo[]>(() => {
  // Maybe this is silly, but pull values out of all of the refs that we use
  // up-front, so that this value is recomputed the same way regardless of which
  // mode we're in.
  const history = sceneHistory.value.toArray();
  const future = futureScenes.value;
  const currentScene = currentHistoryNode.value?.value;

  return history.concat(future).map((scene, itemIndex) => {
    const currentlyShown = (scene === currentScene);
    return { currentlyShown, itemIndex, ...scene };
  });
});

const showNeighborArrows = ref(false);

const neighborScenes = computedAsync<GetSceneResponseT[]>(async () => {
  const scene = desiredScene.value;
  if (scene === null) {
    return [];
  }
  const place = scene.place;
  const cell = await getTessellationCell($backendCall, "global", place.ra_rad, place.dec_rad);
  const neighbors: GetSceneResponseT[] = [];
  for (const neighbor_id of cell.neighbors) {
    const neighbor = await getScene($backendCall, neighbor_id);
    if (neighbor !== null) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
});

// The calculations here assume that the WWT view takes up the entire screen
// and that, because of this, the arrows want to live on the side of the screen.
// If this is ever NOT the case, one could rework this by making the appropriate
// affine transformation into the screen coordinate space of the WWT canvas.
function neighborArrowStyle(scene: SceneDisplayInfoT): Record<string, any> {
  try {

    const currentScene = describedScene.value;
    if (currentScene === null || !isOutsideViewport(scene.place)) {
      return { visibility: 'hidden' };
    }

    const isCurrentSceneInView = !isOutsideViewport(currentScene.place);
    const cameraPoint = engineStore.findScreenPointForRADec({ ra: wwt_ra_rad.value * R2D, dec: wwt_dec_rad.value * R2D });
    const neighborPoint = engineStore.findScreenPointForRADec({ ra: scene.place.ra_rad * R2D, dec: scene.place.dec_rad * R2D });
    const currentScenePoint = engineStore.findScreenPointForRADec({ ra: currentScene.place.ra_rad * R2D, dec: currentScene.place.dec_rad * R2D });
    const startPoint = isCurrentSceneInView ? currentScenePoint : cameraPoint;

    // This formula looks a bit weird!
    // We switch the relative ordering of currentPoint and scenePoint between x and y
    // to account for the fact that y coordinates move downward on the screen.
    // Also, the overall negative sign is to account for the fact that CSS rotations are clockwise
    // but we're calculating an angle from standard position.
    // Since atan2 uses the signs of x and y to determine the angle quadrant, best to just
    // use an overall sign.
    const angle = -Math.atan2(startPoint.y - neighborPoint.y, neighborPoint.x - startPoint.x);

    // Here we use the standard parametrization of a line from a -> b
    // a and b are points (vectors)
    // i.e. a + t * (b - a) = (1 - t) * a + t * b   0 <= t <= 1
    // We imagine just moving along the line, with t going from 0 to 1
    // our intersection point with the screen boundary is the bounding line that we hit first.
    // In practice, we just calculate the intersection t0 for each line and find the smallest one
    // in the range [0, 1]
    // The four intersections occur at tx0, tx1, ty0, ty1
    let x = 0;
    let y = 0;
    let visible = false;
    const tx0 = startPoint.x / (startPoint.x - neighborPoint.x);
    const tx1 = (startPoint.x - window.innerWidth) / (startPoint.x - neighborPoint.x);
    const ty0 = startPoint.y / (startPoint.y - neighborPoint.y);
    const ty1 = (startPoint.y - window.innerHeight) / (startPoint.y - neighborPoint.y);
    const ts = [tx0, tx1, ty0, ty1].filter(t => t >= 0 && t <= 1).sort();
    if (ts.length > 0) {
      const index = isCurrentSceneInView ? 0 : ts.length - 1;
      const t = ts[index];
      x = Math.round(((1 - t) * startPoint.x) + t * neighborPoint.x);
      y = Math.round(((1 - t) * startPoint.y) + t * neighborPoint.y);
      visible = true;
    }

    // Clamp to be inside screen bounds
    x = Math.max(Math.min(x, window.innerWidth - 40), 5);
    y = Math.max(Math.min(y, window.innerHeight - 40), 5);

    return {
      transform: `rotate(${angle}rad)`,
      left: `${x}px`,
      top: `${y}px`,
      visibility: visible ? 'visible' : 'hidden',
    };
  } catch (error) {
    return { visibility: 'hidden' };
  }
}

const showSwipeAnimation = ref(false);
const swipeAnimationTimer = ref<NodeJS.Timer | undefined>(undefined);
const fullPageContainerRef = ref<HTMLDivElement>();
const feedRootRef = ref<HTMLDivElement>();
const mobileScenePanelRef = ref<HTMLDivElement>();

const targetOutsideViewport = ref(false);

function isOutsideViewport(place: PlaceDetailsT): boolean {
  const point = engineStore.findScreenPointForRADec({ ra: place.ra_rad * R2D, dec: place.dec_rad * R2D });
  const rootDiv = feedRootRef.value;
  return (rootDiv !== undefined) &&
    (point.x < 0 || point.x > rootDiv.clientWidth ||
      point.y < 0 || point.y > rootDiv.clientHeight);
}

const engineStore = getEngineStore();
const {
  raRad: wwt_ra_rad,
  decRad: wwt_dec_rad,
  rollRad: wwt_roll_rad,
  zoomDeg: wwt_zoom_deg,
} = storeToRefs(engineStore);

onMounted(() => {
  nextTick(() => {
    constellationsStore.ensureForwardCoverage(8).then(() => {
      constellationsStore.moveForward();
    });
  });

  swipeAnimationTimer.value = setInterval(() => {
    showSwipeAnimation.value = currentHistoryNode.value !== null && !showSwipeAnimation.value;
  }, 10000);

  engineStore.$subscribe(() => {
    const place = describedScene.value?.place
    const rootDiv = feedRootRef.value
    if (place && rootDiv) {
      try {
        targetOutsideViewport.value = isOutsideViewport(place);
      } catch {
        // The above function can sometimes throw an exception (TypeError:
        // matrix1 is undefined) if one of the WWT engine is just starting up.
        // We should fix the API not to do that, but in the meantime, silence
        // the issue.
      }
    }

  });
});

function bottomTransitionCleanup(event: TransitionEvent) {
  if (event.propertyName !== "bottom") {
    return;
  }
  const panel = mobileScenePanelRef.value;
  if (panel) {
    panel.classList.remove("bottom-animation");
    mobileScenePanelBottom.value = 'var(--footer-height)';
    panel.removeEventListener("transitionend", bottomTransitionCleanup);
  }
}

const mobileScenePanelBottom = ref('');
const { lengthY } = useSwipe(
  mobileScenePanelRef,
  {
    passive: true,
    onSwipe(_event: TouchEvent) {
      if (fullPageContainerRef.value) {
        mobileScenePanelBottom.value = `${lengthY.value}px`;
      }
    },
    onSwipeEnd(_event: TouchEvent) {
      if (!fullPageContainerRef.value || !mobileScenePanelRef.value) {
        return;
      }

      const panel = mobileScenePanelRef.value;
      if (!panel) {
        return;
      }

      const hasNext = futureScenes.value.length > 0 ||
        (sceneHistory.value.length > 0 && !!currentHistoryNode.value?.next);
      if (lengthY.value > fullPageContainerRef.value.offsetHeight * 0.2 && hasNext) {

        const moveForwardListener = (event: Event) => {
          constellationsStore.moveForward();
          event.target?.removeEventListener("transitionend", moveForwardListener);
        };
        panel.addEventListener("transitionend", moveForwardListener);
        panel.addEventListener("transitionend", bottomTransitionCleanup);
        panel.classList.add("bottom-animation");
        mobileScenePanelBottom.value = `${mobile_page_height.value}px`;
      } else if (lengthY.value < -25 && currentHistoryNode.value?.prev) {
        mobileScenePanelBottom.value = `${mobile_page_height.value}px`;

        window.requestAnimationFrame(() => {
          constellationsStore.moveBack();
          panel.addEventListener("transitionend", bottomTransitionCleanup);
          panel.classList.add("bottom-animation");
          mobileScenePanelBottom.value = 'var(--footer-height)';
        });
      } else {
        panel.addEventListener("transitionend", bottomTransitionCleanup);
        panel.classList.add("bottom-animation");
        mobileScenePanelBottom.value = 'var(--footer-height)';
      }

    }
  });

onBeforeUnmount(() => {
  clearInterval(swipeAnimationTimer.value);
});

function onItemSelected(sceneInfo: SceneDisplayInfoT) {
  const index = skymapScenes.value.findIndex(scene => scene.id === sceneInfo.id);
  if (index < 0) {
    constellationsStore.useNearbyTimeline(sceneInfo.id);
  } else {
    constellationsStore.moveHistoryToScene(sceneInfo.id);
  }
}

async function recenter() {
  if (describedScene.value) {
    await engineStore.gotoRADecZoom({
      raRad: describedScene.value.place.ra_rad,
      decRad: describedScene.value.place.dec_rad,
      zoomDeg: wwt_zoom_deg.value,
      rollRad: wwt_roll_rad.value,
      instant: false,
    });
  }
}

function goNext() {
  constellationsStore.moveForward();
}

function goPrev() {
  constellationsStore.moveBack();
}

watch(currentHistoryNode, async () => {
  const currentScene = currentHistoryNode.value?.value;
  if (currentScene) {
    describedScene.value = currentScene;
    if (describedScene.value) {
      desiredScene.value = {
        id: describedScene.value.id,
        place: describedScene.value.place,
        content: describedScene.value.content,
      };
    }

    await constellationsStore.ensureForwardCoverage(8);
  }
});

watch(fullPageContainerRef, () => {
  if (fullPageContainerRef.value) {
    recenter();
  }
});


function updateArrowVisibility() {
  const scene = desiredScene.value;
  if (!isMovingToScene.value && !showNeighborArrows.value && scene) {
    const place = scene.place;
    const threshold = (wwt_zoom_deg.value / 60) * 0.05;
    if (distance(wwt_ra_rad.value, wwt_dec_rad.value, place.ra_rad, place.dec_rad) > threshold) {
      showNeighborArrows.value = true;
    }
  }
}

watch(wwt_ra_rad, () => updateArrowVisibility());
watch(wwt_dec_rad, () => updateArrowVisibility());

watch(desiredScene, () => {
  showNeighborArrows.value = false;
});


// Managing the height of the grid items in mobile mode. We need each item to be
// exactly the height of the containing fullPageContainer, but we can't easily
// know that number a-priori because we don't know the effective screen height.
// `100vh` is *not* appropriate because if the browser overlays a toolbar at the
// top or bottom of the screen, that number will include the area obscured by
// the toolbar, so our content would be partially beneath the toolbar with no
// way to reveal it.

const mobile_page_height = ref(600);

useResizeObserver(fullPageContainerRef, (entries) => {
  const entry = entries[0];
  mobile_page_height.value = entry.contentRect.height;
});

// Managing the `viewport*Blockage` state variables that the WWT code uses to
// position the camera center appropriately to avoid the various on-screen
// overlays.

const desktop_overlay = ref<ComponentPublicInstance | null>(null);
// Initializing this setting to the equivalent Pinia value makes it so that we
// don't temporarily reset the offset to zero during page transitions.
const desktop_overlay_width = ref(viewportLeftBlockage.value);

useResizeObserver(desktop_overlay, (entries) => {
  const entry = entries[0];
  desktop_overlay_width.value = entry.contentRect.width;
});

watchEffect(() => {
  if (isMobile.value || props.showSceneEditor) {
    viewportLeftBlockage.value = 0;
  } else {
    viewportLeftBlockage.value = desktop_overlay_width.value;
  }
});

// Right now, the element that we monitor for the mobile overlay size is in a
// `v-for`, so it comes to us as an array of components rather than a singleton.
// Also, since the server-side default is desktop mode, the initial value of the
// ref is null, since the child component is `v-if`ed out of existence.
const mobile_overlay = ref<ComponentPublicInstance[] | null>(null);
const mobile_overlay_height = ref(viewportBottomBlockage.value);

watchEffect(() => {
  if (mobile_overlay.value) {
    useResizeObserver(mobile_overlay.value[0], (entries) => {
      const entry = entries[0];
      if (entry.contentRect.height > 0) {
        mobile_overlay_height.value = entry.contentRect.height;
      }
    });
  }
});

watchEffect(() => {
  if (isMobile.value && !props.showSceneEditor) {
    viewportBottomBlockage.value = mobile_overlay_height.value;
  } else {
    viewportBottomBlockage.value = 0;
  }
});
</script>

<style scoped lang="less">
#feed-root {
  height: 100%;
  --footer-height: 42px;

  // We only set the position to make the z-index relevant
  position: relative;
  z-index: 100;
}

.disable-pe {
  pointer-events: none !important;
}

.desktop-panel {
  padding: 14px;
  width: 440px !important;
  pointer-events: all;
}

.action-button {
  padding: 0;
}

.action-button-label {
  margin-left: 5px;
}

.text-no-decoration {
  text-decoration: none;
}

.text-strong {
  font-weight: bold;
  font-size: medium;
}


.mobile-full-page-container {
  height: calc(100% - var(--footer-height));
  overflow: scroll;
  scroll-snap-type: y mandatory;
}

.mobile-full-page {
  position: absolute;
  display: flex;
  align-items: flex-end;
  scroll-snap-align: start;
  padding-left: 10px;
  padding-right: 10px;
  width: calc(100% - 20px);
}

.bottom-animation {
  transition: bottom 0.2s ease-in;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0.25;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
  transition-delay: 5.25s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
  transition-delay: 5.25s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.25);
  }

  100% {
    transform: scale(1);
  }
}

.bouncy {
  animation: bounce 0.5s;
  animation-direction: alternate;
  animation-iteration-count: 6;
}

@keyframes bounce {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(0, -10px, 0);
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
}


.bounce-x-fade {
  animation: key-bounce-x-fade 3.5s forwards;
}

.bounce-x-fade-reverse {
  animation: key-bounce-x-fade-reverse 3.5s forwards;
}

@keyframes key-bounce-x-fade {
  0% {
    transform: translate3d(0, -50%, 0);
    opacity: 1;
  }

  25% {
    transform: translate3d(10px, -50%, 0);
    opacity: 1;
  }

  50% {
    transform: translate3d(0, -50%, 0);
    opacity: 1;
  }

  75% {
    transform: translate3d(10px, -50%, 0);
    opacity: 1;
  }

  100% {
    transform: translate3d(0, -50%, 0);
    opacity: 0;
    display: none;
  }
}

@keyframes key-bounce-x-fade-reverse {
  0% {
    transform: translate3d(10px, -50%, 0);
    opacity: 1;
  }

  25% {
    transform: translate3d(0, -50%, 0);
    opacity: 1;
  }

  50% {
    transform: translate3d(10px, -50%, 0);
    opacity: 1;
  }

  75% {
    transform: translate3d(0, -50%, 0);
    opacity: 1;
  }

  100% {
    transform: translate3d(10px, -50%, 0);
    opacity: 0;
    display: none;
  }
}


.bounce-y-fade {
  animation: key-bounce-y-fade 3.5s forwards;
}

@keyframes key-bounce-y-fade {
  0% {
    transform: translate3d(-50%, 0, 0);
    opacity: 1;
  }

  25% {
    transform: translate3d(-50%, 10px, 0);
    opacity: 1;
  }

  50% {
    transform: translate3d(-50%, 0, 0);
    opacity: 1;
  }

  75% {
    transform: translate3d(-50% 10px, 0);
    opacity: 1;
  }

  100% {
    transform: translate3d(-50%, 10px, 0);
    opacity: 0;
    display: none;
  }
}

.bounce-y-fade-reverse {
  animation: key-bounce-y-fade-reverse 3.5s forwards;
}

@keyframes key-bounce-y-fade-reverse {
  0% {
    transform: translate3d(-50%, 10px, 0);
    opacity: 1;
  }

  25% {
    transform: translate3d(-50%, 0, 0);
    opacity: 1;
  }

  50% {
    transform: translate3d(-50%, 10px, 0);
    opacity: 1;
  }

  75% {
    transform: translate3d(-50% 0, 0);
    opacity: 1;
  }

  100% {
    transform: translate3d(-50%, 0, 0);
    opacity: 0;
    display: none;
  }
}

.arrow {
  position: fixed;
  z-index: 1001;
}

.arrow-top {
  top: var(--footer-height);
  left: 50%;
  transform: translate(-50%, 0);
}

.arrow-bottom {
  bottom: calc(20px + var(--footer-height));
  left: 50%;
  transform: translate(-50%, 0);
}

.arrow-left {
  top: 50%;
  left: 20px;
  transform: translate(0, -50%);
}

.arrow-right {
  top: 50%;
  right: 20px;
  transform: translate(0, -50%);
}

#toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--footer-height);
  background-color: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  pointer-events: all !important;
  z-index: 100;
}

.button-toggled {
  background-color: var(--n-text-color-pressed) !important;
  color: var(--n-text-color) !important;
}

.nav-bg {
  background: rgba(0, 0, 0, 0.8);
  padding: 5px;
  border-radius: 45px;
}

.center-button {
  bottom: calc(60px + var(--footer-height));
  left: 50%;
  transform: translate(-50%, 0);
  position: absolute;
  pointer-events: all;
}

@keyframes arrow-color-cycle {

  16.7%,
  50% {
    color: rgb(191, 243, 226);
  }

  33% {
    color: #7fe7c4;
  }

  66%,
  100% {
    color: white;
  }
}

.neighbor-arrow {
  position: fixed;
  pointer-events: auto;
  padding: 0px;
  z-index: -1000;

  &:hover svg {
    g {
      animation: arrow-color-cycle;
      animation-duration: 0.45s;
      animation-iteration-count: infinite;
    }

    g:nth-child(3) {
      animation-delay: 0.3s;
    }

    g:nth-child(4) {
      animation-delay: 0.15s;
    }

    g:nth-child(5) {
      animation-delay: 0s;
    }
  }

}
</style>
