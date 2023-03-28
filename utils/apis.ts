// Interfaces associated with backend APIs

import { $Fetch } from "ofetch";

function checkForError(item: any) {
  if (typeof item.error === "boolean" && item.error) {
    if (typeof item.message === "string") {
      throw new Error(`API server returned error: ${item.message}`);
    } else {
      throw new Error("API server returned error; no details provided");
    }
  }
}

// Endpoint: /misc/amisuperuser

//export interface AmISuperuserRequest { }

export interface AmISuperuserResponse {
  result: boolean;
}

export function isAmISuperuserResponse(item: any): item is AmISuperuserResponse {
  return typeof item.result === "boolean";
}

export async function amISuperuser(fetcher: $Fetch): Promise<AmISuperuserResponse> {
  return fetcher("/misc/amisuperuser").then((data) => {
    checkForError(data);

    if (isAmISuperuserResponse(data)) {
      return data;
    } else {
      throw new Error("GET /misc/amisuperuser: API response did not match schema");
    }
  });
}

// Endpoint: /misc/config-database

//export interface MiscConfigDatabaseRequest { }

export interface MiscConfigDatabaseResponse {
  error: boolean;
}

export function isMiscConfigDatabaseResponse(item: any): item is MiscConfigDatabaseResponse {
  return typeof item.error === "boolean";
}

export async function miscConfigDatabase(fetcher: $Fetch): Promise<MiscConfigDatabaseResponse> {
  return fetcher("/misc/config-database", { method: 'POST' }).then((data) => {
    checkForError(data);

    if (isMiscConfigDatabaseResponse(data)) {
      return data;
    } else {
      throw new Error("POST /misc/config-database: API response did not match schema");
    }
  });
}

// Endpoint: /handles/add-owner

export interface HandleAddOwnerRequest {
  handle: string;
  account_id: string;
}

export interface HandleAddOwnerResponse {
  error: boolean;
}

export function isHandleAddOwnerResponse(item: any): item is HandleAddOwnerResponse {
  return typeof item.error === "boolean";
}

export async function addHandleOwner(fetcher: $Fetch, req: HandleAddOwnerRequest): Promise<HandleAddOwnerResponse> {
  return fetcher("/handles/add-owner", { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    if (isHandleAddOwnerResponse(data)) {
      return data;
    } else {
      throw new Error("POST /handles/add-owner: API response did not match schema");
    }
  });
}

// Endpoint: /handles/create

export interface HandleCreateRequest {
  handle: string;
  display_name: string;
}

export interface HandleCreateResponse {
  error: boolean;
  id: string;
}

export function isHandleCreateResponse(item: any): item is HandleCreateResponse {
  return typeof item.error === "boolean" && typeof item.id === "string";
}

export async function createHandle(fetcher: $Fetch, req: HandleCreateRequest): Promise<HandleCreateResponse> {
  return fetcher("/handles/create", { method: 'POST', body: req }).then((data) => {
    checkForError(data);

    if (isHandleCreateResponse(data)) {
      return data;
    } else {
      throw new Error("POST /handles/create: API response did not match schema");
    }
  });
}

// Endpoint: /handles/:handle

export interface GetHandleResponse {
  handle: string;
  display_name: string;
}

export function isGetHandleResponse(item: any): item is GetHandleResponse {
  return typeof item.handle === "string" && typeof item.display_name === "string";
}

// Returns null if a 404 is returned, i.e. the handle is not found.
export async function getHandle(fetcher: $Fetch, handle: string): Promise<GetHandleResponse | null> {
  try {
    const data = await fetcher(`/handles/${encodeURIComponent(handle)}`);

    checkForError(data);

    if (isGetHandleResponse(data)) {
      return data;
    } else {
      throw new Error("GET /handles/:handle: API response did not match schema");
    }
  } catch (err: any) {
    // As far as I can tell, this is the only way to probe the HTTP response code in the FetchError???
    if (typeof err.message === "string" && err.message.includes("404")) {
      return null;
    }

    throw err;
  }
}
