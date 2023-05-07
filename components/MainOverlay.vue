<template>
  <div id="feed-root" :class="{ 'disable-pe': isExploreMode }">
    <!-- Desktop -->
    <template v-if="!isMobile">
      <n-grid cols="1" y-gap="5" style="position: absolute; top: 0; padding: 14px; width: 440px;">
        <n-grid-item v-if="timelineSource !== null">
          <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
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
        <n-space justify="space-around" size="large" style="padding: 10px;">
          <n-button :on-click="() => navigateTo('/')">
            <template #icon>
              <n-icon size="25">
                <HomeFilled />
              </n-icon>
            </template>
          </n-button>
          <n-button-group>
            <n-button @click="isExploreMode = false" round :class="{ 'button-toggled': !isExploreMode }">
              <template #icon>
                <n-icon size="25">
                  <SwipeVerticalFilled />
                </n-icon>
              </template>
            </n-button>
            <n-button @click="isExploreMode = true" round :class="{ 'button-toggled': isExploreMode }">
              <template #icon>
                <n-icon size="25">
                  <ZoomOutMapFilled style="transform: rotate(45deg);" />
                </n-icon>
              </template>
            </n-button>
          </n-button-group>
          <n-button>
            <template #icon>
              <n-icon size="25">
                <PersonFilled />
              </n-icon>
            </template>
          </n-button>
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
            <n-grid-item class="full-page" v-for="(scene, index) in knownScenes.values()">
              <transition name="fade" appear>
                <ScenePanel :class="{ bouncy: showSwipeAnimation }" v-if="index == timelineIndex" :scene="scene"
                  :potentially-editable="scenePotentiallyEditable" />
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
  NSpace,
  NButtonGroup,
  NButton,
} from "~/utils/fixnaive.mjs";

import { storeToRefs } from "pinia";
import { nextTick, ref } from "vue";

import { useConstellationsStore } from "~/stores/constellations";
import { SceneDisplayInfoT } from "~/utils/types";
import {
  HomeFilled, SwipeVerticalFilled, ZoomOutMapFilled, PersonFilled,
  KeyboardArrowDownFilled, KeyboardArrowUpFilled, KeyboardArrowLeftFilled, KeyboardArrowRightFilled
} from "@vicons/material";

withDefaults(defineProps<{
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
  knownScenes,
  timeline,
  timelineIndex,
  timelineSource
} = storeToRefs(constellationsStore);

const skymapScenes = computed<SceneDisplayInfoT[]>(() => {
  const i0 = Math.max(timelineIndex.value - 5, 0);
  const i1 = Math.min(timelineIndex.value + 6, timeline.value.length);
  return timeline.value.slice(i0, i1).map((id, relIndex) => {
    const scene = knownScenes.value.get(id)!;
    return { itemIndex: i0 + relIndex, place: scene.place, content: scene.content };
  });
});

const showSwipeAnimation = ref(false);
const swipeAnimationTimer = ref<NodeJS.Timer | undefined>(undefined);
const fullPageContainerRef = ref(null);

onMounted(() => {
  if (timelineSource.value !== null) {
    nextTick(() => {
      constellationsStore.ensureTimelineCoverage(8);
    });
  }

  swipeAnimationTimer.value = setInterval(() => {
    showSwipeAnimation.value = timelineIndex.value == 0 && !showSwipeAnimation.value;
  }, 10000);
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


function scrollTo(element: HTMLDivElement, index: number) {
  if (element) {
    element.scrollTop = Math.round(index * (element.offsetHeight));
  }
}

function centerScene() {
  const scene = desiredScene.value;
  desiredScene.value = null;
  nextTick(() => {
    desiredScene.value = scene;
  })
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
    const el = fullPageContainerRef.value as HTMLDivElement
    scrollTo(el, timelineIndex.value);
    centerScene();
  }
});

</script>

<style scoped lang="less">
#feed-root {
  height: 100%;
  pointer-events: all;
  --footer-height: 60px;
}

.disable-pe {
  pointer-events: none !important;
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
  height: calc(100vh - var(--footer-height));
  overflow: scroll;
  scroll-snap-type: y mandatory;
}

.full-page {
  display: flex;
  height: calc(100vh - var(--footer-height));
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
</style>