// This plugin makes backend API calls without authentication, and so can be run
// on either the client or the server. The version with authentication
// ($backendAuthCall) can only run on the client side since the server doesn't
// know who we're logged in as.

import { ofetch } from "ofetch";

export default defineNuxtPlugin(_nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  // This is a $Fetch object preloaded to make API calls.
  const backendCall = ofetch.create({
    baseURL: nuxtConfig.apiUrl,
    headers: {
      "Accept": "application/json"
    },
  });

  return {
    provide: {
      backendCall
    }
  };
});
