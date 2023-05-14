// Copyright 2023 the .NET Foundation

import * as t from "io-ts";

export const PlaceDetails = t.type({
  ra_rad: t.number,
  dec_rad: t.number,
  roll_rad: t.union([t.number, t.undefined]),
  roi_height_deg: t.number,
  roi_aspect_ratio: t.number,
});

export type PlaceDetailsT = t.TypeOf<typeof PlaceDetails>;

export const ImageWwt = t.type({
  base_degrees_per_tile: t.number,
  bottoms_up: t.boolean,
  center_x: t.number,
  center_y: t.number,
  file_type: t.string,
  offset_x: t.number,
  offset_y: t.number,
  projection: t.string,
  quad_tree_map: t.string,
  rotation: t.number,
  tile_levels: t.number,
  width_factor: t.number,
  thumbnail_url: t.string,
});

export type ImageWwtT = t.TypeOf<typeof ImageWwt>;

export const ImageStorage = t.type({
  legacy_url_template: t.union([t.string, t.undefined]),
});

export type ImageStorageT = t.TypeOf<typeof ImageStorage>;

export const ImageDisplayInfo = t.type({
  wwt: ImageWwt,
  storage: ImageStorage,
});

export type ImageDisplayInfoT = t.TypeOf<typeof ImageDisplayInfo>;

export const SceneImageLayerHydrated = t.type({
  image: ImageDisplayInfo,
  opacity: t.number,
});

export type SceneImageLayerHydratedT = t.TypeOf<typeof SceneImageLayerHydrated>;

export const SceneContentHydrated = t.intersection([
  t.partial({
    background: ImageDisplayInfo,
  }),
  t.type({
    image_layers: t.union([t.array(SceneImageLayerHydrated), t.undefined]),
  })
]);

export type SceneContentHydratedT = t.TypeOf<typeof SceneContentHydrated>;

export const SceneDisplayInfo = t.type({
  place: PlaceDetails,
  content: SceneContentHydrated,
});

export type SceneDisplayInfoT = t.TypeOf<typeof SceneDisplayInfo>;

export const ScenePreviews = t.partial({
  video: t.string,
  thumbnail: t.string,
});

export type ScenePreviewsT = t.TypeOf<typeof ScenePreviews>;

// Older types, potentially to be removed:

export const ImagesetLayerDetails = t.type({
  url: t.string,
  name: t.string,
  opacity: t.number,
});

export type ImagesetLayerDetailsT = t.TypeOf<typeof ImagesetLayerDetails>;

export const Scene = t.type({
  name: t.string,
  imagesetLayers: t.array(ImagesetLayerDetails),
  background: t.string,
  user: t.string,
  place: PlaceDetails,
});

export type SceneT = t.TypeOf<typeof Scene>;

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
