<template>
    <n-breadcrumb id="breadcrumb-root">
        <n-breadcrumb-item v-for="(crumb, index) in crumbs" :on-click="() => navigate(crumb, index)">
            {{ crumb }}
        </n-breadcrumb-item>
    </n-breadcrumb>
</template>

<script setup lang="ts">
import { NBreadcrumb, NBreadcrumbItem } from "~/utils/fixnaive.mjs";

const homeCrumb = "WorldWide Telescope";

const crumbs = computed<string[]>(() => {
    const route = useRoute();

    if (route.path == "/") {
        return [homeCrumb];
    } else {
        return (homeCrumb + route.path).split('/');
    }
});

function buildRoute(crumb: string, index: number): string {
    if (crumb == homeCrumb) {
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