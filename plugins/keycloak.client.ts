import Keycloak, { KeycloakConfig } from "keycloak-js";

export default defineNuxtPlugin(_nuxtApp => {
  const nuxtConfig = useRuntimeConfig();

  const config: KeycloakConfig = {
    url: nuxtConfig.public.keycloakUrl,
    realm: "constellations",
    clientId: "constellations-app",
  };

  const keycloak = new Keycloak(config);
  keycloak.loginRequired = false;

  return {
    provide: {
      keycloak
    }
  };

});

