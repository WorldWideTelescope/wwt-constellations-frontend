<template>
  <div id="feed-root">
    <div class="feed">
      <Splide
        :options="splideOptions"
        @splide:click="(_event: MouseEvent, splideData: object) => {
          $refs.splide.go(splideData.index);
        }"
        ref="splide"
      >
        <SplideSlide
          v-for="(item, index) in items"
          :key="index"
        >
          <div
            class="feed-item"
            @click="goToItem(item)"
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
      class="loader"
    >
      <template #no-more><div>ALL DONE</div></template>
    </VueEternalLoading>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { LoadAction } from "@ts-pro/vue-eternal-loading";
import { Place } from '@wwtelescope/engine';

const D2R = Math.PI / 180.0;

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
        pagination: false,
        lazyLoad: 'nearby',
        gap: "30px",
        updateOnMove: true
      }
    };
  },
  props: {
    wwtReady: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    async loadItems(page: number): Promise<Item[]> {
      const url = `http://localhost:8000/data?page=${page}&limit=${this.pageSize}`;
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
          if (imageset) {
              const isetUrl = imageset.get_url();
              result.push({ place, url: isetUrl });
          }
          //result.push({place, url});
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
    async goToItem(item: Item) {
      const store = this.$engineStore(this.$pinia);
      const place = item.place;
      const iset = place.get_studyImageset();
      console.log(place);
      console.log(iset);
      if (iset !== null) {
        const layer = await store.addImageSetLayer({
          url: item.url,
          name: place.get_name(),
          mode: "preloaded",
          goto: true
        });
        console.log(layer);
        console.log(place.get_name());
        console.log(item.url);
      }
      store.gotoRADecZoom({
        raRad: D2R * place.get_RA(),
        decRad: D2R * place.get_dec(),
        zoomDeg: place.get_zoomLevel(),
        instant: false
      });
    }
  },
  watch: {
    '$refs.splide.index': function(index) {
      this.goToItem(this.items[index]);
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
    }
  }
});
</script>

<style scoped lang="less">

#feed-root {
  height: 100%;
  background: black;
}

.feed {
  background: black;
  height: 100%;
  padding: 10px;
}

.feed-item {
  align-content: center;
  background: black;
  border: 1px solid white;
  border-radius: 5px;

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

.splide__slide.is-prev .feed-item {
  filter: brightness(0.5);
}

.splide__slide.is-next .feed-item {
  filter: brightness(0.5);
}

.splide, .splide__track {
  height: 100%;
  overflow: hidden;
}
</style>
