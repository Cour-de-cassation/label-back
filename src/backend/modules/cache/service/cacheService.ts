import { cacheModule, cacheType, dateBuilder } from '@src/core';
import { deleteCacheById, findCaches, insertCache } from '../../../connectors/db/caches';

export { cacheService };

const cacheService = {
  createCache,
  deleteCache: deleteCacheById,
  fetchAllByKey: (key: cacheType['key']) => findCaches({ key }),
  fetchAllOlderThan: (minutes: number) => findCaches({ updateDate: { $lt: dateBuilder.minutesAgo(minutes) } }),
};

async function createCache(key: cacheType['key'], content: cacheType['content']) {
  const cache = cacheModule.generator.generate({ key, content });
  await insertCache(cache);
  return cache;
}
