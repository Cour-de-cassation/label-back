import { settingsType } from '@src/core';
import { settingsLoader } from '../lib/settingsLoader';
import { logger, mongo } from '../utils';
import { setIndexesOnAllCollections } from './scripts';
import { LABEL_DB_URL, LABEL_DB_NAME } from '../utils/env';
import { TechLog } from '../utils/logger/loggerType';

export { setup, setupMongo };
const loggerTech: TechLog = {
  operations: ['other', 'setupMongo'],
  path: './src/backend/app/setup.ts',
  message: `Loading the Mongo database : ${LABEL_DB_NAME}`,
};
async function setup(settings: settingsType) {
  setupSettings(settings);
  await setupMongo();
}

function setupSettings(settings: settingsType) {
  settingsLoader.setSettings(settings);
  logger.info({
    ...loggerTech,
    message: `Settings ready!`,
  });
}

async function setupMongo() {
  logger.info({
    ...loggerTech,
    message: `Loading the Mongo database : ${LABEL_DB_NAME}`,
  });
  if (LABEL_DB_URL == undefined || LABEL_DB_NAME == undefined) {
    throw new Error('You must provide a valid database URL and name.');
  }
  await mongo.initialize({
    dbName: LABEL_DB_NAME,
    url: LABEL_DB_URL,
  });
  logger.info({
    ...loggerTech,
    message: `MongoDB ready!`,
  });

  logger.info({
    ...loggerTech,
    message: 'Set indexes on all collections',
  });
  await setIndexesOnAllCollections();
  logger.info({
    ...loggerTech,
    message: 'Indexation done',
  });
}
