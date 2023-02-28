import Keycloak, { KeycloakConfig } from "keycloak-js";

export default defineNuxtPlugin(_nuxtApp => {

  const config: KeycloakConfig = {
    url: "http://localhost:8080/",
    realm: "constellations",
    clientId: "constellations-app",
  };

  const keycloak = new Keycloak(config);
  keycloak.loginRequired = false;
  console.log("Provided keycloak");
  console.log(keycloak);

  return {
    provide: {
      keycloak
    }
  };

});

