<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }" ref="feedRootRef">
    <ClientOnly>
      <n-button v-if="showNeighborArrows" v-for="n in neighborArrows" class="neighbor-arrow" :bordered="false"
        @click="clickNeighbor(n.sceneId)" :style="n.style">
        <n-icon size="36" color="#8acbec">
          <svg version="1.1" width="341.34344" height="341.34344" viewBox="0 0 341.34344 341.34344" xml:space="preserve"
            id="svg2" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
            <defs id="defs1"></defs>
            <circle cx="170.67172" cy="-170.67172" r="126.45"
              style="fill:#48484e;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:2.81;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none"
              id="circle1" transform="rotate(90)" />
            <path
              d="m 262.66551,170.97521 c 0,10.0879 -8.1771,18.265 -18.265,18.265 H 96.945752 c -10.0879,0 -18.265,-8.1771 -18.265,-18.265 0,-10.0879 8.1771,-18.265 18.265,-18.265 H 244.40051 c 10.0879,0 18.265,8.1771 18.265,18.265 z"
              style="fill:#ffffff;fill-rule:nonzero;stroke:none;stroke-width:2.81;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none"
              stroke-linecap="round" id="path1" />
            <path
              d="m 262.66551,170.67173 c 0,4.67584 -1.78435,9.34887 -5.34743,12.91476 l -53.94919,53.952 c -7.13459,7.13459 -18.69774,7.13459 -25.82952,0 -7.13459,-7.13178 -7.13178,-18.69774 -0.003,-25.82952 l 41.03162,-41.03724 -41.03443,-41.03443 c -7.12897,-7.13459 -7.12897,-18.69774 0,-25.83233 7.13459,-7.131785 18.69774,-7.131785 25.83233,0 l 53.94919,53.952 c 3.56589,3.56308 5.35024,8.24173 5.35024,12.91476 z"
              style="fill:#ffffff;fill-rule:nonzero;stroke:none;stroke-width:2.81;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none"
              stroke-linecap="round" id="path2" />
            <circle
              style="fill:none;fill-opacity:1;stroke:currentColor;stroke-width:24;stroke-linejoin:round;stroke-dasharray:none"
              id="path3" cx="170.67172" cy="170.67172" r="158.67172" />
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
import { useResizeObserver, useSwipe } from "@vueuse/core";
import {
  KeyboardArrowDownFilled,
  KeyboardArrowUpFilled,
  KeyboardArrowLeftFilled,
  KeyboardArrowRightFilled,
} from "@vicons/material";

import { Color } from "@wwtelescope/engine";

import { useConstellationsStore } from "~/stores/constellations";
import type { GetHandleResponseT, GetSceneResponseT } from "~/utils/apis";
import type { PlaceDetailsT, SceneDisplayInfoT, SkymapSceneInfo } from "~/utils/types";

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


// Ensure that we're always looking at something. The different page
// components are responsible for setting the timeline type.

onMounted(() => {
  nextTick(async () => {
    await constellationsStore.ensureForwardCoverage(8);

    if (describedScene.value === null) {
      await constellationsStore.moveForward();
    }
  });
});


// Viewport management

const engineStore = getEngineStore();

const {
  raRad: wwt_ra_rad,
  decRad: wwt_dec_rad,
  rollRad: wwt_roll_rad,
  zoomDeg: wwt_zoom_deg,
} = storeToRefs(engineStore);

interface Point {
  x: number;
  y: number;
}

const feedRootRef = ref<HTMLDivElement>();
const feedRootWidth = ref(0);
const feedRootHeight = ref(0);

useResizeObserver(feedRootRef, (entries) => {
  const entry = entries[0];
  feedRootWidth.value = entry.contentRect.width;
  feedRootHeight.value = entry.contentRect.height;
});

const viewportWidth = feedRootWidth;

// On desktop, the effective height of the viewport has to be adjusted to
// factor in the top padding. This magic hardcoded number is set in th
// CSS in `default.vue`.
const desktopPaddingTop = 32;

const viewportHeight = computed(() => {
  return feedRootHeight.value + (isMobile.value ? 0 : desktopPaddingTop);
});

