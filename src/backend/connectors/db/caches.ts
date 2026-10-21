import { Filter, ObjectId } from 'mongodb';
import { cacheType } from '@src/core';
import { mongo } from '../../utils';

const caches = () => mongo.getDb().collection<cacheType>('caches');

export async function insertCache(cache: cacheType) {
  await caches().insertOne(cache);
}

/** Most recently updated caches first */
export async function findCaches(filter: Filter<cacheType> = {}) {
  return caches().find(filter).sort({ updateDate: -1 }).toArray();
}

export async function deleteCacheById(_id: ObjectId) {
  const { deletedCount } = await caches().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No caches with _id ${_id.toHexString()}`);
  }
}
