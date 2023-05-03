<template>
  <div id="feed-root">
    <ClientOnly>
      <!-- Desktop -->
      <template v-if="!mobile">
        <n-grid cols="1" y-gap="5" style="position: absolute; top: 0; padding: 14px; width: 440px;">
          <n-grid-item v-if="timelineSource !== null">
            <Skymap :scenes="skymapScenes" @selected="onItemSelected" />
          </n-grid-item>
          <n-grid-item v-if="describedScene">
            <ScenePanel :scene="describedScene" />
          </n-grid-item>
        </n-grid>
      </template>
      <!-- Mobile -->
      <template v-else>
        <div class="full-page-container" v-on:scroll.passive="onScroll">
          <n-grid cols="1">
            <n-grid-item class="full-page" v-for="(scene, index) in knownScenes.values()">
              <transition name="fade" appear>
                <ScenePanel :class="{ bouncy: showSwipeAnimation }" v-if="index == timelineIndex" :scene="scene" />
              </transition>
            </n-grid-item>
          </n-grid>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  NGrid,
  NGridItem
} from "naive-ui";
import { storeToRefs } from "pinia";
import { nextTick } from "vue";

import { useConstellationsStore } from "~/stores/constellations";
import { SceneDisplayInfoT } from "~/utils/types";

defineProps<{
  mobile?: boolean,
}>();

const constellationsStore = useConstellationsStore();
const {
  describedScene,
  desiredScene,
  knownScenes,
  timeline,
  timelineIndex,
  timelineSource,
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
const timer = ref<NodeJS.Timer | undefined>(undefined);

onMounted(() => {
  if (timelineSource.value !== null) {
    nextTick(() => {
      constellationsStore.ensureTimelineCoverage(8);
    });
  }

  timer.value = setInterval(() => {
    showSwipeAnimation.value = timelineIndex.value == 0 && !showSwipeAnimation.value;
  }, 5000);
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
});

function onItemSelected(index: number) {
  timelineIndex.value = index;
}

function onScroll(event: UIEvent) {
  const target = event.target as HTMLDivElement;
  if (target) {
    const index = Math.round(target.scrollTop / target.offsetHeight);
    onItemSelected(index);
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
</script>

<style scoped lang="less">
#feed-root {
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
  height: 100vh;
  overflow: scroll;
  scroll-snap-type: y mandatory;
}

.full-page {
  display: flex;
  height: 100vh;
  align-items: flex-end;
  scroll-snap-align: start;
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
</style>