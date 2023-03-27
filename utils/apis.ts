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
      throw new Error("/misc/amisuperuser API response did not match schema");
    }
  });
}

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
      throw new Error("/misc/config-database API response did not match schema");
    }
  });
}
