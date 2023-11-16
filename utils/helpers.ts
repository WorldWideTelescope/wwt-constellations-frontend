import { Imageset } from "@wwtelescope/engine";
import { ImageSetType, ProjectionType } from "@wwtelescope/engine-types";

import { ImageDisplayInfoT, PlaceDetailsT } from "./types";
import { v5 } from "uuid";

const wwtNamespace = "1420736a-a637-40a7-813a-ba692e72204e";

export function getEngineStore() {
  const { $engineStore, $wwtPinia } = useNuxtApp();
  return $engineStore($wwtPinia);
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

export interface ViewportShape {
  width: number;
  height: number;
  left_blockage: number;
  bottom_blockage: number;
}

export interface WWTCameraSetup {
  raRad: number;
  decRad: number;
  rollRad: number;
  zoomDeg: number;
}

/** Given a target region of interest, and some current parameters for the
 * viewport, figure out how we should set up the WWT camera.
 *
 * There are two non-trivial items to figure out here. First, WWT's definition
 * of its zoom setting is the height of the viewport in degrees, times six. To
 * figure out the right zoom for a place, we need to know the shape of the
 * region of interest, and the shape of the viewport, so that we can be sure
 * everything fits. We pad out the number a little bit so give a nice margin on
 * the edge.
 *
 * Second, the WWT canvas might have overlays that we need to avoid. We might
 * have to offset the effective center of the WWT camera to center the region of
 * interest in the un-blocked part of the viewport.
 */
export function wwtSetupForPlace(place: PlaceDetailsT, viewport_shape: ViewportShape): WWTCameraSetup {
  const rollRad = place.roll_rad ?? 0;

  // If we're transitioning out of a `showWWT = false` situation, the viewport size
  // will be invalid. In that case, we can't do anything fancy, so don't.

  if (viewport_shape.width < 1 || viewport_shape.height < 1) {
    return {
      raRad: place.ra_rad,
      decRad: place.dec_rad,
      rollRad,
      zoomDeg: place.roi_height_deg * 6,
    };
  }

  const effective_width = Math.max(viewport_shape.width - viewport_shape.left_blockage, 1);
  const effective_height = Math.max(viewport_shape.height - viewport_shape.bottom_blockage, 1);

  // If the viewport is half blocked on the bottom, the zoom setting should be
  // double what it would otherwise be (i.e., more zoomed out).
  const v_height_deg = place.roi_height_deg * viewport_shape.height / effective_height;

  // To calculate the zoom setting that's appropriate for the horizontal aspect,
  // we have the same considerations as above, plus we need to "translate" from
  // horizontal to vertical contexts. We can think of the zoom setting as
  // setting the deg-per-px scale, then multiplying by the viewport height.
  const roi_width_deg = place.roi_height_deg * place.roi_aspect_ratio;
  const h_width_deg = roi_width_deg * viewport_shape.width / effective_width;
  const h_height_deg = h_width_deg * viewport_shape.height / viewport_shape.width;

  // The final zoom is the larger of whichever value we figured out for the
  // horizontal and vertical axes -- we'd rather have extra empty space around
  // the image, rather than cutting it off.
  const ZOOM_PAD_FACTOR = 1.2;
  const zoomDeg = Math.max(v_height_deg, h_height_deg) * 6 * ZOOM_PAD_FACTOR;

  // Now adjust the pointing center based on potential blockages to the
  // viewport. We need to compute an RA/dec offset vector, then potentially
  // rotate it based on the final camera roll angle. All of these calculations
  // are done naively with regard to spherical coordinates.

  const deg_per_px = zoomDeg / (6 * viewport_shape.height);
  const delta_ra_0 = 0.5 * D2R * viewport_shape.left_blockage * deg_per_px;
  const delta_dec_0 = -0.5 * D2R * viewport_shape.bottom_blockage * deg_per_px;
  const cos_roll = Math.cos(rollRad);
  const sin_roll = Math.sin(rollRad);
  const delta_ra = cos_roll * delta_ra_0 + sin_roll * delta_dec_0;
  const delta_dec = -sin_roll * delta_ra_0 + cos_roll * delta_dec_0;

  // Apply the offset, clamping due to aforementioned naivete. To be honest I
  // don't feel like I understand the transformations well, but empirically, it
  // seems that this is the correct stage in the process to apply the cos(dec)
  // term.

  const decRad = Math.min(Math.max(place.dec_rad + delta_dec, -0.5 * Math.PI), 0.5 * Math.PI);
  let raRad = place.ra_rad + delta_ra / Math.cos(decRad);
  const TWO_PI = 2 * Math.PI;

  while (raRad >= TWO_PI) {
    raRad -= TWO_PI;
  }

  // All done!

  return { raRad, decRad, rollRad, zoomDeg };
}

export function backgroundInfoToSet(info: ImageDisplayInfoT): Imageset {
  const img = imageInfoToSet(info);
  img.set_dataSetType(ImageSetType.sky);
  img.set_baseLevel(0);

  const id = String(img.get_imageSetID());
  const name = v5(id, wwtNamespace);
  img.set_name(name);
  return img;
}
