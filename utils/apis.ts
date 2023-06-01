// Copyright 2023 the .NET Foundation

// Interfaces associated with backend APIs

import { isLeft } from "fp-ts/lib/Either.js";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter.js";
import { $Fetch } from "ofetch";

import { ImageDisplayInfo, PlaceDetails, SceneContentHydrated, ScenePreviews } from "./types";

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

export const AmISuperuserResponse = t.type({
  result: t.boolean,
});

export type AmISuperuserResponseT = t.TypeOf<typeof AmISuperuserResponse>;

export async function amISuperuser(fetcher: $Fetch): Promise<AmISuperuserResponseT> {
  return fetcher("/misc/amisuperuser").then((data) => {
    checkForError(data);

    const maybe = AmISuperuserResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /misc/amisuperuser: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right;
  });
}

// Endpoint: POST /misc/config-database

//export interface MiscConfigDatabaseRequest { }

export const MiscConfigDatabaseResponse = t.type({});

export type MiscConfigDatabaseResponseT = t.TypeOf<typeof MiscConfigDatabaseResponse>;

export async function miscConfigDatabase(fetcher: $Fetch): Promise<MiscConfigDatabaseResponseT> {
  return fetcher("/misc/config-database", { method: 'POST' }).then((data) => {
    checkForError(data);

    const maybe = MiscConfigDatabaseResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /misc/config-database: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right;
  });
}

// Endpoint: GET /handle/:handle

export const GetHandleResponse = t.type({
  handle: t.string,
  display_name: t.string,
});

export type GetHandleResponseT = t.TypeOf<typeof GetHandleResponse>;

