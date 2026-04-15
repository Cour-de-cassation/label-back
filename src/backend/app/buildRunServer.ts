import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { settingsType } from '@src/core';
import { LABEL_CLIENT_URL, LABEL_API_PORT } from '../utils/env';

import { buildApi } from '../api';
import { setup } from './setup';
import { jwtMiddleware } from '../utils';

export { buildRunServer };

function buildRunServer(settings: settingsType) {
  return () => {
    const app = express();

    app.use(
      cors({
        origin: [LABEL_CLIENT_URL],
        credentials: true,
      }),
    );

    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(jwtMiddleware);

    buildApi(app);

    app.listen(LABEL_API_PORT, async () => {
      await setup(settings);
    });
  };
}
