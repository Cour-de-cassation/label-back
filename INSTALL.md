# Installation guide

## Requirements

- NodeJs v16, you can use `nvm` to use the version specify in the `.nvmrc` file.

## Configuration

You can lauch the backend with or withour docker. To configure these methods you must have an env file :

- `.env`

Copy and rename `.env.example`.

Label depends on one other service from the Cour de cassation : [dbsder-api](https://github.com/cour-de-cassation/dbsder-api) You can lauch this API locally to simulate operation close to production.

Label use also a keycloack to emulate login flow in local.

You should take a look at [juridependencies](https://github.com/Cour-de-cassation/juridependencies) to install this service.

## Installation and lauch

Install dependencies with:

```sh
npm i
```

### Backend

#### With docker:

Start the backend with:

```sh
npm run start:docker
```

#### Without docker:

Start the backend:

```sh
npm run start:dev
```

### Database

See juridependencies

### Launch scripts

Label contains many scripts, they are listed [here](docs/scripts.md)
You can launch scripts with theses commands :

#### With docker

```sh
docker compose exec labelbk sh -c "node dist/courDeCassation/scripts/MYSCRIPT.js -s src/courDeCassation/settings/settings.json --MYARGUMENT XX"
```

#### Without docker

```sh
scripts/runScriptLocally.sh "myScript.js --myArgument"
```

### SSO configuration

Follow the [installation guide](packages/generic/sso/README.md).

> The LABEL application leverages the SSO module as a dependency for its integration with the Single Sign-On (SSO) system. The details of this integration are documented in the [README](packages/generic/sso/README.md) of the SSO module.
> The backend exposes the following URLs to interact with the SSO:

1. /api/sso/login: Endpoint to initiate the login process via SSO.
2. /api/sso/acs: Endpoint for processing SAML assertions following a successful authentication.
3. /api/sso/logout: Endpoint to disconnect the user from the SSO.

**_The attributes returned by the SSO, as well as the roles used by the application, are specified in the configuration file._**
