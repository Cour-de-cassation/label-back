import { Filter, ObjectId } from 'mongodb';
import { mongo } from '../utils';

export { genericRepository };

function genericRepository<T extends { _id: ObjectId }>(collectionName: string) {
  const db = mongo.getDb();
  const collection = db.collection<T>(collectionName);

  return {
    find,
    findOne,
    deleteOne,
    deleteMany,
    distinct,
    insert,
  };

  async function find(filter: Filter<T> = {}, project?: Array<keyof T>) {
    const cursor = collection.find(filter);

    if (project && project.length > 0) {
      const projection: Record<string, 1> = {};
      for (const field of project) {
        projection[field as string] = 1;
      }
      return cursor.project(projection).toArray();
    }

    return cursor.toArray();
  }

  async function findOne(filter: Filter<T>) {
    const result = await collection.findOne(filter);
    if (!result) {
      throw `No ${collectionName} found for ${filter}`;
    }
    return result;
  }

  async function deleteOne(filter: Filter<T>) {
    const result = await collection.deleteOne(filter);
    return {
      success: result.acknowledged,
      count: result.deletedCount ?? 0,
    };
  }

  async function deleteMany(filter: Filter<T>) {
    const result = await collection.deleteMany(filter);
    return {
      success: result.acknowledged,
      count: result.deletedCount ?? 0,
    };
  }

  async function distinct<K extends keyof T>(field: K) {
    return collection.distinct(field as string, {}) as Promise<Array<T[K]>>;
  }

  async function insert(newObject: T) {
    const insertResult = await collection.insertOne(newObject as any);
    return { success: !!insertResult.insertedId };
  }
}
