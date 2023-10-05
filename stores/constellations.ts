import { $Fetch } from "ofetch";
import { defineStore } from "pinia";
import { useBreakpoints } from "@vueuse/core";
import Yallist from "yallist";

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
  const sceneHistory = ref(new Yallist<GetSceneResponseT>());
  const currentHistoryNode = ref<Yallist.Node<GetSceneResponseT> | null>(sceneHistory.value.head);
  const futureScenes = ref<GetSceneResponseT[]>([]);

  type ScenesGetter = (fetcher: $Fetch, pageNum: number) => Promise<TimelineResponseT>;

  let getNextScenes: ScenesGetter | null = getHomeTimeline;
  let nextNeededPage = 0;
  type NextSceneSourceType = { type: 'global' } |
                             { type: 'single-scene', id: string } |
                             { type: 'handle'; handle: string } |
                             { type: 'nearby', baseID: string };
  let nextSceneSource = ref<NextSceneSourceType>({ type: 'global' });


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
    updateNextSceneSource({ type: 'single-scene', id: scene.id });
    moveHistoryToScene(scene.id);
  }

  // Ensure that the future scenes data structure contains at least `n` items.
  // If something fails badly in the backend, it is possible that this function
  // will give up without actually achieving its goal.
  async function ensureForwardCoverage(n: number) {
    if (getNextScenes === null) {
      return;
    }

    // Note that we are currently using $backendCall, not $backendAuthCall,
    // because none of the feeds are personalized. To get personalized feeds
    // we'll need to change that. (And we might also need to fix things up so
    // that we can make authenticated calls in the server-side rendering phase.)
    const MAX_ATTEMPTS = 5;
    const targetLength = n;
    const navigationMode = nextSceneSource;
    const { $backendCall } = useNuxtApp();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {

      // If, during one of our asynchronous attempts, the app has
      // changed its navigation mode, return.
      // Note that we need to check the entire `nextSceneSource` object
      // and not just the `type` member. For example, if we switch handles, the
      // `type` will be unchanged.
      if (navigationMode !== nextSceneSource) {
        return;
      }

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
    let remaining = count;
    while (remaining > 0 && currentHistoryNode.value?.prev) {
      const prevNode = currentHistoryNode.value?.prev;
      const prev = prevNode?.value;
      if (prevNode && prev) {
        currentHistoryNode.value = prevNode;
        desiredScene.value = prev;
      }
      remaining -= 1;
    }
  }

  async function moveForward(count=1) {
    if (count <= 0) {
      return;
    }
    let scene: GetSceneResponseT | undefined = undefined;
    const scenesToAdd: GetSceneResponseT[] = [];

    let remaining = count;
    while (remaining > 0) {
      const next = currentHistoryNode.value?.next;
      if (next) {
        scene = next.value;
      } else {
        if (futureScenes.value.length === 0) {
          await ensureForwardCoverage(remaining);  // Should this be larger?
        }
        scene = futureScenes.value.shift();
        if (scene) {
          scenesToAdd.push(scene);
        }
      }
      remaining--;
    }

    sceneHistory.value.push(...scenesToAdd);
    if (scene) {
      currentHistoryNode.value = sceneHistory.value.tail;
    }

  }

  async function moveHistoryToScene(id: string) {
    let scene = knownScenes.value.get(id);
    if (scene === undefined) {
      const { $backendCall } = useNuxtApp();
      const fetchedScene = await getScene($backendCall, id);
      if (fetchedScene === null) {
        return;
      }
      scene = fetchedScene;
    }

    sceneHistory.value.push(scene);
    currentHistoryNode.value = sceneHistory.value.tail;
  }

  function previousScene(): GetSceneResponseT | null {
    return currentHistoryNode.value?.prev?.value ?? null;
  }

  function needToChangeSceneSource(source: NextSceneSourceType) {
    return !((source.type === 'global' && nextSceneSource.value.type === 'global') ||
             (source.type === 'single-scene' && nextSceneSource.value.type === 'single-scene') ||
             (source.type === 'handle' && nextSceneSource.value.type === 'handle' && source.handle === nextSceneSource.value.handle) ||
             (source.type === 'nearby' && nextSceneSource.value.type === 'nearby' && source.baseID === nextSceneSource.value.baseID));
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
    } else if (source.type === 'single-scene') {
      getNextScenes = async (_fetcher, _page) => { return { results: [] }; };
    }
    
    nextSceneSource.value = source;
    sceneHistory.value.tail = currentHistoryNode.value;
    const currentNode = currentHistoryNode.value;
    if (currentNode) {
      currentNode.prev = null;
    }
    futureScenes.value = [];
    nextNeededPage = 0;
  }

  function useGlobalTimeline() {
    updateNextSceneSource({ type: 'global' });
  }

  function useHandleTimeline(handle: string) {
    updateNextSceneSource({ type: 'handle', handle });
  }

  function useNearbyTimeline(baseID: string) {
    updateNextSceneSource({ type: 'nearby', baseID });
    moveHistoryToScene(baseID);
    ensureForwardCoverage(8);
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
    currentHistoryNode,
    futureScenes,
    moveBack,
    moveForward,
    moveHistoryToScene,
    previousScene,
    ensureForwardCoverage,
    useGlobalTimeline,
    useHandleTimeline,
    useNearbyTimeline,
    nextSceneSource,
  }
});
