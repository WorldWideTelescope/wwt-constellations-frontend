<template>
  <div id="feed-root">
    <div class="feed">
      <Splide
        :options="splideOptions"
        @splide:click="(_event, splideData) => {
          $refs.splide.go(splideData.index);
        }"
        @splide:move="(_event, newIndex, _oldIndex) => {
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
            @click="itemSelected(item)"
            >
              <img
                class="thumbnail"
                :src="item.place.get_thumbnailUrl()"
              />
              
              <h3 class="name"> {{ item.place.get_name() }}</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
          </div>
        </SplideSlide>
      </Splide>
    </div>

    <VueEternalLoading
      :load="load"
      :is-initial="true"
      position="left"
      class="loader"
    >
      <template #no-more><div></div></template>
    </VueEternalLoading>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { LoadAction } from "@ts-pro/vue-eternal-loading";
import { ImageSetLayer, Place } from '@wwtelescope/engine';
import { applyImageSetLayerSetting } from '@wwtelescope/engine-helpers';
import { FadeType } from '@wwtelescope/engine-types';

const D2R = Math.PI / 180.0;
const D2H = Math.PI / 15.0;

interface Item {
  place: Place;
  url: string;
}

export default defineComponent({
  data() {
    return {
      page: 1,
      pageSize: 10,
      items: [] as Item[],
      splideOptions: {
        focus: 'center',
        perPage: 3,
        direction: 'ttb',
        heightRatio: 5,
        perMove: 1,
        arrows: false,
        pagination: false,
        lazyLoad: 'nearby',
        gap: "30px",
        updateOnMove: true,
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
    console.log(this);
  },
  methods: {
    log(x: any) { console.log(x); },
    async loadItems(page: number): Promise<Item[]> {
      //const url = `http://localhost:8000/data?page=${page}&limit=${this.pageSize}`;
      const url = "http://data1.wwtassets.org/packages/2022/07_jwst/jwst_first_v2.wtml";
      console.log(url);
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
          console.log(imageset?.get_url());
          if (imageset) {
              const isetUrl = imageset.get_url();
              result.push({ place, url: isetUrl });
          }
      }
      return result;
    },
    async load({ loaded }: LoadAction): Promise<void> {
      console.log(`Loading: page = ${this.page}`);
      const loadedItems = await this.loadItems(this.page);
      this.items.push(...loadedItems);
      this.page += 1;
      loaded(loadedItems.length, this.pageSize);
    },
    async itemSelected(item: Item) {
      const store = this.$engineStore(this.$pinia);
      console.log(store);
      const place = item.place;
      const studyImageset = place.get_studyImageset();
      if (studyImageset == null) {
        return;
      }
      const name = studyImageset.get_name();
      const iset = store.lookupImageset(name);
      if (iset !== null) {
        if (this.layer) {
          //@ts-ignore
          applyImageSetLayerSetting(this.layer, ["fadeType", FadeType.fadeOut]);
          applyImageSetLayerSetting(this.layer, ["fadeSpan", 10000]);
          this.layer.set_endTime(new Date(new Date().getTime() + 500));

          const guidToDelete = this.layer.id;
          if (guidToDelete) {
            setTimeout(() => {
              store.deleteLayer(guidToDelete);
              console.log("Deleted!");
            }, 11000);
          }
        }
        this.layer = await store.addImageSetLayer({
          url: item.url,
          name: name,
          mode: "preloaded",
          goto: true
        });
        // store.gotoRADecZoom({
        //   raRad: D2R * place.get_RA(),
        //   decRad: D2H * place.get_dec(),
        //   zoomDeg: place.get_zoomLevel(),
        //   instant: true
        // });
      }
    },
    async loadAndAdd(page: number) {
      this.items.push(...(await this.loadItems(page)));
    }
  },
  watch: {
    '$refs.splide.index': function(index) {
      this.itemSelected(this.items[index]);
    },
    wwtReady: async function(ready) {
      console.log(`wwtReady: ${ready}`);
      if (ready) {
        try {
          console.log(this);
          console.log(this.page);
          this.items = await this.loadItems(this.page);
          this.page += 1;
        } catch {
          console.log("No!")
        }
      }
    },
    horizontal: function(horizontal) {
      console.log("Horizontal:", horizontal);
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
