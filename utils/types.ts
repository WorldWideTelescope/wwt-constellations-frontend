// Copyright 2023 the .NET Foundation

import * as t from "io-ts";

export const PlaceDetails = t.type({
  ra_rad: t.number,
  dec_rad: t.number,
  zoom_deg: t.number,
  roll_rad: t.union([t.number, t.undefined]),
});

export type PlaceDetailsT = t.TypeOf<typeof PlaceDetails>;

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
