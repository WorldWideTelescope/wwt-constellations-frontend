<template>
    <div id="skymap-root">
        <canvas ref="canvasRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @click="onMouseClick"
            aria-label="List of celestial objects" :class="{ 'canvas-hovering': isHoveringObject }">
            <!-- Note that this links to `scenes`, not the markers; this is OK
                since the scenes are the actually selectable items of relevance here.
                -->
            <ul>
                <li v-for="co in scenes" :on-click="() => $emit('selected', co)" aria-label="Celestial object">
                    {{ co.id }}
                </li>
            </ul>
        </canvas>
        <transition name="fade">
            <template v-if="isHoveringObject">
                <div id="skymap-details-container" :style="{ left: detailsPosX + 10 + 'px', top: detailsPosY - 70 + 'px' }"
                    aria-hidden="true">
                    <img :src="celestialObjectThumbnail" id="skymap-details">
                </div>
            </template>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { Color, URLHelpers, URLRewriteMode } from "@wwtelescope/engine";

import { SceneDisplayInfoT, SkymapSceneInfo } from "~/utils/types";
import { R2D } from "~/utils/constants";
import { getEngineStore } from "~/utils/helpers";

const { $backendCall } = useNuxtApp();

const props = defineProps<{
    scenes: SkymapSceneInfo[]
}>();

const { scenes } = toRefs(props);

const emits = defineEmits<{
    (event: 'selected', scene: SceneDisplayInfoT): void
}>();

const defaultObjectRadius = 4;
const hoveredObjectRadius = 8;
const zoomMaxSize = 50;
const zoomMinSize = 10;

const { raRad: engineRaRad, decRad: engineDecRad, zoomDeg: engineZoomDeg } = storeToRefs(getEngineStore());

const canvasRef = ref<HTMLCanvasElement | null>(null);
const detailsPosX = ref(0);
const detailsPosY = ref(0);
const backgroundImage = ref<HTMLImageElement | null>(null);
const isHoveringObject = ref(false);
const celestialObjectThumbnail = ref("");

// A helper class for tweening colors. I don't see an built-in type that
// obviously does what we want here??

class Rgba {
    // These values are all between 0 and 1!
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static newBlack(): Rgba {
        return new Rgba(0, 0, 0, 1);
    }

    asCSS(): string {
        const r255 = (this.r * 255).toFixed(0);
        const g255 = (this.g * 255).toFixed(0);
        const b255 = (this.b * 255).toFixed(0);
        return `rgba(${r255}, ${g255}, ${b255}, ${this.a.toFixed(2)})`;
    }

    setTo(other: Rgba) {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.a = other.a;
    }

    equals(o: Rgba): boolean {
        return (this.r == o.r) && (this.g == o.g) && (this.b == o.b) && (this.a == o.a);
    }

    // Returns whether additional steps are needed -- whether we are *not* yet
    // at the target.
    stepTowards(target: Rgba, factor: number): boolean {
        this.r += (target.r - this.r) * factor;
        this.g += (target.g - this.g) * factor;
        this.b += (target.b - this.b) * factor;
        this.a += (target.a - this.a) * factor;
        return !this.equals(target);
    }
}

// The rendering context used by the different elements of the skymap.

class SkymapContext {
    width: number;
    height: number;
    ctx: CanvasRenderingContext2D;

    constructor(width: number, height: number, ctx: CanvasRenderingContext2D) {
        this.width = width;
        this.height = height;
        this.ctx = ctx;
    }

    skyToCanvas(raDeg: number, decDeg: number): { x: number, y: number } {
        const raCenter = 0;
        const raScale = this.width / 360; // pixels per degree
        const raOffset = this.width / 2; // offset for RA >= 180

        const x = raDeg <= 180
            ? (raDeg - raCenter) * raScale + raOffset
            : (raDeg - raCenter - 360) * raScale + raOffset;

        const decCenter = 0;
        const decScale = -this.height / 180; // pixels per degree, negative to flip y-axis
        const y = (decDeg - decCenter) * decScale + this.height / 2;

        return { x, y };
    }

    canvasToSky(x: number, y: number): { raDeg: number, decDeg: number } {
      const raCenter = 0;
      const raScale = this.width / 360;
      const raOffset = this.width / 2;
      const raDeg = (x - raOffset) / raScale + raCenter;

      const decCenter = 0;
      const decScale = -this.height / 180;
      const decDeg = decCenter + ((y - this.height / 2) / decScale);

      return { raDeg, decDeg };
    }
}

