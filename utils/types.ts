// Copyright 2023 the .NET Foundation

import * as S from "@effect/schema/Schema";

import { Color } from "@wwtelescope/engine";

export const PlaceDetails = S.struct({
  ra_rad: S.number,
  dec_rad: S.number,
  roll_rad: S.union(S.number, S.undefined),
  roi_height_deg: S.number,
  roi_aspect_ratio: S.number,
});

export type PlaceDetailsT = S.Schema.To<typeof PlaceDetails>;

export const ImageWwt = S.struct({
  base_degrees_per_tile: S.number,
  bottoms_up: S.boolean,
  center_x: S.number,
  center_y: S.number,
  file_type: S.string,
  offset_x: S.number,
  offset_y: S.number,
  projection: S.string,
  quad_tree_map: S.string,
  rotation: S.number,
  tile_levels: S.number,
  width_factor: S.number,
  thumbnail_url: S.string,
});

export type ImageWwtT = S.Schema.To<typeof ImageWwt>;

export const ImageStorage = S.struct({
  legacy_url_template: S.union(S.string, S.undefined),
});

export type ImageStorageT = S.Schema.To<typeof ImageStorage>;

export const ImagePermissions = S.struct({
  copyright: S.string,
  license: S.string,
  credits: S.optional(S.string, { exact: true }),
});

export type ImagePermissionsT = S.Schema.To<typeof ImagePermissions>;

export const ImageDisplayInfo = S.struct({
  id: S.string,
  wwt: ImageWwt,
  storage: ImageStorage,
  permissions: ImagePermissions,
  alt_text: S.optional(S.string, { exact: true }),
});

export type ImageDisplayInfoT = S.Schema.To<typeof ImageDisplayInfo>;

export const SceneImageLayer = S.struct({
  image_id: S.string,
  opacity: S.number,
});

export type SceneImageLayerT = S.Schema.To<typeof SceneImageLayer>;

export const SceneImageLayerHydrated = S.struct({
  image: ImageDisplayInfo,
  opacity: S.number,
});

export type SceneImageLayerHydratedT = S.Schema.To<typeof SceneImageLayerHydrated>;

export const SceneContent = S.struct({
  image_layers: S.array(SceneImageLayer),
});

export type SceneContentT = S.Schema.To<typeof SceneContent>;

export const SceneContentHydrated = S.struct({
  image_layers: S.union(S.array(SceneImageLayerHydrated), S.undefined),
  background: S.optional(ImageDisplayInfo, { exact: true })
});

export type SceneContentHydratedT = S.Schema.To<typeof SceneContentHydrated>;

export const SceneDisplayInfo = S.struct({
  id: S.string,
  place: PlaceDetails,
  content: SceneContentHydrated,
});

export type SceneDisplayInfoT = S.Schema.To<typeof SceneDisplayInfo>;

export const SceneCreationInfo = S.struct({
  place: PlaceDetails,
  content: SceneContent,
  text: S.string,
  outgoing_url: S.optional(S.string, { exact: true }),
});

export type SceneCreationInfoT = S.Schema.To<typeof SceneCreationInfo>;

export const ScenePreviews = S.struct({
  video: S.optional(S.string, { exact: true }),
  thumbnail: S.optional(S.string, { exact: true }),
});

export type ScenePreviewsT = S.Schema.To<typeof ScenePreviews>;

export interface SkymapSceneInfo {
  id: string;
  place: PlaceDetailsT;
  content: SceneContentHydratedT;
  color: Color;
  linewidth: number;
  current: boolean;
  adjacent: boolean;
}

export const TessellationCell = S.struct({
  neighbors: S.array(S.string),
  location: S.struct({
    ra: S.number,
    dec: S.number,
  }),
  scene_id: S.string
});

export type TessellationCellT = S.Schema.To<typeof TessellationCell>;

// Older types, potentially to be removed:

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
