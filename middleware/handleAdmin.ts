// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have admin permissions
// on the current handle. Assumes that there is a URL parameter `handle` that
// (should) correspond to a handle.

import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";
import { handlePermissions } from "~/utils/apis";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  // We only know if we're logged in when we're running on the client, so at the
  // server-side rendering stage we have OK the access.
  if (process.server) {
    return;
  }

  const handle = to.params.handle as string;

  const { $keycloak, $backendAuthCall } = useNuxtApp();

  // We may need to make sure that the Keycloak state is initialized. Since
  // we're checking that the user is allowed to see some page, we require login
  // here.

  if (!$keycloak.refreshToken) {
    const constellationsStore = useConstellationsStore();
    const { loggedIn } = storeToRefs(constellationsStore);

    await $keycloak.init({
      onLoad: 'login-required',
    });

    loggedIn.value = $keycloak.authenticated ?? false;
  }

  // Now we can actually check the situation for this specific page.

  const { data } = await useAsyncData(`handle-perms-${handle}`, async () => {
    const fetcher = await $backendAuthCall();
    return handlePermissions(fetcher, handle);
  });

  const allowed = data.value && data.value.view_dashboard;

  if (!allowed) {
    // The abortNavigation() option sounds appealing but seems to yield 500
    // errors, which is not what we want.
    return navigateTo("/");
  }
});