// Markers -- points that show up on the map.
//
// Some of these correspond to the scenes that we are supposed to show, which we
// know from our `scenes` prop. But since we want to fade out markers for scenes
// as they go away, the list of markers is a separate thing. The markers are
// *not* reactive because they don't connect to the DOM -- they are only used
// when rendering the canvas.

const ANIMATION_DURATION_MS = 5000; // milliseconds

class Marker {
    readonly raDeg: number;
    readonly decDeg: number;
    readonly scene: SkymapSceneInfo;

    isHovered: boolean = false;
    isBeingRemoved: boolean = false;
    needsAnimation: boolean = false;

    currentTimestamp: number | null = null;
    currentRadius: number;
    currentLineWidth: number;
    currentColor: Rgba;

    targetTimestamp: number | null = null;
    targetRadius: number;
    targetLineWidth: number;
    targetColor: Rgba;

    constructor(scene: SkymapSceneInfo) {
        this.raDeg = scene.place.ra_rad * R2D;
        this.decDeg = scene.place.dec_rad * R2D;
        this.scene = scene;

        this.currentColor = Rgba.newBlack();
        this.currentLineWidth = 1;
        this.currentRadius = defaultObjectRadius;

        this.targetColor = Rgba.newBlack();
        this.targetLineWidth = this.currentLineWidth;
        this.targetRadius = this.currentRadius;
    }

    render(context: SkymapContext) {
        const coords = context.skyToCanvas(this.raDeg, this.decDeg);
        context.ctx.beginPath();
        context.ctx.arc(coords.x, coords.y, this.currentRadius, 0, 2 * Math.PI);
        context.ctx.strokeStyle = this.currentColor.asCSS();
        context.ctx.lineWidth = this.currentLineWidth;
        context.ctx.stroke();
    }

    sendToDesiredScene(scene: SkymapSceneInfo) {
        this.targetColor.setTo(new Rgba(scene.color.r / 255, scene.color.g / 255, scene.color.b / 255, scene.color.a / 255));
        this.targetLineWidth = scene.linewidth;

        this.needsAnimation = true;
        this.isBeingRemoved = false;
    }

    sendToDestruction() {
        this.targetColor.setTo(this.currentColor);
        this.targetColor.a = 0;
        this.targetLineWidth = 1;
        this.needsAnimation = true;
        this.isBeingRemoved = true;
    }

    setHoverStatus(isHovered: boolean) {
        if (isHovered != this.isHovered) {
            this.targetRadius = isHovered ? hoveredObjectRadius : defaultObjectRadius;
            this.needsAnimation = true;
        }

        this.isHovered = isHovered;
    }

    // This updates `this.needsAnimation` depending on whether additional
    // animation will be needed.
    animate(now: number) {
        // Time should never move backwards, but just in case ...
        if (this.currentTimestamp === null || now < this.currentTimestamp) {
            this.currentTimestamp = now;
        }

        if (this.targetTimestamp === null) {
            this.targetTimestamp = now + ANIMATION_DURATION_MS;
        }

        this.needsAnimation = false;

        if (now >= this.targetTimestamp) {
            // We are done; or, we have to be done.
            this.currentColor.setTo(this.targetColor);
        } else {
            // This is how far we should step from `current` towards `target`, as a
            // number between 0 and 1. Once again, this number should never be out
            // of bounds, but if something terrible has happened, make sure it has a
            // safe value.

            const rawFactor = (now - this.currentTimestamp) / (this.targetTimestamp - this.currentTimestamp);
            const factor = (rawFactor >= 0 && rawFactor <= 1) ? rawFactor : 0;

            // Now we can actually step our different parameters.

            this.needsAnimation ||= this.currentColor.stepTowards(this.targetColor, factor);

            this.currentLineWidth += (this.targetLineWidth - this.currentLineWidth) * factor;
            this.needsAnimation ||= (this.currentLineWidth != this.targetLineWidth);

            this.currentRadius += (this.targetRadius - this.currentRadius) * factor;
            this.needsAnimation ||= (this.currentRadius != this.targetRadius);
        }

        if (!this.needsAnimation) {
            this.currentTimestamp = null;
            this.targetTimestamp = null;
        }
    }
}

// The marker collection handles our markers, their animations, and
// synchronization with the list of scenes handed down through our props.

interface AssessMarkerHoversResult {
    selected: Marker | null;
    selectedAlreadyHovered: boolean;
    anythingChanged: boolean;
}

class MarkerCollection {
    readonly markers: Map<string, Marker> = new Map();
    needsAnimation: boolean = false;

