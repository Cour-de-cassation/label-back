import { mongo } from '../../utils';
import { setIndexesOnAllCollections } from './setIndexesOnAllCollections';
import { LABEL_DB_URL, LABEL_DB_NAME } from '@src/backend/utils/env';

export { withMongo };

async function withMongo(script: () => Promise<void>): Promise<void> {
  await mongo.initialize({ dbName: LABEL_DB_NAME, url: LABEL_DB_URL });
  await setIndexesOnAllCollections();

  await script();

  await mongo.close();
  process.exit(0);
}
