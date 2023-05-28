<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }" ref="feedRootRef">
    <!-- Desktop -->
    <template v-if="!isMobile">
      <n-grid ref="desktop_overlay" cols="1" y-gap="5" class="desktop-panel">
        <n-grid-item v-if="timelineSource !== null">
          <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
        </n-grid-item>
        <n-grid-item v-if="describedScene">
          <SceneEditorPanel v-if="showSceneEditor" :scene="describedScene" />
          <ScenePanel v-else :scene="describedScene" :potentially-editable="scenePotentiallyEditable" />
        </n-grid-item>
        <n-grid-item>
          <div>
            <n-space justify="center">
              <Toolbar @goPrev="goPrev" @goNext="goNext" @centerScene="recenter" :isCenterButtonEnabled="targetOutsideViewport"/>
            </n-space>
          </div>
        </n-grid-item>
      </n-grid>
    </template>
    <!-- Mobile -->
    <template v-else>
      <div id="toolbar">
        <n-space justify="space-around" size="large" style="padding: 10px;">
          <Toolbar @goPrev="goPrev" @goNext="goNext" @setExploreMode="(iem: boolean) => isExploreMode = iem"
            :isExploreMode="isExploreMode" @centerScene="recenter" :isCenterButtonEnabled="targetOutsideViewport"/>
        </n-space>
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
        <div class="full-page-container" v-on:scroll.passive="onScroll" ref="fullPageContainerRef">
          <n-grid cols="1">
            <n-grid-item class="full-page" v-for="(scene, index) in knownScenes.values()"
              :style="{ 'height': mobile_page_height + 'px' }">
              <transition name="fade" appear>
                <ScenePanel :class="{ bouncy: showSwipeAnimation }" v-if="index == timelineIndex" :scene="scene"
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
  NGrid,
  NGridItem,
  NIcon,
  NSpace
} from "~/utils/fixnaive.mjs";

import { storeToRefs } from "pinia";
import { nextTick, ref } from "vue";
import { useResizeObserver } from "@vueuse/core";

import { useConstellationsStore } from "~/stores/constellations";
import { SceneDisplayInfoT } from "~/utils/types";
import {
  KeyboardArrowDownFilled, KeyboardArrowUpFilled, KeyboardArrowLeftFilled, KeyboardArrowRightFilled
} from "@vicons/material";

const props = withDefaults(defineProps<{
  scenePotentiallyEditable?: boolean,
  showSceneEditor?: boolean,
}>(), {
  scenePotentiallyEditable: false,
  showSceneEditor: false,
});

const isExploreMode = ref(false);

const constellationsStore = useConstellationsStore();
const {
  describedScene,
  desiredScene,
  isMobile,
  knownScenes,
  timeline,
  timelineIndex,
  timelineSource,
  viewportBottomBlockage,
  viewportLeftBlockage,
} = storeToRefs(constellationsStore);

const skymapScenes = computed<any[]>(() => {
  const i0 = Math.max(timelineIndex.value - 5, 0);
  const i1 = Math.min(timelineIndex.value + 6, timeline.value.length);
  return timeline.value.slice(i0, i1).map((id, relIndex) => {
    const scene = knownScenes.value.get(id)!;
    return { id: id, itemIndex: i0 + relIndex, place: scene.place, content: scene.content };
  });
});

const hasNext = computed<boolean>(() => (timelineIndex.value < (knownScenes.value.size - 1)));
const hasPrev = computed<boolean>(() => (timelineIndex.value > 0));

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
  if (timelineSource.value !== null) {
    nextTick(() => {
      constellationsStore.ensureTimelineCoverage(8);
    });
  }

  swipeAnimationTimer.value = setInterval(() => {
    showSwipeAnimation.value = timelineIndex.value == 0 && !showSwipeAnimation.value;
  }, 10000);

  engineStore.$subscribe(() => {
    const place = describedScene.value?.place
    const rootDiv = feedRootRef.value
    if (place && rootDiv) {
      const screenPoint = engineStore.findScreenPointForRADec({ ra: place.ra_rad * R2D, dec: place.dec_rad * R2D })

      targetOutsideViewport.value = (screenPoint.x < 0 || screenPoint.x > rootDiv.clientWidth
        || screenPoint.y < 0 || screenPoint.y > rootDiv.clientHeight);
    }

  });
});

onBeforeUnmount(() => {
  clearInterval(swipeAnimationTimer.value);
});

function onItemSelected(index: number) {
  timelineIndex.value = index;
}

function onScroll(event: UIEvent) {
  const target = event.target as HTMLDivElement;
  if (target) {
    const index = Math.round(target.scrollTop / (target.offsetHeight));
    onItemSelected(index);
  }
}

function scrollTo(index: number) {
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

function centerScene() {
  getEngineStore().gotoTarget
  const scene = desiredScene.value;
  desiredScene.value = null;
  nextTick(() => {
    desiredScene.value = scene;
  })
}

function goNext() {
  if (hasNext) {
    scrollTo(++timelineIndex.value);
  }
}

function goPrev() {
  if (hasPrev) {
    scrollTo(--timelineIndex.value);
  }
}

watchEffect(async () => {
  if (timelineIndex.value >= 0) {
    const id = timeline.value[timelineIndex.value];
    describedScene.value = knownScenes.value.get(id)!;

    if (describedScene.value) {
      desiredScene.value = {
        place: describedScene.value.place,
        content: describedScene.value.content,
      };
    }

    await constellationsStore.ensureTimelineCoverage(8);
  }
});

watch(fullPageContainerRef, () => {
  if (fullPageContainerRef.value) {
    scrollTo(timelineIndex.value);
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
  --footer-height: 60px;
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


.full-page-container {
  height: calc(100% - var(--footer-height));
  overflow: scroll;
  scroll-snap-type: y mandatory;
  pointer-events: all;
}

.full-page {
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