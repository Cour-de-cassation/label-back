import { Filter, ObjectId } from 'mongodb';
import { documentType } from '@src/core';
import { mongo } from '../../utils';
import { buildProjection } from './projection';

const documents = () => mongo.getDb().collection<documentType>('documents');

export async function ensureDocumentsIndexes() {
  await documents().createIndex({ status: 1 });
  await documents().createIndex({ route: 1 });
  await documents().createIndex({ publicationCategory: 1, status: 1 });
  await documents().createIndex({ priority: 1, status: 1 });
}

export async function insertDocument(document: documentType) {
  await documents().insertOne(document);
}

export async function findDocuments(filter: Filter<documentType> = {}, limit?: number) {
  const cursor = documents().find(filter);
  return (limit !== undefined ? cursor.limit(limit) : cursor).toArray();
}

export async function findDocumentsProjection<K extends keyof documentType>(filter: Filter<documentType>, fields: K[]) {
  return documents()
    .find(filter)
    .project<Pick<documentType, K | '_id'>>(buildProjection<documentType>(fields))
    .toArray();
}

export async function findDocument(filter: Filter<documentType>) {
  return (await documents().findOne(filter)) ?? undefined;
}

export async function findDocumentById(_id: ObjectId) {
  const document = await documents().findOne({ _id });
  if (!document) {
    throw new Error(`No matching documents for _id ${_id}`);
  }
  return document;
}

export async function countDocuments(filter: Filter<documentType> = {}) {
  return documents().countDocuments(filter);
}

export async function findDistinctDocumentValues<T>(field: string): Promise<T[]> {
  return documents().distinct(field, {}) as Promise<T[]>;
}

/**
 * Pick a random document among the 50 most recent and the 50 oldest (by decision date)
 * matching the filter, to treat a mix of recent and old documents.
 */
export async function findRandomDocument(filter: Filter<documentType>) {
  const mostRecentDocuments = await documents().find(filter).sort({ 'decisionMetadata.date': -1 }).limit(50).toArray();
  const leastRecentDocuments = await documents().find(filter).sort({ 'decisionMetadata.date': 1 }).limit(50).toArray();
  const combinedDocuments = [...mostRecentDocuments, ...leastRecentDocuments];

  if (combinedDocuments.length === 0) {
    return undefined;
  }
  return combinedDocuments[Math.floor(Math.random() * combinedDocuments.length)];
}

/** Returns the updated document, or undefined if no document matched the filter */
export async function updateDocument(filter: Filter<documentType>, fields: Partial<documentType>) {
  return (await documents().findOneAndUpdate(filter, { $set: fields }, { returnDocument: 'after' })) ?? undefined;
}

export async function updateDocumentById(_id: ObjectId, fields: Partial<documentType>) {
  return updateDocument({ _id }, fields);
}

export async function deleteDocumentById(_id: ObjectId) {
  const { deletedCount } = await documents().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No documents with _id ${_id.toHexString()}`);
  }
}
