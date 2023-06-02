<template>
    <div id="skymap-root">
        <canvas ref="canvasRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @click="onMouseClick"
            aria-label="List of celestial objects" :class="{ 'canvas-hovering': isHoveringObject }">
            <ul>
                <li v-for="co in celestialObjects" :on-click="() => $emit('selected', co.itemIndex)"
                    aria-label="Celestial object">
                    {{ co.itemIndex }}
                </li>
            </ul>
        </canvas>
        <transition name="fade">
            <template v-if="celestialObjects.some((co) => co.isHovered)">
                <div id="skymap-details-container" :style="{ left: detailsPosX + 10 + 'px', top: detailsPosY - 70 + 'px' }"
                    aria-hidden="true">
                    <img :src="celestialObjectThumbnail" id="skymap-details">
                </div>
            </template>
        </transition>
    </div>
</template>


<script setup lang="ts">
import { SceneDisplayInfoT } from "~/utils/types";
import { R2D } from "~/utils/constants";
import { getEngineStore } from "~/utils/helpers";
import { URLHelpers, URLRewriteMode } from "@wwtelescope/engine";



interface CelestialObject extends SceneDisplayInfoT {
    itemIndex?: number,
    radius?: number,
    isHovered?: boolean
}

const props = defineProps<{
    scenes: SceneDisplayInfoT[]
}>();

const emits = defineEmits<{
    (event: 'selected', index: number): void
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const detailsPosX = ref(0);
const detailsPosY = ref(0);
const defaultObjectRadius = ref(4);
const maxObjectRadius = ref(10);
const backgroundImage = ref<HTMLImageElement | null>(null);
const celestialObjects = ref(props.scenes as CelestialObject[]);
const isHoveringObject = ref(false);
const engineRaDeg = ref(0);
const engineDecDeg = ref(0);
const engineZoomDeg = ref(0);
const zoomWrapEnabled = ref(false);
const zoomMaxSize = ref(50);
const zoomMinSize = ref(10);

const celestialObjectThumbnail = computed<string>(() => {
    const co = celestialObjects.value.find((co) => co.isHovered);
    if (co?.content?.image_layers && co.content.image_layers.length > 0) {
        return URLHelpers.singleton.rewrite(co.content.image_layers[0].image.wwt.thumbnail_url, URLRewriteMode.AsIfAbsolute);
    } else {
        return ""; // Some alt. image
    }
});

onMounted(() => {
    backgroundImage.value = new Image()
    backgroundImage.value.src = require('~/assets/images/skymap_bg.jpg')
    backgroundImage.value.onload = () => {
        drawCanvas();
    }

    getEngineStore().$subscribe(() => {
        const ra = getEngineStore().raRad * R2D;
        const dec = getEngineStore().decRad * R2D;
        const zoom = getEngineStore().zoomDeg;

        if (ra != engineRaDeg.value || dec != engineDecDeg.value || zoom != engineZoomDeg.value) {
            engineRaDeg.value = ra;
            engineDecDeg.value = dec;
            engineZoomDeg.value = Math.min(Math.max(zoom, zoomMinSize.value), zoomMaxSize.value);
            redrawCanvas();
        }
    });
});

watchEffect(() => {
    celestialObjects.value = props.scenes;
    redrawCanvas();
});


function drawCanvas() {
    const canvas = canvasRef.value;

    if (canvasRef === null || !canvas?.clientWidth || !canvas?.clientHeight) {
        return;
    }

    // Set canvas resolution to size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Canvas context not found');
        return;
    }

    if (!backgroundImage.value) {
        console.error('Canvas background image is not loaded');
        return;
    }

    ctx.drawImage(backgroundImage.value, 0, 0, canvas.width, canvas.height);

    celestialObjects.value.forEach((co: any, index: number) => {
        drawCelestialObject(canvas, ctx, co, index)
    });


    drawZoomBorder(canvas, ctx);
};

function redrawCanvas() {
    drawCanvas();
};

function drawCelestialObject(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, co: CelestialObject, index: number) {
    const coords = coords2screen(co.place.ra_rad * R2D, co.place.dec_rad * R2D, canvas.width, canvas.height)

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, co.radius ?? defaultObjectRadius.value, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.filter = co.isHovered ? 'blur(6px)' : 'blur(3px)'
    ctx.fill();
};