    syncWithScenes(scenes: SkymapSceneInfo[]) {
        this.needsAnimation = false;

        // Any marker that we don't catch below should go away
        for (var marker of this.markers.values()) {
            marker.isBeingRemoved = true;
        }

        for (var scene of scenes) {
            let marker = this.markers.get(scene.id);

            if (marker === undefined) {
                marker = new Marker(scene);
                this.markers.set(scene.id, marker);
            }

            marker.sendToDesiredScene(scene);
        }

        for (var marker of this.markers.values()) {
            if (marker.isBeingRemoved) {
                marker.sendToDestruction();
            }

            this.needsAnimation ||= marker.needsAnimation;
        }
    }

    render(context: SkymapContext) {
        for (var marker of this.markers.values()) {
            marker.render(context);
        }
    }

    // This updates `this.needsAnimation` depending on whether additional
    // animation will be needed.
    animate(now: number) {
        this.needsAnimation = false;
        const markersToRemove = [];

        // We make three passes over the list because we want to draw items from
        // "least important" to "most important", since stacked markers will
        // overwrite one another. This seems easier (and faster?) than trying to
        // sort the list.

        const filterPass1 = (m: Marker) => !(m.scene.current || m.scene.adjacent);
        const filterPass2 = (m: Marker) => m.scene.adjacent;
        const filterPass3 = (m: Marker) => m.scene.current;
        
        for (var filter of [filterPass1, filterPass2, filterPass3]) {
            for (const [id, marker] of this.markers.entries()) {
                if (!filter(marker)) {
                    continue;
                }

                marker.animate(now);
                this.needsAnimation ||= marker.needsAnimation;

                // If this marker is on its way towards removal, and it has gotten
                // there, we can get rid of it.
                if (!marker.needsAnimation && marker.isBeingRemoved) {
                    markersToRemove.push(id);
                }
            }
        }

        for (var key of markersToRemove) {
            this.markers.delete(key);
        }
    }

    getSelectedScene(): SkymapSceneInfo | null {
        for (var marker of this.markers.values()) {
            if (marker.isHovered) {
                return marker.scene;
            }
        }

        return null;
    }

    // Update the `isHovered` flags of the markers, and return information about
    // the current hover situation.
    //
    // Here we *don't* try to identify the marker that is the very closest to
    // the cursor, since they're so small that it's not worthwhile anyway. We do
    // try to select the one that was already hovered, though.
    assessHovers(x: number, y: number, ctx: SkymapContext): AssessMarkerHoversResult {
        let selected: Marker | null = null;
        let selectedAlreadyHovered = false;
        let anythingChanged = false;

        for (var marker of this.markers.values()) {
            const pos = ctx.skyToCanvas(marker.raDeg, marker.decDeg);
            const distanceSquared = (x - pos.x) ** 2 + (y - pos.y) ** 2;
            const isHovered = (distanceSquared < marker.currentRadius ** 2);

            if (isHovered) {
                if (selected === null || marker.isHovered) {
                    selected = marker;
                    selectedAlreadyHovered = marker.isHovered;
                }

                anythingChanged ||= !marker.isHovered;
            } else {
                anythingChanged ||= marker.isHovered;
            }

            marker.setHoverStatus(isHovered);
        }

        return { selected, selectedAlreadyHovered, anythingChanged };
    }

    // Set all markers to un-hovered status. We return a boolean indicating if
    // anything changed.
    clearHovers(): boolean {
        let anythingChanged = false;

        for (var marker of this.markers.values()) {
            if (marker.isHovered) {
                anythingChanged = true;
                marker.setHoverStatus(false);
            }
        }

        return anythingChanged;
    }
}

const markerCollection = new MarkerCollection();

// Finally, the logic that ties together our different animation elements with
// the reactive component system.

class SkymapRenderer {
    // The spec stats that animation request IDs are never zero.
    private animationRequestId: number = 0;

    // Returns true if additional draws are needed. This could be because we
    // didn't have what we needed to actually draw anything, just yet.
    private tryDrawNow = (): boolean => {
        // Do we have what we need to actually draw it all?

        if (!backgroundImage.value) {
            return true;
        }

        const skycontext = this.trySetupContext(true);
        if (skycontext == null) {
            return true;
        }

        // Yes, we do! Draw and tell our caller whether additional animation is needed.

        skycontext.ctx.drawImage(backgroundImage.value, 0, 0, skycontext.width, skycontext.height);
        markerCollection.render(skycontext);
        this.renderFov(skycontext);
        return markerCollection.needsAnimation;
    };

