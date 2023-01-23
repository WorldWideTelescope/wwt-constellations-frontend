<template>
  <div id="feed-root">
    <div class="feed">
      <Splide
        :options="splideOptions"
        @splide:click="(_event, splideData) => {
          $refs.splide.go(splideData.index);
        }"
        @splide:move="(_event, newIndex, _oldIndex) => {
          loadIfNeeded(newIndex);
          itemSelected(items[newIndex]);
        }"
        ref="splide"
      >
        <SplideSlide
          v-for="(item, index) in items"
          :key="index"
        >
          <div
            class="feed-item"
            >
              <img
                class="thumbnail"
                :src="item.place.get_thumbnailUrl()"
              />
              
              <h3 class="name"> {{ item.place.get_name() }}</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
          </div>
        </SplideSlide>
      </Splide>
    </div>

    <VueEternalLoading
      :load="load"
      :is-initial="false"
      position="left"
      class="loader"
    >
      <template #no-more><div></div></template>
    </VueEternalLoading>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'vue'
import { LoadAction } from "@ts-pro/vue-eternal-loading";
import { ImageSetLayer, Place, Guid } from '@wwtelescope/engine';
import { applyImageSetLayerSetting } from '@wwtelescope/engine-helpers';
import { Splide } from "@splidejs/vue-splide";
import { tween } from "femtotween";

const D2R = Math.PI / 180.0;
const D2H = 15.0 / 180.0;
const H2D = 180.0 / 15.0;
const H2R = Math.PI / 15.0;

interface Item {
  place: Place;
  url: string;
}

