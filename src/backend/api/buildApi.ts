import { Express } from 'express';
import { mapValues } from 'lodash';
import { apiSchema, apiSchemaMethodNameType } from '@src/core';
import { logger } from '../utils';
import { controllers } from './controllers';
import { ssoService } from '../modules/sso';

export { buildApi };

const API_BASE_URL = '/label/api';

function buildApi(app: Express) {
  const methodNames = Object.keys(apiSchema) as any as apiSchemaMethodNameType[];

  methodNames.map((methodName) => buildMethod(app, methodName));

  // urls SSO
  buildApiSso(app);
}

function buildMethod(app: Express, methodName: apiSchemaMethodNameType) {
  switch (methodName) {
    case 'get':
      buildGetRoutes(app);
      break;
    case 'post':
      buildPostRoutes(app);
      break;
  }
}

function buildGetRoutes(app: Express) {
  const getRoutes = Object.keys(apiSchema.get) as any as Array<keyof (typeof apiSchema)['get']>;

  getRoutes.forEach((getRoute) => {
    app.get(`${API_BASE_URL}/${getRoute}`, buildController('get', controllers.get[getRoute]));
  });
}

function buildPostRoutes(app: Express) {
  const postRoutes = Object.keys(apiSchema.post) as any as Array<keyof (typeof apiSchema)['post']>;

  postRoutes.forEach((postRoute) => {
    app.post(`${API_BASE_URL}/${postRoute}`, buildController('post', controllers.post[postRoute]));
  });
}

function buildController(
  method: apiSchemaMethodNameType,
  controller: (param: { headers: any; args: any; user?: any; path: string }) => Promise<any>,
) {
  return async (req: any, res: any, next: any) => {
    try {
      const { data, statusCode } = await executeController();
      res.status(statusCode);
      res.send(data);
    } catch (error) {
      logger.error({ operationName: 'buildController', msg: `${error}` });
      res.status((error as any).statusCode || 500);
      next(error);
    }

    async function executeController(): Promise<{
      data: any;
      statusCode: number;
    }> {
      switch (method) {
        case 'get':
          const sanitizedQuery = mapValues(req.query, (queryValue) => JSON.parse(queryValue));
          return {
            data: await controller({
              headers: req.headers,
              args: sanitizedQuery,
              user: req.user,
              path: req.path,
            }),
            statusCode: 200,
          };
        case 'post':
          return {
            data: await controller({
              headers: req.headers,
              args: req.body,
              user: req.user,
              path: req.path,
            }),
            statusCode: 201,
          };
      }
    }
  };
}

function buildApiSso(app: Express) {
  app.get(`${API_BASE_URL}/sso/metadata`, async (req, res) => {
    try {
      const xml = await ssoService.getMetadata();
      res.type('application/xml').send(xml);
    } catch (err) {
      res.status(500).send(`Metadata SAML protocol error ${err}`);
    }
  });

  app.get(`${API_BASE_URL}/sso/login`, async (req, res) => {
    logger.log({
      operationName: 'SSO Login Endpoint',
      msg: 'Login endpoint called',
    });
    try {
      const context = await ssoService.login();
      logger.log({
        operationName: 'SSO Login Endpoint',
        msg: `Redirecting user to IdP`,
      });
      res.redirect(context);
    } catch (err) {
      logger.error({
        operationName: 'SSO Login Endpoint',
        msg: `Login error: ${err}`,
      });
      res.status(401).json({
        status: 401,
        message: err instanceof Error ? err.message : `${err}`,
      });
    }
  });

  app.get(`${API_BASE_URL}/sso/logout`, async (req, res) => {
    const nameID = String(req.user?.email);
    const sessionIndex = String(req.user?.sessionIndex);

    try {
      const context = await ssoService.logout({ nameID, sessionIndex });
      res.redirect(context);
    } catch (err) {
      logger.error({
        operationName: 'logoutSso',
        msg: `${err}`,
      });
      res.status(500).json({
        status: 500,
        message: err instanceof Error ? err.message : `${err}`,
      });
    }
  });

  app.get(`${API_BASE_URL}/sso/whoami`, (req, res) => {
    logger.log({
      operationName: 'SSO Whoami',
      msg: `Whoami endpoint called - User present: ${!!req.user}`,
    });
    const user = req.user ?? null;
    if (!user) {
      logger.log({
        operationName: 'SSO Whoami',
        msg: 'No authenticated user found, returning 401',
      });
      return res.status(401).send({ status: 401, message: `Token invalid or expired` });
    }
    logger.log({
      operationName: 'SSO Whoami',
      msg: `Authenticated user: ${user.email}`,
    });
    res.type('application/json').send(user);
  });

  app.post(`${API_BASE_URL}/sso/acs`, async (req, res) => {
    logger.log({
      operationName: 'SSO ACS Endpoint',
      msg: 'ACS endpoint called - Processing SAML response',
    });
    try {
      const url = await ssoService.acs(req);
      logger.log({
        operationName: 'SSO ACS Endpoint',
        msg: `ACS successful, redirecting to: ${url}`,
      });
      res.redirect(url);
    } catch (err) {
      logger.error({
        operationName: 'SSO ACS Endpoint',
        msg: `ACS error: ${err}`,
      });
      res.status(500);
      res.redirect(`${API_BASE_URL}/sso/logout`);
    }
  });
}