function drawZoomBorder(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const coords = coords2screen(engineRaDeg.value, engineDecDeg.value, canvas.width, canvas.height)

    ctx.beginPath();
    ctx.filter = 'none';
    ctx.arc(coords.x, coords.y, engineZoomDeg.value, 0, 2 * Math.PI)
    ctx.strokeStyle = 'blue';
    ctx.stroke();

    if (zoomWrapEnabled.value) {
        if (coords.x + engineZoomDeg.value > canvas.clientWidth) {
            ctx.beginPath();
            ctx.arc(coords.x - canvas.width, coords.y, engineZoomDeg.value, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (coords.x - engineZoomDeg.value < 0) {
            ctx.beginPath();
            ctx.arc(coords.x + canvas.width, coords.y, engineZoomDeg.value, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
};

function coords2screen(raDeg: number, decDeg: number, canvasWidth: number, canvasHeight: number) {
    return { x: ra2screen(raDeg, canvasWidth, canvasHeight), y: dec2screen(decDeg, canvasWidth, canvasHeight) };
};

function ra2screen(raDeg: number, canvasWidth: number, canvasHeight: number) {
    const raCenter = 0;
    const raScale = canvasWidth / 360; // pixels per degree
    const raOffset = canvasWidth / 2; // offset for RA >= 180

    return raDeg <= 180
        ? (raDeg - raCenter) * raScale + raOffset
        : (raDeg - raCenter - 360) * raScale + raOffset;
};

function dec2screen(decDeg: number, canvasWidth: number, canvasHeight: number) {
    const decCenter = 0;
    const decScale = -canvasHeight / 180; // pixels per degree, negative to flip y-axis
    return (decDeg - decCenter) * decScale + canvasHeight / 2;
};

function onMouseClick(event: MouseEvent) {
    const co = celestialObjects.value.find((co) => co.isHovered);

    if (co && co.itemIndex) {
        emits("selected", co.itemIndex)
    }
};

function onMouseMove(event: MouseEvent) {
    const canvas = canvasRef.value;
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const selectedObject = celestialObjects.value.find((co) => {
            const coords = coords2screen(co.place.ra_rad * R2D, co.place.dec_rad * R2D, canvas.width, canvas.height)
            const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2);
            return distance < (co.radius ?? defaultObjectRadius.value);
        });

        if (selectedObject) {
            selectedObject.isHovered = true;
            isHoveringObject.value = true;
            detailsPosX.value = event.clientX;
            detailsPosY.value = event.clientY;

            animateObjectRadius(selectedObject, maxObjectRadius.value);
            redrawCanvas();
        } else {
            isHoveringObject.value = false;
        }

        const deselectedObject = celestialObjects.value.find((co) => {
            return co != selectedObject && co.isHovered;
        });

        if (deselectedObject) {
            deselectedObject.isHovered = false;
            animateObjectRadius(deselectedObject, defaultObjectRadius.value);
        }
    }
};

function onMouseLeave() {
    const co = celestialObjects.value.find((co) => co.isHovered);

    if (co) {
        co.isHovered = false;
    }

    redrawCanvas();
};

function animateObjectRadius(co: CelestialObject, targetRadius: number) {
    const startRadius = co.radius ?? defaultObjectRadius.value;
    let currentRadius = startRadius;
    let velocity = 0;
    const springConstant = 0.1;
    const damping = 0.8;

    function update() {
        if (!co.isHovered && targetRadius > defaultObjectRadius.value) {
            return;
        }

        const force = (targetRadius - currentRadius) * springConstant;
        velocity += force;
        velocity *= damping;
        currentRadius += velocity;

        if (Math.abs(currentRadius - targetRadius) < 0.1) {
            co.radius = targetRadius;
        } else {
            co.radius = currentRadius;
            requestAnimationFrame(update);
        }

        redrawCanvas();
    }

    requestAnimationFrame(update);
}
</script>

<style scoped>
canvas {
    background-color: black;
    border: 1px solid #777;
    border-radius: 3px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
}

.canvas-hovering {
    cursor: pointer;
}

#skymap-root {
    width: 100%;
    height: 240px;
    pointer-events: all;
}

#skymap-details-container {
    position: absolute;
    z-index: 1;
    pointer-events: none;
}

#skymap-details-container:hover {
    opacity: 1;
}

#skymap-details {
    width: 100px;
    height: 70px;
    border-radius: 10%;
    border: 1px solid white;
}

.fade-enter-active {
    opacity: 0;
    transition: opacity .5s
}

.fade-leave-active {
    transition: opacity .5s
}

.fade-enter-to {
    opacity: 1;
}

.fade-leave-to {
    opacity: 0
}
</style>