// Returns null if a 404 is returned, i.e. the handle is not found.
export async function getHandle(fetcher: $Fetch, handle: string): Promise<GetHandleResponseT | null> {
  try {
    const data = await fetcher(`/handle/${encodeURIComponent(handle)}`);
    checkForError(data);

    const maybe = GetHandleResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /handle/:handle: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
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

export const HandlePermissionsResponse = t.type({
  handle: t.string,
  view_dashboard: t.boolean,
});

export type HandlePermissionsResponseT = t.TypeOf<typeof HandlePermissionsResponse>;

export async function handlePermissions(fetcher: $Fetch, handle: string): Promise<HandlePermissionsResponseT | null> {
  try {
    const data = await fetcher(`/handle/${encodeURIComponent(handle)}/permissions`);
    checkForError(data);
    const maybe = HandlePermissionsResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /handle/:handle/permissions: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
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


// Endpoint: GET /handle/:handle/sceneinfo?page=$int&pagesize=$int

export const HandleSceneInfo = t.type({
  _id: t.string,
  creation_date: t.string,
  impressions: t.number,
  likes: t.number,
});

export type HandleSceneInfoT = t.TypeOf<typeof HandleSceneInfo>;

export const HandleSceneInfoResponse = t.type({
  total_count: t.number,
  results: t.array(HandleSceneInfo),
});

export type HandleSceneInfoResponseT = t.TypeOf<typeof HandleSceneInfoResponse>;

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
  const maybe = HandleSceneInfoResponse.decode(data);

  if (isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/sceneinfo: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
  }

  return maybe.right;
}


// Endpoint: GET /handle/:handle/stats

export const HandleImageStats = t.type({
  count: t.number,
});

export const HandleSceneStats = t.type({
  count: t.number,
  impressions: t.number,
  likes: t.number,
});

export const HandleStatsResponse = t.type({
  handle: t.string,
  images: HandleImageStats,
  scenes: HandleSceneStats,
});

export type HandleStatsResponseT = t.TypeOf<typeof HandleStatsResponse>;

export async function handleStats(fetcher: $Fetch, handle: string): Promise<HandleStatsResponseT> {
  const data = await fetcher(`/handle/${encodeURIComponent(handle)}/stats`);
  checkForError(data);
  const maybe = HandleStatsResponse.decode(data);

  if (isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/stats: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
  }

  return maybe.right;
}


// Endpoint: POST /handle/:handle
//
// This is an undocumented superuser-only API, for now.

export const HandleCreateRequest = t.type({
  display_name: t.string,
});

export type HandleCreateRequestT = t.TypeOf<typeof HandleCreateRequest>;

export const HandleCreateResponse = t.type({
  id: t.string,
});

export type HandleCreateResponseT = t.TypeOf<typeof HandleCreateResponse>;

export async function createHandle(fetcher: $Fetch, handle: string, req: HandleCreateRequestT): Promise<HandleCreateResponseT> {
  const path = `/handle/${encodeURIComponent(handle)}`;

  return fetcher(path, { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    const maybe = HandleCreateResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`POST /handle/:handle: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right;
  });
}


// Endpoint: PATCH /handle/:handle

export const HandleUpdateRequest = t.partial({
  display_name: t.string,
});

export type HandleUpdateRequestT = t.TypeOf<typeof HandleUpdateRequest>;

export async function updateHandle(fetcher: $Fetch, handle: string, req: HandleUpdateRequestT): Promise<void> {
  const path = `/handle/${encodeURIComponent(handle)}`;

  return fetcher(path, { method: 'PATCH', body: req }).then((data) => {
    checkForError(data);
  });
}


// Endpoint: POST /handle/:handle/add-owner

export const HandleAddOwnerRequest = t.type({
  account_id: t.string,
});

export type HandleAddOwnerRequestT = t.TypeOf<typeof HandleAddOwnerRequest>;

export const HandleAddOwnerResponse = t.type({});

export type HandleAddOwnerResponseT = t.TypeOf<typeof HandleAddOwnerResponse>;

export async function addHandleOwner(
  fetcher: $Fetch,
  handle: string,
  req: HandleAddOwnerRequestT
): Promise<HandleAddOwnerResponseT> {
  const path = `/handle/${encodeURIComponent(handle)}/add-owner`;

  return fetcher(path, { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    const maybe = HandleAddOwnerResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`POST /handle/:handle/add-owner: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right;
  });
}

// Endpoint: GET /scene/:id

export const GetSceneResponse = t.type({
  id: t.string,
  handle_id: t.string,
  handle: GetHandleResponse,
  creation_date: t.string,
  likes: t.number,
  impressions: t.number,
  place: PlaceDetails,
  content: SceneContentHydrated,
  text: t.string,
  liked: t.boolean,
  outgoing_url: t.union([t.string, t.undefined]),
  previews: ScenePreviews,
});

export type GetSceneResponseT = t.TypeOf<typeof GetSceneResponse>;

// Returns null if a 404 is returned, i.e. the scene is not found.
export async function getScene(fetcher: $Fetch, scene_id: string): Promise<GetSceneResponseT | null> {
  try {
    const data = await fetcher(`/scene/${encodeURIComponent(scene_id)}`, {credentials: 'include'});
    checkForError(data);
    const maybe = GetSceneResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /scene/:id: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
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


// Endpoint: GET /scene/:id/permissions

export const ScenePermissionsResponse = t.type({
  id: t.string,
  edit: t.boolean,
});

export type ScenePermissionsResponseT = t.TypeOf<typeof ScenePermissionsResponse>;

export async function scenePermissions(fetcher: $Fetch, id: string): Promise<ScenePermissionsResponseT | null> {
  try {
    const data = await fetcher(`/scene/${encodeURIComponent(id)}/permissions`);
    checkForError(data);
    const maybe = ScenePermissionsResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`GET /scene/:id/permissions: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
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

export const SceneUpdateRequest = t.partial({
  outgoing_url: t.string,
  place: PlaceDetails,
  text: t.string,
});

export type SceneUpdateRequestT = t.TypeOf<typeof SceneUpdateRequest>;

export async function updateScene(fetcher: $Fetch, id: string, req: SceneUpdateRequestT): Promise<void> {
  const path = `/scene/${encodeURIComponent(id)}`;

  return fetcher(path, { method: 'PATCH', body: req }).then((data) => {
    checkForError(data);
  });
}


// Endpoint: GET /handle/:handle/timeline?page=$number

export const TimelineResponse = t.type({
  results: t.array(GetSceneResponse),
});

export type TimelineResponseT = t.TypeOf<typeof TimelineResponse>;

export async function getHandleTimeline(
  fetcher: $Fetch,
  handle: string,
  page_num: number
): Promise<TimelineResponseT> {
  const data = await fetcher(`/handle/${encodeURIComponent(handle)}/timeline`, { query: { page: page_num }, credentials: 'include' });
  checkForError(data);
  const maybe = TimelineResponse.decode(data);

  if (isLeft(maybe)) {
    throw new Error(`GET /handle/:handle/timeline: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
  }

  return maybe.right;
}

// Endpoint: GET /scenes/home-timeline?page=$number

export async function getHomeTimeline(fetcher: $Fetch, page_num: number): Promise<TimelineResponseT> {
  const data = await fetcher(`/scenes/home-timeline`, { query: { page: page_num } });
  checkForError(data);
  const maybe = TimelineResponse.decode(data);

  if (isLeft(maybe)) {
    throw new Error(`GET /scenes/home-timeline: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
  }

  return maybe.right;
}

export const SceneInteractionResponse = t.type({
  id: t.string,
  success: t.boolean
});

export type SceneInteractionResponseT = t.TypeOf<typeof SceneInteractionResponse>;

export async function addImpression(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/impressions`, { method: 'POST', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = SceneInteractionResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`POST /scenes/impressions: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right.success;
  });
}

export async function addLike(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/likes`, { method: 'POST', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = SceneInteractionResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`POST /scenes/likes: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right.success;
  });
}

export async function removeLike(fetcher: $Fetch, id: string): Promise<boolean> {
  return fetcher(`/scene/${id}/likes`, { method: 'DELETE', credentials: 'include', cache: 'no-store' }).then((data) => {
    checkForError(data);
    const maybe = SceneInteractionResponse.decode(data);

    if (isLeft(maybe)) {
      throw new Error(`POST /scenes/likes: API response did not match schema: ${PathReporter.report(maybe).join("\n")}`);
    }

    return maybe.right.success;
  });
}

export async function initializeSession(fetcher: $Fetch): Promise<void> {
  return fetcher(`/session/init`, { method: 'POST', credentials: 'include' }).then((data) => {
    checkForError(data);
  });
}
