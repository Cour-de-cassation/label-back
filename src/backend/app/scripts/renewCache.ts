import yargs from 'yargs';
import { withMongo } from './withMongo';
import { cacheType } from '@src/core';
import { cacheService } from '../../modules/cache';
import { statisticService } from '../../modules/statistic';
import { logger } from '../../utils';

export { renewCache };

if (require.main === module) {
  (async () => {
    const { beforeMinutes } = parseArgv();
    await withMongo(() => renewCache({ minutes: beforeMinutes }));
  })();
}

async function renewCache({ minutes }: { minutes: number }) {
  logger.info({ operations: ['other', 'renewCache'], path: 'src/backend/app/scripts/renewCache.ts', message: 'START' });
  const cachesToRenew: cacheType[] = await cacheService.fetchAllOlderThan(minutes);
  logger.info({
    operations: ['other', 'renewCache'],
    path: 'src/backend/app/scripts/renewCache.ts',
    message: `${cachesToRenew.length} caches to renew`,
  });

  const availableStatisticFiltersCaches = await cacheService.fetchAllByKey('availableStatisticFilters');
  if (
    !availableStatisticFiltersCaches.length ||
    cachesToRenew.some((cache) => cache.key == 'availableStatisticFilters')
  ) {
    await cacheService.createCache(
      'availableStatisticFilters',
      JSON.stringify(await statisticService.fetchAvailableStatisticFilters()),
    );
    logger.info({
      operations: ['other', 'renewCache'],
      path: 'src/backend/app/scripts/renewCache.ts',
      message: `availableStatisticFilters cache renewed`,
    });
  }

  for (const cache of cachesToRenew) {
    await cacheService.deleteCache(cache._id);
    logger.info({
      operations: ['other', 'renewCache'],
      path: 'src/backend/app/scripts/renewCache.ts',
      message: `${cache._id} ${cache.key} cache deleted`,
    });
  }

  logger.info({
    operations: ['other', 'renewCache'],
    path: 'src/backend/app/scripts/renewCache.ts',
    message: 'DONE',
  });
}

function parseArgv() {
  const argv = yargs
    .options({
      beforeMinutes: {
        demandOption: true,
        description: 'minutes before renewing cache',
        type: 'number',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return { beforeMinutes: argv.beforeMinutes as number };
}
