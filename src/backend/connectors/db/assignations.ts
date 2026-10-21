import { Filter, ObjectId } from 'mongodb';
import { assignationType, documentType } from '@src/core';
import { mongo } from '../../utils';
import { buildProjection } from './projection';

const assignations = () => mongo.getDb().collection<assignationType>('assignations');

export async function ensureAssignationsIndexes() {
  await assignations().createIndex({ documentId: 1 });
  await assignations().createIndex({ documentId: 1, userId: 1 });
  await assignations().createIndex({ treatmentId: 1 }, { unique: true });
}

export async function insertAssignation(assignation: assignationType) {
  await assignations().insertOne(assignation);
}

export async function findAssignations(filter: Filter<assignationType> = {}) {
  return assignations().find(filter).toArray();
}

export async function findAssignationsProjection<K extends keyof assignationType>(
  filter: Filter<assignationType>,
  fields: K[],
) {
  return assignations()
    .find(filter)
    .project<Pick<assignationType, K | '_id'>>(buildProjection<assignationType>(fields))
    .toArray();
}

export async function findAssignation(filter: Filter<assignationType>) {
  return (await assignations().findOne(filter)) ?? undefined;
}

export async function deleteAssignationById(_id: ObjectId) {
  const { deletedCount } = await assignations().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No assignations with _id ${_id.toHexString()}`);
  }
}

export async function deleteAssignations(filter: Filter<assignationType>) {
  await assignations().deleteMany(filter);
}

/** Assignations matching the filter whose document exists and matches the document filter, with this document */
export async function findAssignationsWithDocument(
  filter: Filter<assignationType>,
  documentFilter: Filter<documentType> = {},
) {
  return assignations()
    .aggregate<assignationType & { document: documentType }>([
      { $match: filter },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [{ $match: documentFilter }],
        },
      },
      { $unwind: '$document' },
    ])
    .toArray();
}
