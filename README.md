# WorldWide Telescope Constellations: The Frontend

This is a web application built on Nuxt. Look at the [Nuxt 3
documentation](https://nuxt.com/docs/getting-started/introduction) to learn
more.

In order to be fully operable, this server must be able to communicate with a
[Constellations backend server][backend] (location configurable with the
`NUXT_PUBLIC_API_URL` environment variable) and a [Keycloak server][keycloak]
(location configurable with `NUXT_PUBLIC_KEYCLOAK_URL`). The backend, in turn,
needs to be able to communicate with a [MongoDB] server (or something
compatible).

[backend]: https://github.com/WorldWideTelescope/wwt-constellations-backend/
[keycloak]: https://www.keycloak.org/
[MongoDB]: https://www.mongodb.com/

## Setup

Make sure to install the dependencies:

```bash
yarn install
```


## Development Server

Start the development server on http://localhost:3000:

```bash
yarn dev
```


## Production

Build the application for production:

```bash
yarn build
```

Locally preview production build:

```bash
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## Configuration

Environment variables:

- `NUXT_PUBLIC_API_URL` to set the URL to the backend API server; default
  is `http://localhost:7000`
- `NUXT_PUBLIC_GOOGLE_ANALYTICS_TAG` to set the tag (of the form `G-XXXXXXXXXX`)
  used for Google Analytics telemetry. If left unset, the telemetry is disabled.
- `NUXT_PUBLIC_HOST_URL` to specify the base URL of this server's public
  frontend; default is `http://localhost:3000`. While most internal URLs are
  relative, this setting is used to construct canonical URLs when they are
  needed (e.g., social sharing headers).
- `NUXT_PUBLIC_KEYCLOAK_URL` to set the URL to the Keycloak instance; default
  is `http://localhost:8080/`


## Setting up a Development Environment

See [the wwt-constellations-backend README][1] for detailed instructions on
setting up the necessary services for local testing. If you use the default
values there, a simple `yarn dev` should get things going for you here.

[1]: https://github.com/WorldWideTelescope/wwt-constellations-backend/#readme
