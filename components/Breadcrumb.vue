<template>
    <n-breadcrumb>
        <n-breadcrumb-item v-for="(crumb, index) in crumbs" :on-click="() => navigate(crumb, index)">
            {{ crumb }}
        </n-breadcrumb-item>
    </n-breadcrumb>
</template>

<script setup lang="ts">
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'

const homeCrumb = "home";

const crumbs = computed<string[]>(() => {
    const route = useRoute();
    return (homeCrumb + route.path).split('/');
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