export default defineNuxtComponent({
  data() {
    return {
      page: 1,
      pageSize: 10,
      items: [] as Item[],
      splideOptions: {
        start: 2,
        focus: 'center',
        perPage: 5,
        direction: 'ttb',
        heightRatio: 5,
        perMove: 1,
        arrows: false,
        pagination: false,
        lazyLoad: 'nearby',
        gap: "30px",
        updateOnMove: true,
        wheel: true
      },
      layer: null as (ImageSetLayer | null)
    };
  },
  props: {
    wwtReady: {
      type: Boolean,
      default: false
    },
    horizontal: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    console.log(this.$refs.splide);

    // We need to do this during nextTick,
    // otherwise the WWTInstance hasn't yet been set
    nextTick(() => {
      this.loadInitialItems();
      console.log("Loaded first set of items");
    });
  },
  methods: {
    log(x: any) { console.log(x); },
    async loadItems(page: number): Promise<Item[]> {
      //const url = `http://localhost:8000/data?page=${page}&limit=${this.pageSize}`;
      const url = "http://data1.wwtassets.org/packages/2022/07_jwst/jwst_first_v2.wtml";
      const store = this.$engineStore(this.$pinia);
      const folder = await store.loadImageCollection({
          url: url,
          loadChildFolders: false
      });
      const result = [];
      for (const place of folder.get_children() ?? []) {
          if (!(place instanceof Place)) {
              continue;
          }
          const imageset = place.get_studyImageset();
          if (imageset) {
              const isetUrl = imageset.get_url();
              result.push({ place, url: isetUrl });
          }
      }
      return result;
    },
    async loadNextPage(): Promise<Item[]> {
      const loadedItems = await this.loadItems(this.page);
      this.items.push(...loadedItems);
      this.page += 1; 
      return loadedItems;
    },
    async loadIfNeeded(index: number) {
      if (index >= (this.page - 2) * this.pageSize) {
        this.loadNextPage();
      }
    },
    async load({ loaded }: LoadAction): Promise<void> {
      console.log(`Loading: page = ${this.page}`);
      const loadedItems = await this.loadNextPage();
      loaded(loadedItems.length, this.pageSize);
    },
    async itemSelected(item: Item) {
      const store = this.$engineStore(this.$pinia);
      const place = item.place;
      const studyImageset = place.get_studyImageset();
      if (studyImageset == null) {
        return;
      }
      const name = studyImageset.get_name();
      const iset = store.lookupImageset(name);
      const setLayerOpacity = (layer: ImageSetLayer | null, value: number) => {
        if (layer !== null) {
          applyImageSetLayerSetting(layer, ["opacity", value]);
          //console.log(`Layer: ${layer}, opacity: ${value}`);
        }
      };
      
      // @ts-ignore
      window.store = store;
      // @ts-ignore
      window.lm = store.$wwt.inst.lm;
      const makeGuid = (string: string) => { return Guid.fromString(string); }
      // @ts-ignore
      window.makeGuid = makeGuid;

      if (iset !== null) {

        this.layer = null;

        const raDecZoom = {
          raRad: D2R * iset.get_centerX(),
          decRad: D2R * iset.get_centerY(),
          zoomDeg: place.get_zoomLevel()
        };
        const moveTime = store.timeToRADecZoom(raDecZoom) * 1000;
        const minMoveTime = 2000;
        const useFade = moveTime > minMoveTime;

        Object.keys(store.imagesetLayers).forEach((id) => {
          const layer = store.imagesetLayerById(id);
          if (layer === null) {
            return;
          }

          if (useFade) {

            // If the layer is already at partial opacity,
            // we can make the fadeout that much quicker
            const tweenTime = layer.opacity * minMoveTime;
            const tweenOptions = {
              time: tweenTime,
              done: () => store.deleteLayer(id)
            };
            tween(layer.opacity, 0, (value) => setLayerOpacity(layer, value), tweenOptions);
          } else {
            store.deleteLayer(id);
          }
        });

        this.layer = await store.addImageSetLayer({
          url: item.url,
          name: name,
          mode: "preloaded",
          goto: false
        });

        // If we use this block, set goto: false in the addImageSetLayer call above
        if (this.layer !== null) {
            applyImageSetLayerSetting(this.layer, ["opacity", 0]);
        }

        store.gotoRADecZoom({
          ...raDecZoom,
          instant: false
        });
        if (this.layer !== null) {

          if (useFade) {
            const t0 = (moveTime - minMoveTime) / moveTime;
            const A = 1/(1-t0);
            const tweenOptions = {
              time: moveTime,
              ease: (t: number) => {
                if (t < t0) { return 0; }
                return Math.pow(A*(t-t0), 1);
              }
            };
            tween(0, 1, (value) => setLayerOpacity(this.layer, value), tweenOptions);
          } else {
            setLayerOpacity(this.layer, 1);
          }
        }
      } else {
        store.gotoRADecZoom({
          raRad: D2R * place.get_RA(),
          decRad: H2R * place.get_dec(),
          zoomDeg: place.get_zoomLevel(),
          instant: false
        });
      }

    },
    async loadInitialItems() {
      this.loadNextPage().then(() => {
        (this.$refs.splide as typeof Splide).index = 0;
        this.itemSelected(this.items[0]);
      });
      
    }
  },
  watch: {
    horizontal: function(horizontal) {
      const direction = horizontal ? 'ltr' : 'ttb';
      this.splideOptions = { ...this.splideOptions, direction };
    }
  }
});
</script>

<style scoped lang="less">

#feed-root {
  height: 100%;
}

.feed {
  height: 100%;
  padding: 10px;
  background: black;
}

.feed-item {
  align-content: center;
  background: black;
  border: 1px solid white;
  border-radius: 5px;
  margin-left: 10px;

  img {
    margin: auto;
  }

  .name, p {
    color: white;
    font-size: 10pt;
    margin: auto;
  }
}

.splide__slide.is-active .feed-item {
  box-shadow: 0px 0px 10px white;
}

.splide__slide:not(.is-active) .feed-item {
  filter: brightness(0.5);
}

// .splide__slide.is-prev .feed-item {
// }

// .splide__slide.is-next .feed-item {
// }

.splide {
  height: 100%;
  overflow: hidden;
}

:deep(.splide__track) {
  height: 100% !important;
  overflow: hidden;
}
</style>
