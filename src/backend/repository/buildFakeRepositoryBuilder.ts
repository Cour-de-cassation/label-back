import { indexer, keysOf } from '@src/core';
import { omit } from 'lodash';
import { projectedType, repositoryType } from './repositoryType';
import { ObjectId } from 'mongodb';

export { buildFakeRepositoryBuilder, projectFakeObjects, updateFakeCollection };

function buildFakeRepositoryBuilder<T extends { _id: ObjectId }, U>({
  buildCustomFakeRepository,
  collectionName,
}: {
  buildCustomFakeRepository: (collection: T[]) => U;
  collectionName: string;
}): () => repositoryType<T> & U {
  const collection: T[] = [];
  const customRepository = buildCustomFakeRepository(collection);

  return () =>
    ({
      clear,
      deleteById,
      deleteManyByIds,
      distinct,
      distinctNested,
      findAll,
      findAllProjection,
      findAllByIds,
      findById,
      deletePropertiesForMany,
      insert,
      insertMany,
      setIndexes,
      updateOne,
      updateMany,
      upsert,
      ...customRepository,
    }) as unknown as repositoryType<T> & U;
  // Warning: Types are overrided without any safety due it's a fake usage.
  // Should be rethink to be simpler

  async function clear() {
    while (collection.length) {
      collection.pop();
    }
  }

  async function deleteById(_id: ObjectId) {
    const itemToDelete = collection.find((item) => !item._id.equals(_id));
    if (!itemToDelete) {
      throw new Error(`No ${collectionName} with _id ${_id.toHexString()}`);
    }
    updateFakeCollection(
      collection,
      collection.filter((item) => !item._id.equals(_id)),
    );
  }

  async function deleteManyByIds(ids: ObjectId[]) {
    updateFakeCollection(
      collection,
      collection.filter((item) => !ids.some((id) => id.equals(item._id))),
    );
    return {
      success: true,
      count: ids.length,
    };
  }

  async function deletePropertiesForMany(filter: Partial<T>, fieldNames: Array<string>) {
    updateFakeCollection(
      collection,
      collection.map((item) => {
        const mustBeUpdated = keysOf<keyof T>(filter as Record<keyof T, any>).every((key) => filter[key] === item[key]);
        if (mustBeUpdated) {
          return omit(item, fieldNames);
        } else {
          return item;
        }
      }),
    );
  }

  async function distinct<fieldNameT extends keyof T>(fieldName: fieldNameT) {
    const distinctValues = [] as Array<T[fieldNameT]>;

    collection.forEach((item) => {
      if (distinctValues.every((anotherValue) => JSON.stringify(anotherValue) !== JSON.stringify(item[fieldName]))) {
        distinctValues.push(item[fieldName]);
      }
    });

    return distinctValues;
  }

  async function distinctNested<fieldT>(fieldNameNested: string) {
    const distinctValues = [] as Array<fieldT>;

    collection.forEach((item) => {
      const nestedValue = extractNestedField(item);
      if (!!nestedValue && distinctValues.every((anotherValue) => anotherValue !== nestedValue)) {
        distinctValues.push(nestedValue);
      }
    });

    return distinctValues;

    function extractNestedField(item: T) {
      const fieldNames = fieldNameNested.split('.');
      return fieldNames.reduce((accumulator, fieldName) => {
        const nestedItem = (accumulator as any)[fieldName];
        if (!nestedItem) {
          return undefined;
        }
        return nestedItem;
      }, item as any) as fieldT | undefined;
    }
  }

  async function findAll() {
    return collection;
  }

  async function findAllProjection<projectionT extends keyof T>(
    projections: Array<projectionT>,
  ): Promise<Array<projectedType<T, projectionT>>> {
    return collection.map((document) => projectFakeObjects(document, projections));
  }

  async function findAllByIds(idsToSearchIn?: ObjectId[]) {
    let items = [] as T[];
    if (idsToSearchIn) {
      items = collection.filter((item) => idsToSearchIn.some((id) => id.equals(item._id)));
    } else {
      items = collection;
    }

    return indexer.indexBy(items, (item) => item._id.toHexString());
  }

  async function findById(id: ObjectId) {
    const result = collection.find((item) => item._id.equals(id));

    if (!result) {
      throw new Error(`No matching object for _id ${id}`);
    }

    return result;
  }

  async function insert(newObject: T) {
    collection.push(newObject);
    return { success: true };
  }

  async function insertMany(newObjects: T[]) {
    collection.push(...newObjects);
  }

  async function setIndexes() {}

  async function updateOne(id: ObjectId, objectFields: Partial<T>) {
    updateFakeCollection(
      collection,
      collection.map((item) => (id.equals(item._id) ? { ...item, ...objectFields } : item)),
    );

    const updatedItem = collection.find((item) => id.equals(item._id));

    return updatedItem;
  }

  async function updateMany(filter: Partial<T>, objectFields: Partial<T>) {
    updateFakeCollection(
      collection,
      collection.map((item) => {
        const mustBeUpdated = keysOf<keyof T>(filter as Record<keyof T, any>).every((key) => filter[key] === item[key]);
        if (mustBeUpdated) {
          return { ...item, ...objectFields };
        } else {
          return item;
        }
      }),
    );
  }

  async function upsert(newObject: T) {
    if (collection.some((object) => object._id.equals(newObject._id))) {
      await updateOne(newObject._id, newObject);
    } else {
      await insert(newObject);
    }
  }
}

function updateFakeCollection<T>(collection: T[], newCollection: T[]) {
  while (collection.length) {
    collection.pop();
  }

  for (let index = 0; index < newCollection.length; index++) {
    collection.push(newCollection[index]);
  }
}

function projectFakeObjects<T, projectionT extends keyof T>(
  object: T,
  projections: Array<projectionT>,
): projectedType<T, projectionT> {
  const projectedObject = {} as projectedType<T, projectionT>;

  projections.forEach((projection) => ((projectedObject as any)[projection] = object[projection]));

  return projectedObject;
}
