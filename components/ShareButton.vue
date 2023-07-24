<template>
    <n-button class="action-button" :bordered="false" @click="showModal = true">
        <n-icon size="30">
            <ShareOutlined />
        </n-icon>
    </n-button>
    <n-modal v-model:show="showModal">
        <n-card style="width: 600px" :title="modalTitle" :bordered="false" size="huge" role="dialog" aria-modal="true">
            <div class="share-network-list">
                <n-space justify="space-around" size="large">
                    <ShareNetwork v-for="network in networks" :network="network.network" :key="network.network"
                        :url="sharing.url" :title="sharing.title" :description="sharing.description"
                        :hashtags="sharing.hashtags" :twitterUser="sharing.twitterUser" style="text-decoration: none;">
                        <n-space :align="'center'" vertical>
                            <n-avatar :style="{ backgroundColor: network.color }" strong circle>
                                <n-icon size="20">
                                    <svg xmlns="http://www.w3.org/2000/svg" :viewBox="network.viewBox">
                                        <path :d="network.icon" fill="currentColor" />
                                    </svg>
                                </n-icon>
                            </n-avatar>
                            <span class="network-name">
                                {{ network.name }}
                            </span>
                        </n-space>
                    </ShareNetwork>
                </n-space>
            </div>
            <template #footer>
                <div class="url-prompt">Or send the following URL:</div>
                <n-space :align="'center'" horizontal class="sharing-url-container">
                    <span class="sharing-url" tabindex="0" @keyup.enter="copyURL">{{ sharing.url }}</span>
                    <n-button aria-label="Copy URL to clipboard" @click="copyURL" @keyup.enter="copyURL">
                        <n-icon size="18">
                            <ContentCopyOutlined />
                        </n-icon>
                    </n-button>
                </n-space>
            </template>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { ContentCopyOutlined, ShareOutlined } from "@vicons/material";

import {
    NButton,
    NIcon,
    NModal,
    NCard,
    NAvatar,
    NSpace
} from "~/utils/fixnaive.mjs";

const notification = useNotification();

const props = defineProps<{
    url: string,
    title: string,
    description: string,
    handle: string,
}>();

const showModal = ref(false);

const sharing = computed(() => {
  return {
    url: props.url,
    title: props.title,
    description: props.description,
    hashtags: 'WorldWideTelescope',
    twitterUser: 'WWTelescope'
  }
});

const modalTitle = computed(() => {
    return `Share @${props.handle}’s post`;
});

const networks = [
    { network: 'facebook', name: 'Facebook', viewBox: "0 0 350 512", icon: 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z', color: '#1877f2' },
    { network: 'linkedin', name: 'LinkedIn', viewBox: "0 0 420 512", icon: 'M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5c0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7c-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5c67.2 0 79.7 44.3 79.7 101.9V416z', color: '#007bb5' },
    { network: 'twitter', name: 'Twitter', viewBox: "0 0 420 512", icon: 'M459.37 151.716c.325 4.548.325 9.097.325 13.645c0 138.72-105.583 298.558-298.558 298.558c-59.452 0-114.68-17.219-161.137-47.106c8.447.974 16.568 1.299 25.34 1.299c49.055 0 94.213-16.568 130.274-44.832c-46.132-.975-84.792-31.188-98.112-72.772c6.498.974 12.995 1.624 19.818 1.624c9.421 0 18.843-1.3 27.614-3.573c-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319c-28.264-18.843-46.781-51.005-46.781-87.391c0-19.492 5.197-37.36 14.294-52.954c51.655 63.675 129.3 105.258 216.365 109.807c-1.624-7.797-2.599-15.918-2.599-24.04c0-57.828 46.782-104.934 104.934-104.934c30.213 0 57.502 12.67 76.67 33.137c23.715-4.548 46.456-13.32 66.599-25.34c-7.798 24.366-24.366 44.833-46.132 57.827c21.117-2.273 41.584-8.122 60.426-16.243c-14.292 20.791-32.161 39.308-52.628 54.253z', color: '#1da1f2' },
    { network: 'email', name: 'Email', viewBox: "0 0 512 512", icon: 'M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7c22.4 17.4 52.1 39.5 154.1 113.6c21.1 15.4 56.7 47.8 92.2 47.6c35.7.3 72-32.8 92.3-47.6c102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4c132.7-96.3 142.8-104.7 173.4-128.7c5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9c30.6 23.9 40.7 32.4 173.4 128.7c16.8 12.2 50.2 41.8 73.4 41.4z', color: '#333333' }
]

async function copyURL() {
    try {
        await navigator.clipboard.writeText(props.url);
        notification.success({ content: "Link copied!", duration: 3000 });
        showModal.value = false;
    } catch (e: any) {
        notification.error({ content: `Failed to copy link: ${e}`, duration: 3000 });
    }
}
</script>

<style type="less">
.action-button {
    padding: 0;
}

.network-name {
    color: white;
}

.url-prompt {
    margin-bottom: 0.3rem;
    font-size: 90%;
}

.sharing-url-container div:first-child {
    flex: 1;
}

.sharing-url {
    /* Manually copying Naive UI stuff here; there's probably a way to avoid that? */
    display: block;
    box-sizing: border-box;
    height: 34px;

    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 3px;
    color: #AAA;

    font-size: 90%;
    white-space: nowrap;
    overflow: scroll;
    font-family: monospace;

    /* Firefox */
    scrollbar-width: none;

    /* Edge, IE */
    -ms-overflow-style: none;

    /* Chrome, Safari, Opera */
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>