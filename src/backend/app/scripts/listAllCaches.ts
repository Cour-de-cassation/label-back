import { withMongo } from './withMongo';
import { cacheType, timeOperator } from '@src/core';
import { findCaches } from '../../connectors/db/caches';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { listAllCaches };

if (require.main === module) {
  (async () => {
    await withMongo(listAllCaches);
  })();
}

async function listAllCaches() {
  const loggerTech: TechLog = {
    operations: ['other', 'listAllCaches'],
    path: './src/backend/app/scripts/listAllCaches.ts',
    message: 'listAllCaches',
  };
  logger.info({ ...loggerTech, message: 'START' });

  const caches = await findCaches();
  logger.info({
    ...loggerTech,
    message: `${caches.length} caches found`,
  });
  for (let index = 0; index < caches.length; index++) {
    const cache = caches[index] as cacheType;
    logger.info({
      ...loggerTech,
      message: `${index + 1} | ${cache['key']} | ${
        cache['updateDate'] && timeOperator.convertTimestampToReadableDate(cache['updateDate'])
      } | ${cache['content']}`,
    });
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
