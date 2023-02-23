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

export interface ImagesetDetails {
  url: string;
  name: string;
}

export function isImagesetDetails(item: any): item is ImagesetDetails {
  return typeof item.url === "string" && typeof item.name === "string";
}

export interface Scene {
  name: string;
  imagesets: ImagesetDetails[];
  user: string;
  place: PlaceDetails;
}

export function isScene(item: any): item is Scene {
  const types = Array.isArray(item.imagesets) &&
                typeof item.name === "string" &&
                typeof item.user === "string" &&
                isPlaceDetails(item.place);
    if (!types) {
      return false;
    }

  return item.imagesets.every(isImagesetDetails);
}