function raDecToXY(place: PlaceDetailsT): Point {
  // Reference the viewport parameters so that Vue knows to recompute this value
  // if anything changes.
  const _hack = (
    wwt_ra_rad.value +
    wwt_dec_rad.value +
    wwt_roll_rad.value +
    wwt_zoom_deg.value +
    viewportWidth.value +
    viewportHeight.value
  );

  return engineStore.findScreenPointForRADec({
    ra: place.ra_rad * R2D,
    dec: place.dec_rad * R2D
  });
}

function isOutsideViewport(place: PlaceDetailsT): boolean {
  const point = raDecToXY(place);
  return viewportWidth.value > 0 && (
    (point.x < 0 || point.x > viewportWidth.value) ||
    (point.y < 0 || point.y >= viewportHeight.value)
  );
}

const targetOutsideViewport = ref(false);

engineStore.$subscribe(() => {
  const place = describedScene.value?.place;

  if (place) {
    try {
      // When we're in the midst of moving, we disable outside-of-viewport effects.
      targetOutsideViewport.value = !isMovingToScene.value && isOutsideViewport(place);
    } catch {
      // The above function can sometimes throw an exception (TypeError:
      // matrix1 is undefined) if one of the WWT engine is just starting up.
      // We should fix the API not to do that, but in the meantime, silence
      // the issue.
    }
  }
});


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


// "Neighbor arrows" for spatial navigation.

// Whether we show the arrows at all is set by our standard "outside of
// viewport" computation.
const showNeighborArrows = targetOutsideViewport;

// The list of all neighbor scenes is obtained by querying a tessellation. TODO:
// when we're looking at a particular handle's feed, we could/should have a
// tessellation specific to that handle. Right now we don't compute those,
// though.
const allNeighborScenes = computedAsync<GetSceneResponseT[]>(async () => {
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
},
  [] // The initial value, used while the async computation is evaluating
);

// Now we have to go from that list of neighbor scenes to a list of arrows that
// we might display in the UI.

const HALF_PI = 0.5 * Math.PI;
const TWO_PI = 2 * Math.PI;

interface NeighborArrow {
  sceneId: string;
  style: Record<string, any>;
}

