import { $Fetch } from "ofetch";
import { defineStore } from "pinia";
import { useBreakpoints } from "@vueuse/core";

import { getHomeTimeline, getHandleTimeline, GetSceneResponseT, TimelineResponseT } from "~/utils/apis";
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

  // The history of visited scenes
  const sceneHistory = ref<GetSceneResponseT[]>([]);
  const historyIndex = ref(-1);
  const futureScenes = ref<GetSceneResponseT[]>([]);

  type ScenesGetter = (fetcher: $Fetch, pageNum: number) => Promise<TimelineResponseT>;

  let getNextScenes: ScenesGetter | null = getHomeTimeline;
  let nextNeededPage = 0;
  type NextSceneSourceType = { type: 'global' } |
                             { type: 'handle'; handle: string } |
                             { type: 'nearby', baseID: string };
  let nextSceneSource: NextSceneSourceType = { type: 'global' };


  // Set up state for a single scene. NOTE: before calling this function, you
  // must have already set timelineSource to null and let a render clock tick
  // elapse! This is because the watcher for changes to `timelineSource` below
  // will reset knownScenes. This is all quite gnarly and gross and should be
  // rationalized.
  function setupForSingleScene(scene: GetSceneResponseT) {
    describedScene.value = scene;
    desiredScene.value = {
      id: scene.id,
      place: scene.place,
      content: scene.content,
    };
    knownScenes.value.set(scene.id, scene);
    moveHistoryToScene(scene.id);
  }

  async function ensureForwardCoverage(n: number) {
    if (getNextScenes === null) {
      return;
    }

    const MAX_ATTEMPTS = 5;
    const targetLength = n;
    const { $backendCall } = useNuxtApp();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (futureScenes.value.length >= targetLength) {
        break;
      }

      const page = nextNeededPage;
      const result = await getNextScenes($backendCall, page);

      if (nextNeededPage === page) {
        for (const scene of result.results) {
          knownScenes.value.set(scene.id, scene);
          futureScenes.value.push(scene);
        }
      }

      nextNeededPage += 1;
    }
  }

  function moveBack(count=1) {
    // We're at the beginning of the history - there's nowhere back to go
    if (sceneHistory.value.length === 0 || historyIndex.value === 0) {
      return;
    }
    historyIndex.value = Math.max(0, historyIndex.value - count);;
    desiredScene.value = sceneHistory.value[historyIndex.value];
  }

  async function moveForward(count=1) {
    if (count <= 0) {
      return;
    }
    let scene: GetSceneResponseT | undefined = undefined;
    
    // The first argument to `Math.min` is to account for the setup case where sceneHistory is empty
    const canMoveForwardInHistory = Math.min(sceneHistory.value.length, count, sceneHistory.value.length - 1 - historyIndex.value);

    // The setup here is so that we only modify scene history and index once, at the end
    let remaining = count - canMoveForwardInHistory;
    let index = historyIndex.value + canMoveForwardInHistory;
    const scenesToAdd: GetSceneResponseT[] = [];

    while (remaining > 0) {
      if (futureScenes.value.length === 0) {
        await ensureForwardCoverage(remaining); // Should this be larger?
      }
      scene = futureScenes.value.shift();
      if (scene) {
        scenesToAdd.push(scene);
        index += 1;
      }
      remaining -= 1;
    }

    index = Math.max(0, index);
    sceneHistory.value = sceneHistory.value.concat(scenesToAdd);
    historyIndex.value = index;
  }

  async function moveHistoryToScene(id: string) {
    updateNextSceneSource({ type: 'nearby', baseID: id });
    let scene = knownScenes.value.get(id);
    if (scene === undefined) {
      const { $backendCall } = useNuxtApp();
      const fetchedScene = await getScene($backendCall, id);
      if (fetchedScene === null) {
        return;
      }
      scene = fetchedScene;
    }
    await ensureForwardCoverage(8);

    sceneHistory.value.push(scene);
    historyIndex.value += 1;
  }

  function previousScene(): GetSceneResponseT | null {
    return sceneHistory.value[historyIndex.value - 1] ?? null;
  }

  function needToChangeSceneSource(source: NextSceneSourceType) {
    return !((source.type === 'global' && nextSceneSource.type === 'global') ||
             (source.type === 'handle' && nextSceneSource.type === 'handle' && source.handle === nextSceneSource.handle) ||
             (source.type === 'nearby' && nextSceneSource.type === 'nearby' && source.baseID === nextSceneSource.baseID));
  }

  function updateNextSceneSource(source: NextSceneSourceType) {
    if (!needToChangeSceneSource(source)) {
      return;
    }
    if (source.type === 'global') {
      getNextScenes = getHomeTimeline;
    } else if (source.type === 'handle') {
      getNextScenes = (fetcher, page) => getHandleTimeline(fetcher, source.handle, page);
    } else if (source.type === 'nearby') {
      // TODO: How to handle pagination for the nearby timeline?
      getNextScenes = async (fetcher, page) => {
        if (page === 0) {
          return getNearbyTimeline(fetcher, source.baseID);
        } else {
          return { results: [] };
        }
      }
    }
    
    sceneHistory.value = sceneHistory.value.splice(historyIndex.value);
    futureScenes.value = [];
    nextNeededPage = 0;
  }

  function useGlobalTimeline() {
    updateNextSceneSource({ type: 'global' });
  }

  function useHandleTimeline(handle: string) {
    updateNextSceneSource({ type: 'handle', handle });
  }

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
    isMobile,
    isMovingToScene,
    knownScenes,
    loggedIn,
    roiEditHeightPercentage,
    roiEditWidthPercentage,
    setupForSingleScene,
    showWWT,
    viewNeedsInitialization,
    viewportBottomBlockage,
    viewportLeftBlockage,

    sceneHistory,
    historyIndex,
    futureScenes,
    moveBack,
    moveForward,
    moveHistoryToScene,
    previousScene,
    ensureForwardCoverage,
    useGlobalTimeline,
    useHandleTimeline
  }
});
