import Keycloak, { KeycloakConfig, KeycloakInitOptions } from "keycloak-js";

export default defineNuxtPlugin(nuxtApp => {

  const config: KeycloakConfig = {
    url: "http://localhost:8080/",
    realm: "constellations",
    clientId: "constellations-app",
  };

  const initOptions: KeycloakInitOptions = {
    onLoad: "login-required"
  };

  const keycloak = new Keycloak(config);
  keycloak.init(initOptions).then((auth) => {
    if (!auth) {
      window.location.reload();
    } else {
      console.log("Authenticated!");
      nuxtApp.vueApp.provide("keycloak", keycloak);
    }

    // Token refresh
    setInterval(() => {
      keycloak.updateToken(70).then((refreshed) => {
        if (refreshed) {
          console.log("Token refreshed " + refreshed);
        } else {
          console.warn(`Token not refreshed, valid for ${Math.round(keycloak.tokenParsed!.exp! + keycloak.timeSkew! - new Date().getTime() / 1000)} seconds`);
        }
      }).catch(() => {
        console.error("Failed to refresh token");
      })
    }, 6000);

  }).catch(() => {
    console.error("Authentication failed");
  });
});