const neighborArrows = computed<NeighborArrow[]>(() => {
  // Prerequisites to do anything useful.

  const currentScene = desiredScene.value;

  if (currentScene === null || viewportWidth.value <= 0 || !showNeighborArrows.value) {
    return [];
  }

  // Given an X/Y position, determine a CSS style for an arrow to point to it.
  // Note that we do all of our work in X/Y pixel coordinates, ignoring the
  // geometry of the sphere.

  const currentScenePoint = raDecToXY(currentScene.place);
  const cameraPoint = { x: viewportWidth.value / 2, y: viewportHeight.value / 2 };
  const mobileHeaderHeight = 38; // XXXX hardcoding!!!! pixels
  const buttonBarHeight = 42; // XXXX hardcoding!!!! pixels
  const scenePanelPadding = 8; // XXXX hardcoding!!!! pixels
  const arrowSize = 36; // pixels
  const margin = 4; // pixels

  if (isMobile.value) {
    cameraPoint.y -= 0.5 * (viewportBottomBlockage.value - mobileHeaderHeight);
  }

  const styleForPoint = (point: Point): Record<string, any> => {
    // Calculate the proper rotation of this arrow. This formula looks a bit
    // weird! CSS rotations are clockwise, and an angle of zero results in an
    // arrow pointing to the right. We switch the relative ordering of
    // currentPoint and scenePoint between x and y to account for the fact that
    // y coordinates move downward on the screen. The overall negative sign
    // accounts for the different parity of CSS and pixel rotations. Since atan2
    // uses the signs of x and y to determine the angle quadrant, best to just
    // use an overall sign.

    const angle = -Math.atan2(cameraPoint.y - point.y, point.x - cameraPoint.x);

    // To figure out the proper position, we need to draw a line from the camera
    // to the point, stopping whenever we hit the viewport edge.
    //
    // The proper bounds of the full-screen display are stored in viewportWidth
    // and viewportHeight. On top of those bounds, we add a margin, and may also
    // need to account for viewport blockages. In mobile we shrink the effective
    // viewport so the arrows don't slide under other overlays. Finally, for the
    // right and bottom edges, we need to subtract arrowSize to account for the
    // way that the arrow appears relative to its specified location.
    //
    // To actually compute the right position, consider a parametric equation
    // for a line from A (the camera point) to B (the target point). Express A
    // and B as 2D vectors and parametrize with t \in [0, 1]:
    //
    // P(t)  =  A + t * (B - A)  =  (1 - t) * A + t * B
    //
    // To "stop" at, say, x = edge_x, we solve for t such that
    //
    // edge_x = A_x + t * (B_x - A_x)  =>  t = (A_x - edge_x) / (A_x - B_x)
    //
    // Given a set of edges, the smallest non-negative value of t identifies the
    // first edge that we hit.

    const x0 = margin;
    const y0 = margin + (isMobile.value ? mobileHeaderHeight : 0);
    const x1 = viewportWidth.value - (margin + arrowSize);
    let y1 = viewportHeight.value - (margin + arrowSize);

    if (isMobile.value) {
      y1 -= buttonBarHeight;

      if (!isExploreMode.value) {
        y1 -= viewportBottomBlockage.value + scenePanelPadding;
      }
    }

    const tx0 = (cameraPoint.x - x0) / (cameraPoint.x - point.x);
    const tx1 = (cameraPoint.x - x1) / (cameraPoint.x - point.x);
    const ty0 = (cameraPoint.y - y0) / (cameraPoint.y - point.y);
    const ty1 = (cameraPoint.y - y1) / (cameraPoint.y - point.y);
    const ts = [tx0, tx1, ty0, ty1].filter(t => t >= 0 && t <= 1).sort();

    if (ts.length > 0) {
      const t = ts[0];
      let x = Math.round(((1 - t) * cameraPoint.x) + t * point.x);
      let y = Math.round(((1 - t) * cameraPoint.y) + t * point.y);

      // Clamp just in case
      x = Math.max(Math.min(x, x1), x0);
      y = Math.max(Math.min(y, y1), y0);

      return {
        transform: `rotate(${angle}rad)`,
        left: `${x}px`,
        top: `${y}px`,
      };
    } else {
      // TODO: we might get here if the target point is actually in the
      // viewport. In that case, we could show an icon for it in its actual
      // position, or something.
      return { visibility: 'hidden' };
    }
  };

  // That's sufficient to provide an arrow back to "home".

  const arrows: NeighborArrow[] = [
    { sceneId: currentScene.id, style: styleForPoint(currentScenePoint) },
  ];

  // For the neighbors, we use "effective" points: we basically clamp the length
  // of the vector between the current scene and the neighbor scene to not be
  // "too large". This way, as you pan around the indicator arrows move
  // pleasingly, even though when you're zoomed in the neighbor scenes are
  // usually so far away that they really ought to be basically stationary.

  // Size of the full viewport diagonal, in pixels, squared:
  const viewportsq = viewportWidth.value ** 2 + viewportHeight.value ** 2;

  // Size of the offset between the current viewport center (the camera point)
  // and the current scene, in pixels, squared:
  const offsetsq = (cameraPoint.x - currentScenePoint.x) ** 2 + (cameraPoint.y - currentScenePoint.y) ** 2;

  // The yardstick we use to determine whether a point is far away, measured in
  // pixels, squared. This particular combination of the previous two values is
  // basically arbitrary.
  const effectivePointYardstickSq = viewportsq + offsetsq;

  // Our clamping distance, in units of the yardstick, squared. So 25 means
  // that we clamp the effective vector length at 5 times the yardstick length.
  const effectivePointFactor = 25;

  // That's everything we need to efficiently compute "effective" points.
  const computeEffectivePoint = (point: Point): Point => {
    let dx = point.x - currentScenePoint.x;
    let dy = point.y - currentScenePoint.y;
    const ratio = (dx ** 2 + dy ** 2) / effectivePointYardstickSq;

    if (ratio > effectivePointFactor) {
      const f = Math.sqrt(effectivePointFactor / ratio);
      dx *= f;
      dy *= f;
    }

    point.x = currentScenePoint.x + dx;
    point.y = currentScenePoint.y + dy;
    return point;
  };

  // The effective list of neighbor scenes filters the "all" list to only contain
  // the ones that are "in the direction of" the current camera position, relative
  // to the current (desired) scene position. That way, if we start scrolling
  // right, we won't suddenly get arrows telling us to go left. One could
  // imagine being picky about the precise definition of "in the direction of",
  // but a basic half-plane cutoff should work OK.

  const offsetAngle = Math.atan2(
    cameraPoint.y - currentScenePoint.y,
    cameraPoint.x - currentScenePoint.x
  );

  for (const n of allNeighborScenes.value) {
    const point = raDecToXY(n.place);
    const angle = Math.atan2(point.y - currentScenePoint.y, point.x - currentScenePoint.x);

    // Since we're differencing angles, we have to normalize before comparing magnitudes.
    let delta = angle - offsetAngle;

    while (delta > Math.PI) {
      delta -= TWO_PI;
    }

    while (delta < -Math.PI) {
      delta += TWO_PI;
    }

    if (Math.abs(delta) < HALF_PI) {
      // This neighbor is accepted -- give it an arrow.
      arrows.push({ sceneId: n.id, style: styleForPoint(computeEffectivePoint(point)) });
    }
  }

  return arrows;
});

