export interface PlaceDetails {
  raRad: number;
  decRad: number;
  zoomDeg: number;
  rollRad?: number;
}

export function isPlaceDetails(item: any): item is PlaceDetails {
  return typeof item.raRad === "number" &&
         typeof item.decRad === "number" &&
         typeof item.zoomDeg === "number" &&
         item.rollRad === undefined || typeof item.rollRad === "number";
}

export interface ImagesetLayerDetails {
  url: string;
  name: string;
  opacity: number;
}

export function isImagesetLayerDetails(item: any): item is ImagesetLayerDetails {
  return typeof item.url === "string" &&
         typeof item.name === "string" &&
         typeof item.opacity === "number";
}

export interface Scene {
  name: string;
  imagesetLayers: ImagesetLayerDetails[];
  background: string;
  user: string;
  place: PlaceDetails;
}

export function isScene(item: any): item is Scene {
  const types = Array.isArray(item.imagesets) &&
                typeof item.name === "string" &&
                typeof item.user === "string" &&
                typeof item.background === "string" &&
                isPlaceDetails(item.place);
    if (!types) {
      return false;
    }

  return item.imagesets.every(isImagesetLayerDetails);
}

export interface FitsColorMaps {
  wwt: string;
  desc: string;
}

export class BackgroundImageset {
  public imagesetName: string;
  public displayName: string;

  constructor(displayName: string, imagesetName: string) {
    this.displayName = displayName;
    this.imagesetName = imagesetName;
  }
}
