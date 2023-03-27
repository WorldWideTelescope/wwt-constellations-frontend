// Interfaces associated with backend APIs

import { $Fetch } from "ofetch";

//export interface AmISuperuserRequest { }

export interface AmISuperuserResponse {
  result: boolean;
}

export function isAmISuperuserResponse(item: any): item is AmISuperuserResponse {
  return typeof item.result === "boolean";
}

export async function amISuperuser(fetcher: $Fetch): Promise<AmISuperuserResponse> {
  return fetcher("/misc/amisuperuser").then((data) => {
    if (isAmISuperuserResponse(data)) {
      return data;
    } else {
      throw new Error("/misc/amisuperuser API response did not match schema");
    }
  });
}