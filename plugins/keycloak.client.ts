import { wwtPinia } from "@wwtelescope/engine-pinia";
import Keycloak, { KeycloakConfig, KeycloakInitOptions, KeycloakLoginOptions } from "keycloak-js";

import { useConstellationsStore } from "~/stores/constellations";

export default defineNuxtPlugin(nuxtApp => {

  const config: KeycloakConfig = {
    url: "http://localhost:8080/",
    realm: "constellations",
    clientId: "constellations-app",
  };

  // See the example of silent SSO checking at
// https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
  const initOptions: KeycloakInitOptions = {
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso'
  };

  const keycloak = new Keycloak(config);
  keycloak.loginRequired = false;
  keycloak.init(initOptions).then((auth) => {
    const store = useConstellationsStore(wwtPinia);
    store.$state.loggedIn = auth;
    console.log("Initialized Keycloak");
  });
  nuxtApp.provide("keycloak", keycloak);

//   keycloak.init(initOptions).then((auth) => {
//     if (!auth) {
//       window.location.reload();
//     } else {
//       console.log("Authenticated!");
//       nuxtApp.vueApp.provide("keycloak", keycloak);
//     }

//     // Token refresh
//     setInterval(() => {
//       keycloak.updateToken(70).then((refreshed) => {
//         if (refreshed) {
//           console.log("Token refreshed " + refreshed);
//         } else {
//           console.warn(`Token not refreshed, valid for ${Math.round(keycloak.tokenParsed!.exp! + keycloak.timeSkew! - new Date().getTime() / 1000)} seconds`);
//         }
//       }).catch(() => {
//         console.error("Failed to refresh token");
//       })
//     }, 6000);

//   }).catch(() => {
//     console.error("Authentication failed");
//   });


});

