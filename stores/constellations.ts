import { defineStore } from "pinia"

import { SceneDisplayInfoT } from "../utils/types";

export interface WWTConstellationsPiniaState {
  loggedIn: boolean;
  showWWT: boolean;
  viewNeedsInitialization: boolean;
  desiredScene: SceneDisplayInfoT | null;
};

export const useConstellationsStore = defineStore('wwt-constellations', {
  state: (): WWTConstellationsPiniaState => ({
    loggedIn: false,
    showWWT: true,
    viewNeedsInitialization: true,
    desiredScene: null,
  })
});
