<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }" ref="feedRootRef">
    <!-- Desktop -->
    <template v-if="!isMobile">
      <n-grid ref="desktop_overlay" cols="1" y-gap="2" class="desktop-panel">
        <n-grid-item v-if="describedHandle">
          <HandlePanel :handle-data="describedHandle" />
        </n-grid-item>
        <n-grid-item>
          <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
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
        <div class="mobile-full-page-container" v-on:scroll.passive="onScroll" ref="fullPageContainerRef">
          <n-grid cols="1">
            <n-grid-item class="mobile-full-page" v-for="scene in contextScenes"
              :style="{ 'height': mobile_page_height + 'px' }">
              <transition name="fade" appear>
                <ScenePanel :class="{ bouncy: showSwipeAnimation }" v-if="scene.currentlyShown" :scene="scene"
                  :potentially-editable="scenePotentiallyEditable" ref="mobile_overlay" />
              </transition>
            </n-grid-item>
          </n-grid>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  NButton,
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
  futureScenes,
  historyIndex,
  timelineIndex,
  viewportBottomBlockage,
  viewportLeftBlockage,
  isMovingToScene
} = storeToRefs(constellationsStore);

// The list of scenes shown in the skymap
// TODO: What exactly do we want in this?

const CURRENT_SCENE_COLOR = Color.fromArgb(255, 37, 232, 166);
const NEXT_SCENE_COLOR = Color.fromArgb(255, 31, 191, 137);
const GENERAL_SCENE_COLOR = Color.fromArgb(255, 111, 111, 122);
const skymapScenes = computed<SkymapSceneInfo[]>(() => {

  const currentSceneArr: GetSceneResponseT[] = describedScene.value != null ? [describedScene.value] : [];
  console.log(currentSceneArr);
  console.log(currentSceneArr.concat(futureScenes.value.slice(0,5)));
  return currentSceneArr.concat(futureScenes.value.slice(0, 5)).map((s, relIndex) => {
    const color = (relIndex === 0) ? CURRENT_SCENE_COLOR : (relIndex === 1 ? NEXT_SCENE_COLOR : GENERAL_SCENE_COLOR);
    console.log(s);
    return {
      id: s.id,
      content: s.content,
      place: s.place,
      color,
      linewidth: relIndex ? 1 : 2 
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
  const history = sceneHistory.value;
  const index = historyIndex.value;
  const future = futureScenes.value;

  console.log(index);
  return history.concat(future).map((scene, itemIndex) => {
    const currentlyShown = (index === itemIndex);
    console.log({ currentlyShown, itemIndex, ...scene });
    return { currentlyShown, itemIndex, ...scene };
  });
});

const showSwipeAnimation = ref(false);
const swipeAnimationTimer = ref<NodeJS.Timer | undefined>(undefined);
const fullPageContainerRef = ref<HTMLDivElement>();
const feedRootRef = ref<HTMLDivElement>();

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
    showSwipeAnimation.value = timelineIndex.value == 0 && !showSwipeAnimation.value;
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

onBeforeUnmount(() => {
  clearInterval(swipeAnimationTimer.value);
});

function onItemSelected(sceneInfo: SceneDisplayInfoT) {
  const index = skymapScenes.value.findIndex(scene => scene.id === sceneInfo.id); 
  if (index >= 0) {
    constellationsStore.moveForward(index);
  } else {
    constellationsStore.moveToScene(sceneInfo.id);
  }
}

function onScroll(event: UIEvent) {
  console.log("onScroll");
  const target = event.target as HTMLDivElement;
  console.log(target);
  if (target) {
    console.log(target.scrollTop, target.offsetHeight);
    const n = Math.round(target.scrollTop / (target.offsetHeight));
    console.log(`n: ${n}`);
    constellationsStore.moveForward(n);
  }
}

function scrollTo(index: number) {
  console.log(`scrollTo: ${index}`);
  if (fullPageContainerRef.value) {
    const element = fullPageContainerRef.value as HTMLDivElement;
    if (element) {
      element.scrollTop = Math.round(index * (element.offsetHeight));
    }
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

watch(historyIndex, async () => {
  if (historyIndex.value >= 0) {
    describedScene.value = sceneHistory.value[historyIndex.value];
    if (describedScene.value) {
      desiredScene.value = {
        id: describedScene.value.id,
        place: describedScene.value.place,
        content: describedScene.value.content
      };
    }

    await constellationsStore.ensureForwardCoverage(8);
  }
});

watch(fullPageContainerRef, () => {
  if (fullPageContainerRef.value) {
    scrollTo(historyIndex.value);
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
  display: flex;
  align-items: flex-end;
  scroll-snap-align: start;
  padding-left: 10px;
  padding-right: 10px;
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
