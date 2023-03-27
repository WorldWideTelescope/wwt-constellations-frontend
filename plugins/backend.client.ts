// This is a client-only plugin since Keycloak is; the server-side renderer
// doesn't know who we're logged in as!

import { ofetch } from "ofetch";

export default defineNuxtPlugin(_nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  // This is a function that creates a $Fetch object which you can then use to
  // actually make an authenticated backend API call. As far as I can tell, we
  // need to use this approach since the token is initialized asynchronously
  // when the page loads.
  //
  // If the user is not logged in, the call is simply made without an associated
  // token. There's always the possibility that the authentication isn't "right"
  // in some fashion, so I don't think it makes life any easier to "pre-reject"
  // such attempts, even for APIs that we know require authentication.
  const backendAuthCall = (() => {
    const { $keycloak } = useNuxtApp();

    const headers: { [k: string]: string } = {
      "Accept": "application/json"
    };

    if ($keycloak.token !== undefined) {
      headers["Authorization"] = "Bearer " + $keycloak.token;
    }

    // This creates a "preloaded" fetcher with default values
    return ofetch.create({
      baseURL: nuxtConfig.apiUrl,
      headers: headers,
    })
  });

  return {
    provide: {
      backendAuthCall
    }
  };
});
