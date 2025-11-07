import { cacheType } from '../cacheType';
import { ObjectId } from 'mongodb';

export { buildCache };

function buildCache(cacheFields: Omit<cacheType, '_id'>): cacheType {
  return {
    ...cacheFields,
    _id: new ObjectId(),
  };
}
