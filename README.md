# WorldWide Telescope Constellations: The Frontend

This is a web application built on Nuxt. Look at the [Nuxt 3
documentation](https://nuxt.com/docs/getting-started/introduction) to learn
more.


## Setup

Make sure to install the dependencies:

```bash
# yarn
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
