import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { settingsType } from '@src/core';

import { buildApi } from '../api';
import { setup } from './setup';
import { envSchema } from './envSchema';
import { jwtMiddleware } from '../utils';

export { buildRunServer };

function buildRunServer(settings: settingsType) {
  return () => {
    const app = express();

    const { error } = envSchema.validate(process.env, {
      abortEarly: false,
    });

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    app.use(
      cors({
        origin: [`${process.env.LABEL_CLIENT_URL}`],
        credentials: true,
      }),
    );

    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // Use JWT middleware instead of express-session
    app.use(jwtMiddleware);

    buildApi(app);

    app.listen(process.env.LABEL_API_PORT, async () => {
      await setup(settings);
    });
  };
}
