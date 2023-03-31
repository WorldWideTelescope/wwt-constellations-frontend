import { Imageset, Place } from "@wwtelescope/engine";
import { ProjectionType } from "@wwtelescope/engine-types";

import { ImageDisplayInfoT } from "./types";

export function getEngineStore() {
  const { $engineStore, $wwtPinia } = useNuxtApp();
  return $engineStore($wwtPinia);
}

export function raDecForImageset(imageset: Imageset) {
  return {
    raRad: D2R * imageset.get_centerX(),
    decRad: D2R * imageset.get_centerY(),
  };
}

export function raDecZoomForPlace(place: Place) {
  return {
    raRad: D2R * place.get_RA(),
    decRad: H2R * place.get_dec(),
    zoomDeg: place.get_zoomLevel(),
  };
}

const projection_type_map: { [t: string]: ProjectionType } = {
  // sigh, more redundancy
  "Mercator": ProjectionType.mercator,
  "Equirectangular": ProjectionType.equirectangular,
  "Healpix": 7, // yikes!
  "Tan": ProjectionType.tan,
  "Toast": ProjectionType.toast,
  "Spherical": ProjectionType.spherical,
  "SkyImage": ProjectionType.skyImage,
  "Plotted": ProjectionType.plotted,
}

export function imageInfoToSet(info: ImageDisplayInfoT): Imageset {
  const img = new Imageset();

  img.set_baseTileDegrees(info.wwt.base_degrees_per_tile);
  img.set_bottomsUp(info.wwt.bottoms_up);
  img.set_centerX(info.wwt.center_x);
  img.set_centerY(info.wwt.center_y);
  img.set_extension(info.wwt.file_type);
  img.set_offsetX(info.wwt.offset_x);
  img.set_offsetY(info.wwt.offset_y);
  img.set_projection(projection_type_map[info.wwt.projection]);
  img.set_quadTreeTileMap(info.wwt.quad_tree_map);
  img.set_rotation(info.wwt.rotation);
  img.set_levels(info.wwt.tile_levels);
  img.set_widthFactor(info.wwt.width_factor);
  img.set_thumbnailUrl(info.wwt.thumbnail_url);

  if (info.storage.legacy_url_template) {
    img.set_url(info.storage.legacy_url_template);
  }

  img.set_imageSetID(img.getHashCode());
  return img;
}