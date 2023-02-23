export interface PlaceDetails {
  raRad: number;
  decRad: number;
  zoomDeg: number;
  rollRad?: number;
}

export function isPlace(item: any): item is PlaceDetails {
  return typeof item.raRad === "number" &&
         typeof item.decRad === "number" &&
         typeof item.zoomDeg === "number" &&
         item.rollRad === undefined || typeof item.rollRad === "number";
}

export interface Scene {
  name: string;
  imageIDs: string[];
  user: string;
  place: PlaceDetails;
}

export function isScene(item: any): item is Scene {
  const types = Array.isArray(item.imageIDs) &&
                typeof item.name === "string" &&
                typeof item.user === "string" &&
                isPlace(item.place);
    if (!types) {
      return types;
    }

  const urls = item.imageIDs as string[];
  return urls.every(url => typeof url === "string");
}