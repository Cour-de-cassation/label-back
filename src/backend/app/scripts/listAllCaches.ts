import { cacheType, timeOperator } from '@src/core';
import { buildCacheRepository } from '../../modules/cache';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { listAllCaches };

async function listAllCaches() {
  const loggerTech: TechLog = {
    operations: ['other', 'listAllCaches'],
    path: './src/backend/app/scripts/listAllCaches.ts',
    message: 'listAllCaches',
  };
  logger.info({ ...loggerTech, message: 'START' });

  const cacheRepository = buildCacheRepository();

  const caches = await cacheRepository.findAll();
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
