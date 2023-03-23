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
- `NUXT_PUBLIC_KEYCLOAK_URL` to set the URL to the Keycloak instance; default
  is `http://localhost:8080/`


## Keycloak Development Server

The easiest way to set up a **totally insecure** development Keycloak server for
testing the IAM integration is with Docker. Create a long-lived container
instance:

```
docker create \
  --name cx-keycloak \
  -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -p 8080:8080 \
  quay.io/keycloak/keycloak start-dev

docker start cx-keycloak
```

Then:

1. Navigate to http://localhost:8080/ to get the admin UI
1. Log in with your specified username and password
1. In the top left dropdown, create a new realm named `constellations`
1. In the Clients tab, create a new client
    1. Call it `constellations-app`
    1. Add `http://localhost:3000/*` as a valid redirect URI
    1. Add `*` as allowed web origin
1. In the Users tab, create a new user for yourself
    1. Choose a username
    1. After creation, in the Credentials tab of the user, set a password
