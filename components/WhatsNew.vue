<template>
    <n-button strong type="primary" size="small" id="whatsnew-button" aria-label="Show WWT news" @click="onShowWhatsNew"
        @keyup.enter="onShowWhatsNew">
        <n-icon size="18" aria-labelledby="whatsnew-button">
            <InfoOutlined />
        </n-icon>
        <n-text class="icon-button-label">
            What’s new?
        </n-text>
    </n-button>

    <n-modal v-model:show="showModal">
        <n-card style="width: 600px" title="What’s New in WorldWide Telescope?" :bordered="false" size="huge" role="dialog"
            aria-modal="true">
            <p>We’re beta-testing the new WorldWide Telescope
                <b>Constellations</b>
                interface! We hope that you’ll enjoy exploring and sharing
                <i>real</i>, beautiful astronomical imagery from the world’s
                best telescopes.
            </p>

            <p>To get to the full-featured WWT “webclient” application, <a href="/webclient/">click here</a>. The menu under
                the
                <n-icon size="16">
                    <MenuRound />
                </n-icon>
                button has a permanent link to it and other useful pages.
            </p>

            <p>Feedback? Email <b>
                    <NuxtLink to="mailto:hello@worldwidetelescope.org">hello@worldwidetelescope.org</NuxtLink>
                </b>!</p>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { InfoOutlined, MenuRound } from "@vicons/material";

import {
    NButton,
    NIcon,
    NModal,
    NCard,
    NText,
} from "~/utils/fixnaive.mjs";

const showModal = ref(false);

function onShowWhatsNew() {
    showModal.value = true;
}
</script>

<style type="less">
.whatsnew-panel {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 3px;
    box-sizing: border-box;
    padding: 4px;
}

#whatsnew-button {
    background-color: rgba(99, 226, 183, 0.5);

    i {
        color: rgba(255, 255, 255, 0.82);
    }
}

.icon-button-label {
    margin-left: 5px;
}
</style>
