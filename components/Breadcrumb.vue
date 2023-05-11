<template>
    <n-breadcrumb id="breadcrumb-root">
        <n-breadcrumb-item v-for="(crumb, index) in crumbs" :on-click="() => navigate(crumb, index)">
            {{ crumb }}
        </n-breadcrumb-item>
    </n-breadcrumb>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { NBreadcrumb, NBreadcrumbItem } from "~/utils/fixnaive.mjs";
import { useConstellationsStore } from "~/stores/constellations";

const { isMobile } = storeToRefs(useConstellationsStore());

const homeCrumb = computed(() => isMobile.value ? "WWT" : "WorldWide Telescope");

const crumbs = computed<string[]>(() => {
    const route = useRoute();
    if (route.path == "/") {
        return [homeCrumb.value];
    } else {
        return (homeCrumb.value + route.path).split('/');
    }
});

function buildRoute(crumb: string, index: number): string {
    if (crumb == homeCrumb.value) {
        return "/";
    } else {
        return "/" + crumbs.value.slice(1, index + 1).join("/");
    }
}

async function navigate(crumb: string, index: number) {
    await navigateTo(buildRoute(crumb, index))
}
</script>

<style type="less">
#breadcrumb-root {
    pointer-events: all;
}
</style>