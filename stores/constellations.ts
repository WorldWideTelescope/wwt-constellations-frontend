import { defineStore } from "pinia"

export interface WWTConstellationsPiniaState {
  userLoggedIn: boolean;
};

export const useConstellationsStore = defineStore('wwt-constellations', {
  state: (): WWTConstellationsPiniaState => ({
    userLoggedIn: false
  })
});