    private trySetupContext = (isRendering: boolean): SkymapContext | null => {
        const canvas = canvasRef.value;
        if (canvas === null || !canvas.clientWidth || !canvas.clientHeight) {
            return null;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        // Maybe sync the canvas resolution with its size. This clears the
        // canvas even if it's a noop, so only do that if rendering.
        if (isRendering) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        return new SkymapContext(canvas.width, canvas.height, ctx);
    };

    private renderFov = (skycontext: SkymapContext) => {
        const coords = skycontext.skyToCanvas(engineRaRad.value * R2D, engineDecRad.value * R2D);

        skycontext.ctx.beginPath();
        skycontext.ctx.filter = 'none';
        skycontext.ctx.arc(coords.x, coords.y, Math.min(Math.max(engineZoomDeg.value, zoomMinSize), zoomMaxSize), 0, 2 * Math.PI)
        skycontext.ctx.strokeStyle = '#215276';
        skycontext.ctx.lineWidth = 2;
        skycontext.ctx.stroke();
    };

    private animate = (now: number) => {
        this.animationRequestId = 0;

        // Update animations. This will update the needsAnimation fields of the
        // contained objects.

        markerCollection.animate(now);

        // Actually render (hopefully), and queue again if we need to. This
        // might be because an animation is still in progress, or because we
        // weren't actually able to draw anything just yet.

        if (this.tryDrawNow()) {
            this.queueRender();
        }
    };

    queueRender = () => {
        if (!process.server && this.animationRequestId == 0) {
            this.animationRequestId = requestAnimationFrame(this.animate);
        }
    };

    onMouseMove = (event: MouseEvent) => {
        const ctx = this.trySetupContext(false);
        if (ctx == null) {
            return;
        }

        const rect = canvasRef.value!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const { selected, selectedAlreadyHovered, anythingChanged } = markerCollection.assessHovers(x, y, ctx);
        isHoveringObject.value = (selected !== null);

        if (selected !== null && !selectedAlreadyHovered) {
            detailsPosX.value = event.clientX;
            detailsPosY.value = event.clientY;

            let t = "";

            const content = selected.scene.content;
            if (content && content.image_layers && content.image_layers.length > 0) {
                t = URLHelpers.singleton.rewrite(
                    content.image_layers[0].image.wwt.thumbnail_url,
                    URLRewriteMode.AsIfAbsolute
                );
            }

            celestialObjectThumbnail.value = t;
        }

        if (anythingChanged) {
            this.queueRender();
        }
    }

    onMouseLeave = () => {
        if (markerCollection.clearHovers()) {
            this.queueRender();
        }
    }
}

const renderer = new SkymapRenderer();

onMounted(() => {
    backgroundImage.value = new Image()
    backgroundImage.value.src = require('~/assets/images/skymap_bg.jpg')
    backgroundImage.value.onload = renderer.queueRender;
});

watch(engineRaRad, renderer.queueRender);
watch(engineDecRad, renderer.queueRender);
watch(engineZoomDeg, renderer.queueRender);

watchEffect(() => {
    markerCollection.syncWithScenes(scenes.value);
    renderer.queueRender();
});

// Mousing over the canvas for previews -- breaking encapsulation a bit here

function onMouseClick(event: MouseEvent) {
    const scene = markerCollection.getSelectedScene();

    if (scene !== null) {
        emits("selected", scene);
        return;
    }

    const canvas = canvasRef.value;
    if (canvas !== null) {
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        return;
      }
      const context = new SkymapContext(canvas.width, canvas.height, ctx);
      const { raDeg, decDeg } = context.canvasToSky(event.offsetX, event.offsetY);

      const raRad = raDeg * D2R;
      const decRad = decDeg * D2R;
      getTessellationCell($backendCall, "global", raRad, decRad).then(async (cell) => {
        const scene = await getScene($backendCall, cell.scene_id);
        if (scene === null) {
          return;
        }
        emits("selected", scene);
        const marker = new Marker({ ...scene, color: Color.fromArgb(255, 196, 180, 84), linewidth: 1});
        markerCollection.markers.set(scene.id, marker);
        renderer.queueRender();
      });
    }
}

function onMouseMove(event: MouseEvent) {
    renderer.onMouseMove(event);
}

function onMouseLeave() {
    renderer.onMouseLeave();
};
</script>

<style scoped>
canvas {
    background-color: black;
    border: 1px solid #215276;
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
    border-radius: 5px;
    border: 1px solid #215276;
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
