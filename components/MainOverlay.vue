<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }" ref="feedRootRef">
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
  KeyboardArrowDownFilled,
  KeyboardArrowUpFilled,
  KeyboardArrowLeftFilled,
  KeyboardArrowRightFilled,
} from "@vicons/material";

import { useConstellationsStore } from "~/stores/constellations";
import { GetHandleResponseT, GetSceneResponseT } from "~/utils/apis";
import { SceneDisplayInfoT, SkymapSceneInfo } from "~/utils/types";

import { useSwipe } from "@vueuse/core";

import { Color } from "@wwtelescope/engine";

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

const showSwipeAnimation = ref(false);
const swipeAnimationTimer = ref<NodeJS.Timer | undefined>(undefined);
const fullPageContainerRef = ref<HTMLDivElement>();
const feedRootRef = ref<HTMLDivElement>();
const mobileScenePanelRef = ref<HTMLDivElement>();

const targetOutsideViewport = ref(false);

const engineStore = getEngineStore();
const {
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
        const screenPoint = engineStore.findScreenPointForRADec({ ra: place.ra_rad * R2D, dec: place.dec_rad * R2D })
        targetOutsideViewport.value = (screenPoint.x < 0 || screenPoint.x > rootDiv.clientWidth
          || screenPoint.y < 0 || screenPoint.y > rootDiv.clientHeight);
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
</style>
