import { $Fetch } from "ofetch";
import { defineStore } from "pinia";
import { useBreakpoints } from "@vueuse/core";

import { getHomeTimeline, getHandleTimeline, GetSceneResponseT } from "~/utils/apis";
import { SceneDisplayInfoT } from "~/utils/types";

export const useConstellationsStore = defineStore("wwt-constellations", () => {
  // Whether the user is logged in.
  const loggedIn = ref(false);

  // Whether we seem to be in a mobile layout

  const breakpoints = useBreakpoints({
    tablet: 640,
    laptop: 1024,
    desktop: 1280,
  });

  const isMobile = breakpoints.smaller("laptop");

  // Whether the WWT viewer should be shown. This will be false for some
  // administrative screens. This is a state parameter because we don't want to
  // repeatedly create and destroy the WWT widget, so we include it in the very
  // root of the app layout.
  const showWWT = ref(true);

  // This is true when the WWT view is initially created. In that case, when the
  // first scene to display is selected, we warp straight to its location,
  // rather than slewing.
  const viewNeedsInitialization = ref(true);

  // Scenes whose information we've loaded, keyed by their IDs.
  const knownScenes = ref<Map<string, GetSceneResponseT>>(new Map());

  // The scene whose information should be displayed in the main overlay.
  const describedScene = ref<GetSceneResponseT | null>(null);

  // The desired scene for the WWT viewer to display, and the detailed
  // information that the engine needs to show it. The scene may not actually be
  // centered in the view if the user has panned elsewhere, if we're currently
  // slewing towards it, etc.
  const desiredScene = ref<SceneDisplayInfoT | null>(null);

  // The ordered list of scene IDs that constitutes our current "timeline". This
  // list is completed from the start of the timeline to as far as it goes; we
  // may be able to extend it by fetching more scenes. If we are not currently
  // navigating a timeline, the list is empty. All of these scene IDs must have
  // corresponding records in the `knownScenes` map.
  const timeline = ref<string[]>([]);

  // The index of the currently viewed scene within the `timeline` array.
  // Someone should make sure that this selection, `describedScene`, and
  // `desiredScene` stay in some reasonable level of synchronization, but they
  // can in principle vary. This should be -1 if nothing is selected or we're
  // not in a timeline mode (i.e., `timeline` is empty).
  const timelineIndex = ref(-1);

  // The source of further items for the timeline, if we need them. There are
  // three broad possibilities. If this is null, we're not in a timeline mode,
  // and there's nothing to fetch. If this is the empty string, we're exploring
  // the "home" timeline. Otherwise, the value of this field is the name of a
  // handle, and we're exploring that handle's timeline.
  const timelineSource = ref<string | null>("");

  var getTimeline: typeof getHomeTimeline | null = getHomeTimeline;
  var nextTimelinePage = 0;

  // Ensure that the timeline data structure extends at least `n` items past the
  // current index. If the timeline was initially empty, this will set the
  // current index to the first position. If something fails badly in the
  // backend, it is possible that this function will give up without actually
  // achieving its goal.
  async function ensureTimelineCoverage(n: number) {
    // If we're not in a timeline mode, the most appropriate thing to do is
    // nothing.
    if (getTimeline === null) {
      return;
    }

    const init_index = (timelineIndex.value < 0);
    const target_length = init_index ? n : timelineIndex.value + n;
    const MAX_ATTEMPTS = 5;

    // Note that we are currently using $backendCall, not $backendAuthCall,
    // because none of the feeds are personalized. To get personalized feeds
    // we'll need to change that. (And we might also need to fix things up so
    // that we can make authenticated calls in the server-side rendering phase.)
    const { $backendCall } = useNuxtApp();

    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (timeline.value.length >= target_length) {
        break;
      }

      const result = await getTimeline($backendCall, nextTimelinePage);

      for (var scene of result.results) {
        knownScenes.value.set(scene.id, scene);
        timeline.value.push(scene.id);
      }

      nextTimelinePage += 1;
    }

    if (init_index) {
      timelineIndex.value = 0;
    }
  }

  watch(timelineSource, async (newSource, oldSource) => {
    if (newSource == null) {
      getTimeline = null;
      nextTimelinePage = 0;
      timeline.value = [];
      timelineIndex.value = -1;
      knownScenes.value = new Map();
    } else if (newSource != oldSource) {
      if (newSource == "") {
        getTimeline = getHomeTimeline;
      } else {
        getTimeline = (fetcher: $Fetch, page: number) => getHandleTimeline(fetcher, newSource, page);
      }

      nextTimelinePage = 0;
      timeline.value = [];
      timelineIndex.value = -1;
    }
  });

  // Cross-component plumbing for the region-of-interest display

  const roiEditHeightPercentage = ref(50);
  const roiEditWidthPercentage = ref(50);

  // Cross-component plumbing for positioning the WWT camera

  const viewportLeftBlockage = ref(0);
  const viewportBottomBlockage = ref(0);


  const isMovingToScene = ref(false);

  return {
    describedScene,
    desiredScene,
    ensureTimelineCoverage,
    isMobile,
    knownScenes,
    loggedIn,
    roiEditHeightPercentage,
    roiEditWidthPercentage,
    showWWT,
    timeline,
    timelineIndex,
    timelineSource,
    viewNeedsInitialization,
    viewportBottomBlockage,
    viewportLeftBlockage,
    isMovingToScene
  }
});
