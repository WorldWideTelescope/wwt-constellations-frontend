// Copyright 2023 the .NET Foundation

// Interfaces associated with backend APIs

import * as S from "@effect/schema/Schema";
import { formatError } from "@effect/schema/TreeFormatter";
import * as Either from "effect/Either";
import { $Fetch, FetchOptions } from "ofetch";

import {
  ImagePermissions,
  ImageStorage,
  ImageWwt,
  PlaceDetails,
  SceneContentHydrated,
  type SceneCreationInfoT,
  type SceneFeatureT,
  ScenePreviews,
  TessellationCell,
  type TessellationCellT,
} from "./types";

function checkForError(item: any) {
  if (typeof item.error === "boolean" && item.error) {
    if (typeof item.message === "string") {
      throw new Error(`API server returned error: ${item.message}`);
    } else {
      throw new Error("API server returned error; no details provided");
    }
  }

  delete item.error;
}


// Endpoint: GET /misc/amisuperuser

//export interface AmISuperuserRequest { }

export const AmISuperuserResponse = S.struct({
  result: S.boolean,
});

export type AmISuperuserResponseT = S.Schema.To<typeof AmISuperuserResponse>;

export async function amISuperuser(fetcher: $Fetch): Promise<AmISuperuserResponseT> {
  return fetcher("/misc/amisuperuser").then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(AmISuperuserResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /misc/amisuperuser: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: POST /misc/config-database

//export interface MiscConfigDatabaseRequest { }

export const MiscConfigDatabaseResponse = S.struct({});

export type MiscConfigDatabaseResponseT = S.Schema.To<typeof MiscConfigDatabaseResponse>;

export async function miscConfigDatabase(fetcher: $Fetch): Promise<MiscConfigDatabaseResponseT> {
  return fetcher("/misc/config-database", { method: 'POST' }).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(MiscConfigDatabaseResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /misc/config-database: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: POST /misc/update-timeline

//export interface MiscConfigDatabaseRequest { }

export const MiscUpdateTimelineResponse = S.struct({});

export type MiscUpdateTimelineResponseT = S.Schema.To<typeof MiscUpdateTimelineResponse>;

export async function miscUpdateTimeline(fetcher: $Fetch, initialId?: string): Promise<MiscUpdateTimelineResponseT> {
  const options: FetchOptions = { method: "POST" };
  if (initialId) {
    options.query = { "initial_id": initialId };
  }
  return fetcher("/misc/update-timeline", options).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(MiscUpdateTimelineResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /misc/update-timeline: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}



// Endpoint: POST /misc/update-global-tessellation

export const MiscUpdateGlobalTessellationResponse = S.struct({});

export type MiscUpdateGlobalTessellationResponseT = S.Schema.To<typeof MiscUpdateGlobalTessellationResponse>;

export async function miscUpdateGlobalTessellation(fetcher: $Fetch): Promise<MiscUpdateGlobalTessellationResponseT> {
  return fetcher("/misc/update-global-tessellation", { method: "POST" }).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(MiscUpdateGlobalTessellationResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /misc/update-global-tessellation: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: GET /handle/:handle

export const GetHandleResponse = S.struct({
  handle: S.string,
  display_name: S.string,
});

export type GetHandleResponseT = S.Schema.To<typeof GetHandleResponse>;

// Returns null if a 404 is returned, i.e. the handle is not found.
export async function getHandle(fetcher: $Fetch, handle: string): Promise<GetHandleResponseT | null> {
  try {
    const data = await fetcher(`/handle/${encodeURIComponent(handle)}`);
    checkForError(data);

    const maybe = S.decodeUnknownEither(GetHandleResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /handle/:handle: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}


// Endpoint: GET /handle/:handle/permissions

export const HandlePermissionsResponse = S.struct({
  handle: S.string,
  view_dashboard: S.boolean,
});

export type HandlePermissionsResponseT = S.Schema.To<typeof HandlePermissionsResponse>;

export async function handlePermissions(fetcher: $Fetch, handle: string): Promise<HandlePermissionsResponseT | null> {
  try {
    const data = await fetcher(`/handle/${encodeURIComponent(handle)}/permissions`);
    checkForError(data);
    const maybe = S.decodeUnknownEither(HandlePermissionsResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /handle/:handle/permissions: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}


// Endpoint: GET /handle/:handle/imageinfo?page=$int&pagesize=$int

export const ImageSummary = S.struct({
  _id: S.string,
  handle_id: S.string,
  creation_date: S.string,
  note: S.string,
  storage: ImageStorage,
  alt_text: S.optional(S.string, { exact: true }),
});

export type ImageSummaryT = S.Schema.To<typeof ImageSummary>;

export const HandleImageInfoResponse = S.struct({
  total_count: S.number,
  results: S.array(ImageSummary),
});

export type HandleImageInfoResponseT = S.Schema.To<typeof HandleImageInfoResponse>;

export async function handleImageInfo(
  fetcher: $Fetch,
  handle: string,
  page_num: number,
  page_size: number
): Promise<HandleImageInfoResponseT> {
  const data = await fetcher(
    `/handle/${encodeURIComponent(handle)}/imageinfo`,
    { query: { page: page_num, pagesize: page_size } }
  );
  checkForError(data);
  const maybe = S.decodeUnknownEither(HandleImageInfoResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/imageinfo: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}


// Endpoint: GET /handle/:handle/sceneinfo?page=$int&pagesize=$int

export const HandleSceneInfo = S.struct({
  _id: S.string,
  creation_date: S.string,
  impressions: S.number,
  likes: S.number,
  text: S.string,
  published: S.boolean,
  clicks: S.optional(S.number, { exact: true }),
  shares: S.optional(S.number, { exact: true }),
});

export type HandleSceneInfoT = S.Schema.To<typeof HandleSceneInfo>;

export const HandleSceneInfoResponse = S.struct({
  total_count: S.number,
  results: S.array(HandleSceneInfo),
});

export type HandleSceneInfoResponseT = S.Schema.To<typeof HandleSceneInfoResponse>;

export async function handleSceneInfo(
  fetcher: $Fetch,
  handle: string,
  page_num: number,
  page_size: number
): Promise<HandleSceneInfoResponseT> {
  const data = await fetcher(
    `/handle/${encodeURIComponent(handle)}/sceneinfo`,
    { query: { page: page_num, pagesize: page_size } }
  );
  checkForError(data);
  const maybe = S.decodeUnknownEither(HandleSceneInfoResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/sceneinfo: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}


// Endpoint: GET /handle/:handle/stats

export const HandleImageStats = S.struct({
  count: S.number,
});

export const HandleSceneStats = S.struct({
  count: S.number,
  impressions: S.number,
  likes: S.number,
  clicks: S.number,
  shares: S.number,
});

export const HandleStatsResponse = S.struct({
  handle: S.string,
  images: HandleImageStats,
  scenes: HandleSceneStats,
});

export type HandleStatsResponseT = S.Schema.To<typeof HandleStatsResponse>;

export async function handleStats(fetcher: $Fetch, handle: string): Promise<HandleStatsResponseT> {
  const data = await fetcher(`/handle/${encodeURIComponent(handle)}/stats`);
  checkForError(data);
  const maybe = S.decodeUnknownEither(HandleStatsResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/stats: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}


// Endpoint: POST /handle/:handle
//
// This is an undocumented superuser-only API, for now.

export const HandleCreateRequest = S.struct({
  display_name: S.string,
});

export type HandleCreateRequestT = S.Schema.To<typeof HandleCreateRequest>;

export const HandleCreateResponse = S.struct({
  id: S.string,
});

export type HandleCreateResponseT = S.Schema.To<typeof HandleCreateResponse>;

export async function createHandle(fetcher: $Fetch, handle: string, req: HandleCreateRequestT): Promise<HandleCreateResponseT> {
  const path = `/handle/${encodeURIComponent(handle)}`;

  return fetcher(path, { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(HandleCreateResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /handle/:handle: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: PATCH /handle/:handle

export const HandleUpdateRequest = S.struct({
  display_name: S.optional(S.string, { exact: true }),
});

export type HandleUpdateRequestT = S.Schema.To<typeof HandleUpdateRequest>;

export async function updateHandle(fetcher: $Fetch, handle: string, req: HandleUpdateRequestT): Promise<void> {
  const path = `/handle/${encodeURIComponent(handle)}`;

  return fetcher(path, { method: 'PATCH', body: req }).then((data) => {
    checkForError(data);
  });
}


// Endpoint: POST /handle/:handle/add-owner

export const HandleAddOwnerRequest = S.struct({
  account_id: S.string,
});

export type HandleAddOwnerRequestT = S.Schema.To<typeof HandleAddOwnerRequest>;

export const HandleAddOwnerResponse = S.struct({});

export type HandleAddOwnerResponseT = S.Schema.To<typeof HandleAddOwnerResponse>;

export async function addHandleOwner(
  fetcher: $Fetch,
  handle: string,
  req: HandleAddOwnerRequestT
): Promise<HandleAddOwnerResponseT> {
  const path = `/handle/${encodeURIComponent(handle)}/add-owner`;

  return fetcher(path, { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(HandleAddOwnerResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /handle/:handle/add-owner: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: GET /image/:id

export const GetImageResponse = S.struct({
  id: S.string,
  handle_id: S.string,
  handle: GetHandleResponse,
  creation_date: S.string,
  wwt: ImageWwt,
  permissions: ImagePermissions,
  storage: ImageStorage,
  note: S.string,
  alt_text: S.optional(S.string, { exact: true }),
});

export type GetImageResponseT = S.Schema.To<typeof GetImageResponse>;

// Returns null if a 404 is returned, i.e. the image is not found.
export async function getImage(fetcher: $Fetch, id: string): Promise<GetImageResponseT | null> {
  try {
    const data = await fetcher(`/image/${encodeURIComponent(id)}`);
    checkForError(data);

    const maybe = S.decodeUnknownEither(GetImageResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /image/:id: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}


// Endpoint: GET /image/:id/permissions

export const ImagePermissionsResponse = S.struct({
  id: S.string,
  edit: S.boolean,
});

export type ImagePermissionsResponseT = S.Schema.To<typeof ImagePermissionsResponse>;

export async function imagePermissions(fetcher: $Fetch, id: string): Promise<ImagePermissionsResponseT | null> {
  try {
    const data = await fetcher(`/image/${encodeURIComponent(id)}/permissions`);
    checkForError(data);
    const maybe = S.decodeUnknownEither(ImagePermissionsResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /image/:id/permissions: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}


// Endpoint: PATCH /image/:id

export const ImageUpdateRequest = S.struct({
  note: S.optional(S.string, { exact: true }),
  alt_text: S.optional(S.string, { exact: true }),
  permissions: S.optional(ImagePermissions, { exact: true }),
});

export type ImageUpdateRequestT = S.Schema.To<typeof ImageUpdateRequest>;

export async function updateImage(fetcher: $Fetch, id: string, req: ImageUpdateRequestT): Promise<void> {
  const path = `/image/${encodeURIComponent(id)}`;

  return fetcher(path, { method: 'PATCH', body: req }).then((data) => {
    checkForError(data);
  });
}


// Endpoint: GET /images/builtin-backgrounds

const BuiltinBackgroundsResponse = S.struct({
  results: S.array(ImageSummary),
});

export async function builtinBackgrounds(
  fetcher: $Fetch,
): Promise<readonly ImageSummaryT[]> {
  const data = await fetcher("/images/builtin-backgrounds");
  checkForError(data);
  const maybe = S.decodeUnknownEither(BuiltinBackgroundsResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /images/builtin-backgrounds: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right.results;
}


// Endpoint: GET /scene/:id

export const GetSceneResponse = S.struct({
  id: S.string,
  handle_id: S.string,
  handle: GetHandleResponse,
  creation_date: S.string,
  likes: S.number,
  impressions: S.number,
  clicks: S.number,
  shares: S.number,
  place: PlaceDetails,
  content: SceneContentHydrated,
  text: S.string,
  liked: S.boolean,
  outgoing_url: S.union(S.string, S.undefined),
  previews: ScenePreviews,
  published: S.boolean,
});

export type GetSceneResponseT = S.Schema.To<typeof GetSceneResponse>;

// Returns null if a 404 is returned, i.e. the scene is not found.
export async function getScene(fetcher: $Fetch, scene_id: string): Promise<GetSceneResponseT | null> {
  try {
    const data = await fetcher(`/scene/${encodeURIComponent(scene_id)}`, { credentials: 'include' });
    checkForError(data);
    const maybe = S.decodeUnknownEither(GetSceneResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /scene/:id: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}

// Endpoint: POST /handle/:handle/scene

export const CreateSceneResponse = S.struct({
  id: S.string,
  rel_url: S.string,
});

export type CreateSceneResponseT = S.Schema.To<typeof CreateSceneResponse>;

export async function createScene(fetcher: $Fetch, handle: string, req: SceneCreationInfoT): Promise<CreateSceneResponseT> {
  return fetcher(`/handle/${encodeURIComponent(handle)}/scene`, { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    const maybe = S.decodeUnknownEither(CreateSceneResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /handle/:handle/scene: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  });
}


// Endpoint: GET /scene/:id/permissions

export const ScenePermissionsResponse = S.struct({
  id: S.string,
  edit: S.boolean,
});

export type ScenePermissionsResponseT = S.Schema.To<typeof ScenePermissionsResponse>;

export async function scenePermissions(fetcher: $Fetch, id: string): Promise<ScenePermissionsResponseT | null> {
  try {
    const data = await fetcher(`/scene/${encodeURIComponent(id)}/permissions`);
    checkForError(data);
    const maybe = S.decodeUnknownEither(ScenePermissionsResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`GET /scene/:id/permissions: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right;
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}


// Endpoint: PATCH /scene/:id

const SceneContentUpdateRequest = S.struct({
  background_id: S.optional(S.string, { exact: true }),
});

export const SceneUpdateRequest = S.struct({
  outgoing_url: S.optional(S.string, { exact: true }),
  place: S.optional(PlaceDetails, { exact: true }),
  text: S.optional(S.string, { exact: true }),
  content: S.optional(SceneContentUpdateRequest, { exact: true }),
  published: S.optional(S.boolean, { exact: true }),
});

export type SceneUpdateRequestT = S.Schema.To<typeof SceneUpdateRequest>;

export async function updateScene(fetcher: $Fetch, id: string, req: SceneUpdateRequestT): Promise<void> {
  const path = `/scene/${encodeURIComponent(id)}`;

  return fetcher(path, { method: 'PATCH', body: req }).then((data) => {
    checkForError(data);
  });
}

// Endpoint: GET /handle/:handle/timeline?page=$number

export const TimelineResponse = S.struct({
  results: S.array(GetSceneResponse),
});

export type TimelineResponseT = S.Schema.To<typeof TimelineResponse>;

export async function getHandleTimeline(
  fetcher: $Fetch,
  handle: string,
  page_num: number
): Promise<TimelineResponseT> {
  const data = await fetcher(`/handle/${encodeURIComponent(handle)}/timeline`, { query: { page: page_num }, credentials: 'include' });
  checkForError(data);
  const maybe = S.decodeUnknownEither(TimelineResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/timeline: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}

// Endpoint: GET /scenes/home-timeline?page=$number

export async function getHomeTimeline(fetcher: $Fetch, page_num: number): Promise<TimelineResponseT> {
  const data = await fetcher(`/scenes/home-timeline`, { query: { page: page_num } });
  checkForError(data);
  const maybe = S.decodeUnknownEither(TimelineResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /scenes/home-timeline: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}

export async function getNearbyTimeline(fetcher: $Fetch, sceneID: string): Promise<TimelineResponseT> {
  const data = await fetcher(`/scene/${sceneID}/nearby-global`, { query: { size: 30 } });
  checkForError(data);
  const maybe = S.decodeUnknownEither(TimelineResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /tessellations/nearby-feed: API response did not match schema: ${formatError(maybe.left)}`);
  }

  return maybe.right;
}

export const SceneInteractionResponse = S.struct({
  id: S.string,
  success: S.boolean
});

export type SceneInteractionResponseT = S.Schema.To<typeof SceneInteractionResponse>;

export async function addImpression(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/impressions`, { method: 'POST', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = S.decodeUnknownEither(SceneInteractionResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /scenes/impressions: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right.success;
  });
}

export async function addLike(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/likes`, { method: 'POST', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = S.decodeUnknownEither(SceneInteractionResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /scenes/likes: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right.success;
  });
}

export async function removeLike(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/likes`, { method: 'DELETE', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = S.decodeUnknownEither(SceneInteractionResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /scenes/likes: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right.success;
  });
}

export async function addShare(fetcher: $Fetch, id: string, type: string): Promise<boolean> {
  return fetcher(`/scene/${id}/shares/${type}`, { method: 'POST', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = S.decodeUnknownEither(SceneInteractionResponse)(data);

    if (Either.isLeft(maybe)) {
      throw new Error(`POST /scenes/shares: API response did not match schema: ${formatError(maybe.left)}`);
    }

    return maybe.right.success;
  });
}

export async function initializeSession(fetcher: $Fetch): Promise<void> {
  return fetcher(`/session/init`, { method: 'POST', credentials: 'include' }).then((data) => {
    checkForError(data);
  });
}


// Endpoint: GET /tessellations/:name/cell

export async function getTessellationCell(fetcher: $Fetch, tessellationName: string, raRad: number, decRad: number): Promise<TessellationCellT> {
  const data = await fetcher(`/tessellations/${tessellationName}/cell`, { query: { ra: raRad, dec: decRad } });
  checkForError(data);
  const maybe = S.decodeUnknownEither(TessellationCell)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /tessellations/:name/cell: API response did not match schema ${formatError(maybe.left)}`);
  }

  return maybe.right;
}


// Endpoint: GET /features

export const FeaturesResponse = S.struct({
  features: S.array(SceneFeature)
});

export async function getFeaturesInRange(fetcher: $Fetch, startTimestamp: number, endTimestamp: number): Promise<SceneFeatureT[]> {
  const data = await fetcher(`/features`, { query: { start_date : startTimestamp, end_date: endTimestamp } });
  checkForError(data);
  console.log(data);

  const maybe = S.decodeUnknownEither(FeaturesResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /features: API response did not match schema ${formatError(maybe.left)}`);
  }

  return [...maybe.right.features];

}

export const FeatureQueueResponse = S.struct({
  scenes: S.array(GetSceneResponse),
});

export async function getFeatureSceneQueue(fetcher: $Fetch): Promise<GetSceneResponseT[]> {
  const data = await fetcher(`/features/queue`);
  checkForError(data);

  const maybe = S.decodeUnknownEither(FeatureQueueResponse)(data);

  if (Either.isLeft(maybe)) {
    throw new Error(`GET /features/queue: API response did not match schema ${formatError(maybe.left)}`);
  }

  return [...maybe.right.scenes];
}

export async function updateFeatureQueue(fetcher: $Fetch, sceneIDs: string[]): Promise<void> {
  const data = await fetcher(`/features/queue`, { method: 'POST', body: { scene_ids: sceneIDs } });
  checkForError(data);
}

