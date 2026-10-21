import { Document, Filter, ObjectId } from 'mongodb';
import { assignationType, documentType, treatmentType, userType } from '@src/core';
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
 * Pick a random document having at least one treatment among the 50 most recent and the 50 oldest
 * (by decision date) matching the filter, to treat a mix of recent and old documents.
 */
export async function findRandomDocumentToTreat(filter: Filter<documentType>) {
  const findTreatedDocuments = (direction: 1 | -1) =>
    documents()
      .aggregate<documentType>([
        { $match: filter },
        { $sort: { 'decisionMetadata.date': direction } },
        {
          $lookup: {
            from: 'treatments',
            localField: '_id',
            foreignField: 'documentId',
            as: 'treatments',
            pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
          },
        },
        { $match: { 'treatments.0': { $exists: true } } },
        { $limit: 50 },
        { $project: { treatments: 0 } },
      ])
      .toArray();

  const combinedDocuments = [...(await findTreatedDocuments(-1)), ...(await findTreatedDocuments(1))];

  if (combinedDocuments.length === 0) {
    return undefined;
  }
  return combinedDocuments[Math.floor(Math.random() * combinedDocuments.length)];
}

const lookupAssignations: Document = {
  $lookup: { from: 'assignations', localField: '_id', foreignField: 'documentId', as: 'assignations' },
};

const lookupAssignedUsers: Document = {
  $lookup: {
    from: 'users',
    localField: 'assignations.userId',
    foreignField: '_id',
    as: 'assignedUsers',
    pipeline: [{ $project: { name: 1 } }],
  },
};

const lookupTreatments: Document = {
  $lookup: {
    from: 'treatments',
    localField: '_id',
    foreignField: 'documentId',
    as: 'treatments',
    pipeline: [{ $sort: { order: 1 } }],
  },
};

function projectFields<K extends keyof documentType>(fields?: K[]): Document[] {
  return fields ? [{ $project: buildProjection<documentType>(fields) }] : [];
}

type documentWithAssignationsType<K extends keyof documentType> = Pick<documentType, K | '_id'> & {
  assignations: assignationType[];
  assignedUsers: Pick<userType, '_id' | 'name'>[];
};

/** Documents with their assignations and the assigned users */
export async function findDocumentsWithAssignations<K extends keyof documentType = keyof documentType>(
  filter: Filter<documentType>,
  fields?: K[],
) {
  return documents()
    .aggregate<documentWithAssignationsType<K>>([
      { $match: filter },
      ...projectFields(fields),
      lookupAssignations,
      lookupAssignedUsers,
    ])
    .toArray();
}

/**
 * Documents with their assignations, assigned users and treatments
 * sorted by order. Throws if a document has no treatment.
 */
export async function findDocumentsWithTreatments<K extends keyof documentType = keyof documentType>(
  filter: Filter<documentType>,
  fields?: K[],
) {
  const documentsWithTreatments = await documents()
    .aggregate<documentWithAssignationsType<K> & { treatments: treatmentType[] }>([
      { $match: filter },
      ...projectFields(fields),
      lookupAssignations,
      lookupAssignedUsers,
      lookupTreatments,
    ])
    .toArray();

  documentsWithTreatments.forEach(({ _id, treatments }) => {
    if (treatments.length === 0) {
      throw new Error(`The document id ${_id.toHexString()} has no matching treatments`);
    }
  });
  return documentsWithTreatments;
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
