<template>
    <n-breadcrumb id="breadcrumb-root">
        <n-breadcrumb-item v-for="(dcrumb, index) in displayCrumbs" :on-click="() => navigate(index)">
            {{ dcrumb }}
        </n-breadcrumb-item>
    </n-breadcrumb>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { NBreadcrumb, NBreadcrumbItem } from "~/utils/fixnaive.mjs";
import { useConstellationsStore } from "~/stores/constellations";

const { isMobile } = storeToRefs(useConstellationsStore());

const homeCrumb = computed(() => isMobile.value ? "WWT" : "WorldWide Telescope");

// This is the literal route broken into pieces
//
// "/" maps to [""], ["/foo/"] and ["/foo"] map to ["", "foo"], etc.
const literalCrumbs = computed<string[]>(() => {
    const route = useRoute();
    return route.path.replace(/\/$/, "").split('/');
});

// Here we take the literal crumbs and tweak them for display to the user

const HANDLE_RE = /^@/;
const ID_RE = /^[0-9a-fA-F]+$/;

const displayCrumbs = computed<string[]>(() => {
    const dcrumbs = [...literalCrumbs.value];
    dcrumbs[0] = homeCrumb.value;

    if (dcrumbs.length > 2 && HANDLE_RE.test(dcrumbs[1]) && ID_RE.test(dcrumbs[2])) {
        dcrumbs[2] = "Scene";
    }

    return dcrumbs;
});

function buildRoute(index: number): string {
    if (index == 0) {
        return "/";
    } else {
        return "/" + literalCrumbs.value.slice(1, index + 1).join("/") + "/";
    }
}

async function navigate(index: number) {
    await navigateTo(buildRoute(index))
}
</script>

<style type="less">
#breadcrumb-root {
    pointer-events: all;
}
</style>