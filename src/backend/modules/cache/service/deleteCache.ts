import { cacheType } from '@src/core';
import { buildCacheRepository } from '../repository';

export { deleteCache };

async function deleteCache(cacheId: cacheType['_id']) {
  const cacheRepository = buildCacheRepository();

  await cacheRepository.deleteById(cacheId);
}
