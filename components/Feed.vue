<template>
  <div id="feed-root">
    <div class="feed">
      <Splide :options="splideOptions" @splide:click="(splide: Splide, splideData: SlideComponent) => {
        splide.go(splideData.index);
      }" @splide:move="(_splide: Splide, newIndex: number, _oldIndex: number) => {
  loadIfNeeded(newIndex);
  itemSelected(items[newIndex]);
}" ref="splide">
        <SplideSlide v-for="(item, index) in items" :key="index">
          <div class="feed-item">
            <p>{{ item.text }}</p>
            <p>
              <NuxtLink :to="`/@${encodeURIComponent(item.handle.handle)}/${item.id}`">scene page</NuxtLink>
            </p>
          </div>
        </SplideSlide>
      </Splide>
    </div>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'vue'
import { ImageSetLayer } from '@wwtelescope/engine';
import { Splide, SlideComponent } from "@splidejs/splide";

import { useConstellationsStore } from "~/stores/constellations";
import { getHomeTimeline, GetSceneResponseT } from "../utils/apis";

export default defineNuxtComponent({
  data() {
    return {
      page: 1,
      pageSize: 10,
      items: [] as GetSceneResponseT[],
      splideOptions: {
        start: 2,
        focus: 'center',
        perPage: 3,
        height: '100%',
        perMove: 1,
        arrows: true,
        pagination: false,
        lazyLoad: 'nearby',
        updateOnMove: true,
        wheel: true,
        direction: 'ttb',
        trimSpace: true,
        padding: { top: 160 },
        breakpoints: {
          600: {
            direction: 'ltr',
            arrows: false
          }
        }
      },
      layer: null as (ImageSetLayer | null),
      tweenIn: null as Function | null,
      tweensOut: [] as Function[]
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
    // We need to do this during nextTick,
    // otherwise the WWTInstance hasn't yet been set
    nextTick(() => {
      this.loadInitialItems();
    });
  },

  methods: {
    async loadItems(page: number): Promise<GetSceneResponseT[]> {
      // Note that we are currently using $backendCall, not $backendAuth call,
      // because our feed isn't personalized. To get a personalized feed we'll
      // need to change that.
      const { $backendCall } = useNuxtApp();
      const result = await getHomeTimeline($backendCall, page);
      return result.results;
    },

    async loadNextPage(): Promise<GetSceneResponseT[]> {
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

    async itemSelected(item: GetSceneResponseT) {
      useConstellationsStore().desiredScene = {
        place: item.place,
        content: item.content,
      };
    },

    async loadInitialItems() {
      this.loadNextPage().then(() => {
        this.itemSelected(this.items[0]);
      });
    }
  },

  watch: {
    horizontal: function (horizontal) {
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
  padding: 0 15px 0 15px;
  transition: background-color 0.5s;

}

.feed:hover {
  background-color: rgba(200, 200, 200, 0.1);
}

.feed-item {
  align-content: center;
  background: black;
  border: 1px solid white;
  border-radius: 5px;
  transition: transform 0.5s;
  text-align: center;
  margin: 0 auto;

  img {
    margin: auto;
    object-fit: cover;
    width: 100%;
    border-radius: 5px 5px 0 0;
  }

  .name,
  p {
    color: white;
    font-size: 10pt;
    margin: auto;
    line-height: 15pt;
    padding: 5px;
  }
}

.feed-item:hover {
  box-shadow: 0px 0px 10px white;
}

.splide__slide.is-active .feed-item {
  box-shadow: 0px 0px 10px white;
  transform: scale(1);
}

.splide__slide:not(.is-active) .feed-item {
  filter: brightness(0.5);
  transform: scale(0.8);
}

.splide {
  height: 100%;
  overflow: hidden;
}
</style>