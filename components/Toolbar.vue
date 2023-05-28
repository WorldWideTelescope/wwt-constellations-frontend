<template>
    <n-row class="nav-panel">
        <n-button-group>
            <n-button id="prev-button" @click="$emit('goPrev')" aria-label="Go previous button" round :disabled="!hasPrev">
                <template #icon>
                    <n-icon size="25" aria-labelledby="prev-button">
                        <NavigateBeforeRound />
                    </n-icon>
                </template>
            </n-button>
            <n-button id="feed-button" @click="$emit('setExploreMode', false)" v-if="isMobile"
                :class="{ 'button-toggled': !isExploreMode }" aria-label="Feed button">
                <template #icon>
                    <n-icon size="25" aria-labelledby="feed-button">
                        <SwipeVerticalFilled />
                    </n-icon>
                </template>
            </n-button>
            <transition name="smooth">
                <n-button class="center-button" @click="$emit('centerScene')" v-if="isCenterButtonEnabled" round>
                    <template #icon>
                        <n-icon size="30">
                            <CenterFocusWeakFilled />
                        </n-icon>
                    </template>
                </n-button>
            </transition>
            <n-button id="explore-button" @click="$emit('setExploreMode', true)" v-if="isMobile"
                :class="{ 'button-toggled': isExploreMode }" aria-label="Explore button">
                <template #icon>
                    <n-icon size="25" aria-labelledby="explore-button">
                        <ZoomOutMapFilled style="transform: rotate(45deg);" />
                    </n-icon>
                </template>
            </n-button>
            <n-button id="next-button" @click="$emit('goNext')" aria-label="Go next button" round :disabled="!hasNext">
                <template #icon>
                    <n-icon size="25" aria-labelledby="next-button">
                        <NavigateNextRound />
                    </n-icon>
                </template>
            </n-button>
        </n-button-group>
    </n-row>
</template>


<script setup lang="ts">

import {
    NRow,
    NButtonGroup,
    NButton,
    NIcon,
} from "~/utils/fixnaive.mjs";

import {
    NavigateNextRound, NavigateBeforeRound, SwipeVerticalFilled, ZoomOutMapFilled, CenterFocusWeakFilled
} from "@vicons/material";

import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();

const {
    isMobile,
    knownScenes,
    timelineIndex
} = storeToRefs(constellationsStore);

const hasNext = computed<boolean>(() => (timelineIndex.value < (knownScenes.value.size - 1)));
const hasPrev = computed<boolean>(() => (timelineIndex.value > 0));

withDefaults(defineProps<{
    isExploreMode?: boolean,
    isCenterButtonEnabled?: boolean
}>(), {
    isExploreMode: false,
    isCenterButtonEnabled: false
});

defineEmits<{
    (event: 'goNext'): void
    (event: 'goPrev'): void
    (event: 'setExploreMode'): boolean,
    (event: 'centerScene'): void
}>();

</script>

<style type="less">
.nav-panel {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 45px;
    box-sizing: border-box;
    padding: 4px;
    margin: 0 auto !important;
    justify-content: center;
    width: fit-content;
}

.button-toggled {
    background-color: var(--n-text-color-pressed) !important;
    color: var(--n-text-color) !important;
}

.smooth-enter-active, .smooth-leave-active {
  transition: padding .1s;
}
.smooth-enter, .smooth-leave-to {
  padding:0;

  
}

.smooth-enter, .smooth-leave-to > * {
  opacity: 0;
  
}
</style>