import { settingsType } from '@src/core';
import { settingsLoader } from '../lib/settingsLoader';
import { logger, mongo } from '../utils';
import { setIndexesOnAllCollections } from './scripts';
import { LABEL_DB_URL, LABEL_DB_NAME } from '../utils/env';

export { setup, setupMongo };

async function setup(settings: settingsType) {
  setupSettings(settings);
  await setupMongo();
}

function setupSettings(settings: settingsType) {
  settingsLoader.setSettings(settings);
  logger.log({ operationName: 'setupSettings', msg: `Settings ready!` });
}

async function setupMongo() {
  logger.log({
    operationName: 'setupMongo',
    msg: `Loading the Mongo database : ${LABEL_DB_NAME}`,
  });
  if (LABEL_DB_URL == undefined || LABEL_DB_NAME == undefined) {
    throw new Error('You must provide a valid database URL and name.');
  }
  await mongo.initialize({
    dbName: LABEL_DB_NAME,
    url: LABEL_DB_URL,
  });
  logger.log({ operationName: 'setupMongo', msg: `MongoDB ready!` });

  logger.log({
    operationName: 'setupMongo',
    msg: 'Set indexes on all collections',
  });
  await setIndexesOnAllCollections();
  logger.log({ operationName: 'setupMongo', msg: 'Indexation done' });
}
