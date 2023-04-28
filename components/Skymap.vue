<template>
    <div id="skymap-root">
        <canvas ref="canvasRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @click="onMouseClick"></canvas>
        <transition name="fade">
            <template v-if="celestialObjects.some((co) => co.isHovered)">
                <div id="skymap-details-container" :style="{ left: detailsPosX + 10 + 'px', top: detailsPosY - 70 + 'px' }">
                    <img :src="celestialObjectThumbnail" id="skymap-details">
                </div>
            </template>
        </transition>
    </div>
</template>

<script lang="ts">

import { SceneDisplayInfoT } from '~/utils/types';
import { R2D } from "~/utils/constants";

import { useConstellationsStore } from "~/stores/constellations";
import { getEngineStore } from "~/utils/helpers";

interface CelestialObject extends SceneDisplayInfoT {
    itemId?: string,
    radius?: number,
    isHovered?: boolean
}

export default defineNuxtComponent({
    name: 'Skymap',
    props: {
        scenes: {
            type: Array as () => SceneDisplayInfoT[],
            required: true,
            default: () => []
        },
    },
    emits: ['selected'],
    data() {
        return {
            detailsPosX: 0,
            detailsPosY: 0,
            defaultObjectRadius: 4,
            maxObjectRadius: 10,
            backgroundImage: null as HTMLImageElement | null,
            celestialObjects: this.scenes as CelestialObject[],
            engineRaDeg: 0,
            engineDecDeg: 0,
            engineZoomDeg: 0,
            zoomWrapEnabled: false,
            zoomMaxSize: 50,
            zoomMinSize: 10
        };
    },
    mounted() {
        this.backgroundImage = new Image()
        this.backgroundImage.src = require('~/assets/images/skymap_bg.jpg')
        this.backgroundImage.onload = () => {
            this.drawCanvas();
        }

        getEngineStore().$subscribe(() => {
            const ra = getEngineStore().raRad * R2D;
            const dec = getEngineStore().decRad * R2D;
            const zoom = getEngineStore().zoomDeg;

            if (ra != this.engineRaDeg || dec != this.engineDecDeg || zoom != this.engineZoomDeg) {
                this.engineRaDeg = ra;
                this.engineDecDeg = dec;
                this.engineZoomDeg = Math.min(Math.max(zoom, this.zoomMinSize), this.zoomMaxSize);
                this.redrawCanvas();
            }

        });

    },
    computed: {
        celestialObjectThumbnail() {
            const co = this.celestialObjects.find((co) => co.isHovered);
            if (co?.content?.image_layers && co.content.image_layers.length > 0) {
                return co.content.image_layers[0].image.wwt.thumbnail_url;
            } else {
                return ""; // Some alt. image
            }

        },
    },
    methods: {
        drawCanvas() {
            const canvas = this.$refs.canvasRef as HTMLCanvasElement;
            // Set canvas resolution to size
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error('Canvas context not found');
                return;
            }

            if (!this.backgroundImage) {
                console.error('Canvas background image is not loaded');
                return;
            }

            ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);

            this.celestialObjects.forEach((co: any, index: number) => {
                this.drawCelestialObject(canvas, ctx, co, index)
            });


            this.drawZoomBorder(canvas, ctx);
        },
        redrawCanvas() {
            this.drawCanvas();
        },
        drawCelestialObject(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, co: CelestialObject, index: number) {
            const coords = this.coords2screen(co.place.ra_rad * R2D, co.place.dec_rad * R2D, canvas.width, canvas.height)

            ctx.beginPath();
            ctx.arc(coords.x, coords.y, co.radius ?? this.defaultObjectRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.filter = co.isHovered ? 'blur(6px)' : 'blur(3px)'
            ctx.fill();
        },
        drawZoomBorder(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
            const coords = this.coords2screen(this.engineRaDeg, this.engineDecDeg, canvas.width, canvas.height)

            ctx.beginPath();
            ctx.filter = 'none';
            ctx.arc(coords.x, coords.y, this.engineZoomDeg, 0, 2 * Math.PI)
            ctx.strokeStyle = 'blue';
            ctx.stroke();

            if (this.zoomWrapEnabled) {
                if (coords.x + this.engineZoomDeg > canvas.clientWidth) {
                    ctx.beginPath();
                    ctx.arc(coords.x - canvas.width, coords.y, this.engineZoomDeg, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (coords.x - this.engineZoomDeg < 0) {
                    ctx.beginPath();
                    ctx.arc(coords.x + canvas.width, coords.y, this.engineZoomDeg, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
        },
        coords2screen(raDeg: number, decDeg: number, canvasWidth: number, canvasHeight: number) {
            return { x: this.ra2screen(raDeg, canvasWidth, canvasHeight), y: this.dec2screen(decDeg, canvasWidth, canvasHeight) };
        },
        ra2screen(raDeg: number, canvasWidth: number, canvasHeight: number) {
            const raCenter = 0;
            const raScale = canvasWidth / 360; // pixels per degree
            const raOffset = canvasWidth / 2; // offset for RA >= 180

            return raDeg <= 180
                ? (raDeg - raCenter) * raScale + raOffset
                : (raDeg - raCenter - 360) * raScale + raOffset;
        },
        dec2screen(decDeg: number, canvasWidth: number, canvasHeight: number) {
            const decCenter = 0;
            const decScale = -canvasHeight / 180; // pixels per degree, negative to flip y-axis
            return (decDeg - decCenter) * decScale + canvasHeight / 2;
        },
        onMouseClick(event: MouseEvent) {
            const co = this.celestialObjects.find((co) => co.isHovered);

            if (co) {
                this.$emit("selected", co.itemId);
            }
        },
        onMouseMove(event: MouseEvent) {
            const canvas = this.$refs.canvasRef as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const selectedObject = this.celestialObjects.find((co) => {
                const coords = this.coords2screen(co.place.ra_rad * R2D, co.place.dec_rad * R2D, canvas.width, canvas.height)
                const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2);
                return distance < (co.radius ?? this.defaultObjectRadius);
            });

            if (selectedObject) {
                selectedObject.isHovered = true;
                this.detailsPosX = event.clientX;
                this.detailsPosY = event.clientY;

                this.animateObjectRadius(selectedObject, this.maxObjectRadius);
                this.redrawCanvas();
            }

            const deselectedObject = this.celestialObjects.find((co) => {
                return co != selectedObject && co.isHovered;
            });

            if (deselectedObject) {
                deselectedObject.isHovered = false;
                this.animateObjectRadius(deselectedObject, this.defaultObjectRadius);
            }
        },

        onMouseLeave() {
            const co = this.celestialObjects.find((co) => co.isHovered);

            if (co) {
                co.isHovered = false;
            }

            this.redrawCanvas();
        },

        animateObjectRadius(co: CelestialObject, targetRadius: number) {
            const self = this;
            const startRadius = co.radius ?? this.defaultObjectRadius;
            let currentRadius = startRadius;
            let velocity = 0;
            const springConstant = 0.1;
            const damping = 0.8;

            function update() {
                if (!co.isHovered && targetRadius > self.defaultObjectRadius) {
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
                self.redrawCanvas();
            }

            requestAnimationFrame(update);

        }
    },
    watch: {
        scenes() {
            this.celestialObjects = this.scenes;
            this.redrawCanvas();
        }
    },
});

</script>

  
<style scoped>
canvas {
    background-color: black;
    border: 1px solid #777;
    border-radius: 3px;
    width: 100%;
    height: 100%;
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