async function clickNeighbor(targetSceneId: string) {
  await constellationsStore.useNearbyTimeline(targetSceneId);
  await navigateTo("/");
}


// The swipe interaction to move to the next scene.

const showSwipeAnimation = ref(false);
const swipeAnimationTimer = ref<NodeJS.Timer | undefined>(undefined);
const fullPageContainerRef = ref<HTMLDivElement>();
const mobileScenePanelRef = ref<HTMLDivElement>();

const hasNext = computed<boolean>(() => futureScenes.value.length > 0 ||
  (sceneHistory.value.length > 0 && !!currentHistoryNode.value?.next));

onMounted(() => {
  showSwipeAnimation.value = false;

  swipeAnimationTimer.value = setInterval(() => {
    showSwipeAnimation.value = hasNext.value && !showSwipeAnimation.value;
  }, 10000);
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

      if (lengthY.value > fullPageContainerRef.value.offsetHeight * 0.2 && hasNext.value) {
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


// Various user interactions

async function onItemSelected(sceneInfo: SceneDisplayInfoT) {
  const index = skymapScenes.value.findIndex(scene => scene.id === sceneInfo.id);
  if (index < 0) {
    await constellationsStore.useNearbyTimeline(sceneInfo.id);
  } else {
    await constellationsStore.moveHistoryToScene(sceneInfo.id);
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

watch(
  fullPageContainerRef,
  (newRef) => {
    if (newRef) {
      recenter();
    }
  },
  { immediate: true }
);


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

watch(
  [isMobile, desktop_overlay_width],
  ([newIsMobile, newDesktopOverlayWidth]) => {
    if (newIsMobile || props.showSceneEditor) {
      viewportLeftBlockage.value = 0;
    } else {
      viewportLeftBlockage.value = newDesktopOverlayWidth;
    }
  },
  { immediate: true }
);

// For the mobile case, since the server-side default is desktop mode, the
// initial value of the ref is null, because the child component is `v-if`ed out
// of existence.
const mobile_overlay = ref<ComponentPublicInstance | null>(null);
const mobile_overlay_height = ref(viewportBottomBlockage.value);

watch(
  mobile_overlay,
  (newMobileOverlay) => {
    if (newMobileOverlay) {
      useResizeObserver(newMobileOverlay, (entries) => {
        const entry = entries[0];
        if (entry.contentRect.height > 0) {
          mobile_overlay_height.value = entry.contentRect.height;
        }
      });
    }
  },
  { immediate: true }
);

watch(
  [isMobile, mobile_overlay_height],
  ([newIsMobile, newMobileOverlayHeight]) => {
    if (newIsMobile && !props.showSceneEditor) {
      viewportBottomBlockage.value = newMobileOverlayHeight;
    } else {
      viewportBottomBlockage.value = 0;
    }
  },
  { immediate: true }
);
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

@keyframes pulse-arrow-color {
  0% {
    color: #8acbec;
  }

  10% {
    color: #8acbec;
  }

  85% {
    color: #215276;
  }

  100% {
    color: #215276;
  }
}

.neighbor-arrow {
  position: fixed;
  pointer-events: auto;
  padding: 0px;
  z-index: -1000;

  svg {
    circle:nth-child(5) {
      animation: pulse-arrow-color 1.6s alternate infinite;
    }
  }
}
</style>
