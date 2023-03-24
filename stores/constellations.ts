import { defineStore } from "pinia"

export interface WWTConstellationsPiniaState {
  loggedIn: boolean;
  showWWT: boolean;
};

export const useConstellationsStore = defineStore('wwt-constellations', {
  state: (): WWTConstellationsPiniaState => ({
    loggedIn: false,
    showWWT: true,
  })
});
