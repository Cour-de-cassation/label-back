import { cacheType } from '@src/core';
import { buildFakeRepositoryBuilder, updateFakeCollection } from '../../../repository';
import { customCacheRepositoryType } from './customCacheRepositoryType';

export { buildFakeCacheRepository };

const buildFakeCacheRepository = buildFakeRepositoryBuilder<cacheType, customCacheRepositoryType>({
  collectionName: 'caches',
  buildCustomFakeRepository: (collection) => ({
    async findAllByKey(key: cacheType['key']) {
      return collection.filter((cache) => cache.key === key);
    },
    async updateContentById(_id: cacheType['_id'], content: cacheType['content']) {
      updateFakeCollection(
        collection,
        collection.map((document) =>
          _id.equals(document._id)
            ? {
                ...document,
                content,
                updateDate: new Date().getTime(),
              }
            : document,
        ),
      );
      const updatedCache = collection.find((cache) => _id.equals(cache._id));

      return updatedCache;
    },
  }),
});
