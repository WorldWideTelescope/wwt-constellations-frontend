<template>
    <n-space justify="space-between" class="button-bar">
        <n-button-group>
            <n-button id="prev-button" @click="$emit('goPrev')" aria-label="Go previous button"
                v-show="nextSceneSource.type !== 'single-scene'" :disabled="!hasPrev">
                <template #icon>
                    <n-icon size="25" aria-labelledby="prev-button">
                        <NavigateBeforeRound />
                    </n-icon>
                </template>
            </n-button>
        </n-button-group>
        <n-button-group>
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
        </n-button-group>
        <n-button-group>
            <n-button id="next-button" @click="clickNext" aria-label="Go next button"
                v-show="nextSceneSource.type !== 'single-scene'" :disabled="!hasNext"
                :class="{ 'clickme': nextNotYetClicked }">
                <template #icon>
                    <n-icon size="25" aria-labelledby="next-button">
                        <NavigateNextRound />
                    </n-icon>
                </template>
            </n-button>
        </n-button-group>
    </n-space>
</template>

<script setup lang="ts">
import {
    NButtonGroup,
    NButton,
    NIcon,
    NSpace,
} from "~/utils/fixnaive.mjs";

import {
    ArticleFilled,
    CenterFocusWeakFilled,
    NavigateNextRound,
    NavigateBeforeRound,
    SwipeVerticalFilled,
    ZoomOutMapFilled,
} from "@vicons/material";

import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();

const {
    isMobile,
    sceneHistory,
    currentHistoryNode,
    futureScenes,
    nextSceneSource,
} = storeToRefs(constellationsStore);

const hasPrev = computed<boolean>(() => !!currentHistoryNode.value?.prev);
const hasNext = computed<boolean>(() => futureScenes.value.length > 0 ||
    (sceneHistory.value.length > 0 && !!currentHistoryNode.value?.next));
const nextNotYetClicked = ref(true);

withDefaults(defineProps<{
    isExploreMode?: boolean,
    isCenterButtonEnabled?: boolean
}>(), {
    isExploreMode: false,
    isCenterButtonEnabled: false
});

const emit = defineEmits<{
    (event: 'goNext'): void
    (event: 'goPrev'): void
    (event: 'setExploreMode', setting: boolean): void,
    (event: 'centerScene'): void
}>();


function clickNext() {
    nextNotYetClicked.value = false;
    emit("goNext");
}
</script>

<style type="less">
.button-bar {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 3px;
    box-sizing: border-box;
    padding: 4px;
    width: 100%;
}

.button-toggled {
    background-color: var(--n-text-color-pressed) !important;
    color: var(--n-text-color) !important;
}

.smooth-enter-active,
.smooth-leave-active {
    transition: padding .1s;
}

.smooth-enter,
.smooth-leave-to {
    padding: 0;
}

.smooth-enter,
.smooth-leave-to>* {
    opacity: 0;
}

#next-button.clickme {
    animation: pulse-bg 1.6s alternate infinite;

    .n-button__state-border {
        animation: pulse-bo=rder 1.6s alternate infinite;
    }
}

@keyframes pulse-border {
    0% {
        border: var(--n-border);
    }

    10% {
        border: var(--n-border);
    }

    85% {
        border: var(--n-border-hover);
    }

    100% {
        border: var(--n-border-hover);
    }
}

@keyframes pulse-bg {
    0% {
        background-color: #000;
    }

    10% {
        background-color: #000;
    }

    85% {
        background-color: rgba(99, 226, 183, 0.5);
    }

    100% {
        background-color: rgba(99, 226, 183, 0.5);
    }
}
</style>
