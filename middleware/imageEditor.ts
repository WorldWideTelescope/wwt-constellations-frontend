// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have permissions to edit
// the current image, as identified by a URL parameter `id`.

import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";
import { imagePermissions } from "~/utils/apis";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  // We only know if we're logged in when we're running on the client, so at the
  // server-side rendering stage we have to OK the access.
  //
  // (TODO: my understanding is that we can do better than this! But at the
  // moment that's how things seem to be working.)
  if (process.server) {
    return;
  }

  const id = to.params.id as string;

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

  // Now we can actually check the situation for this specific image.

  const { data: image_perms_data } = await useAsyncData(`image-perms-${id}`, async () => {
    const fetcher = await $backendAuthCall();
    return imagePermissions(fetcher, id);
  });

  const allowed = image_perms_data.value && image_perms_data.value.edit;

  if (!allowed) {
    // The abortNavigation() option sounds appealing but seems to yield 500
    // errors, which is not what we want.
    return navigateTo("/");
  }
});
