// This client-only plugin performs backend API calls with authentication; the
// server-side renderer doesn't know who we're logged in as! The version without
// authentication ($backendCall) can run on both client and server.

import { ofetch } from "ofetch";

export default defineNuxtPlugin(_nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  // Don't refresh the token if it will remain valid for at least this far into
  // the future. Measured in seconds.
  const MIN_VALIDITY_SECONDS = 10;

  // This function returns a promise of a $Fetch object, which you can then use
  // to actually make an authenticated backend API call. We need to use this
  // approach since the token is initialized asynchronously and may need to be
  // updated.
  //
  // If the user is not logged in, the promise will be rejected with an error. I
  // don't think that it is possible for the token to be undefined *without*
  // such an error occurring, but if so, the request will be submitted without
  // any Authorization header. The backend will already have to deal with such
  // eventualities anyway.
  const backendAuthCall = (async () => {
    const { $keycloak } = useNuxtApp();

    try {
      await $keycloak.updateToken(MIN_VALIDITY_SECONDS);
    } catch (err) {
      throw new Error(`authentication error: failed to refresh token or session expired (${err})`);
    }

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
    });
  });

  return {
    provide: {
      backendAuthCall
    }
  };
});
