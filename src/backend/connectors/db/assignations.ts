import { Filter, ObjectId } from 'mongodb';
import { assignationType, documentType } from '@src/core';
import { mongo } from '../../utils';

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

/** Pending or saved documents assignated to the user with their assignation id, saved documents first */
export async function findAssignedDocumentsOfUser(userId: ObjectId) {
  return assignations()
    .aggregate<{ document: documentType; assignationId: assignationType['_id'] }>([
      { $match: { userId } },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [{ $match: { status: { $in: ['pending', 'saved'] } } }],
        },
      },
      { $unwind: '$document' },
      { $set: { savedFirst: { $cond: [{ $eq: ['$document.status', 'saved'] }, 0, 1] } } },
      { $sort: { savedFirst: 1, _id: 1 } },
      { $project: { _id: 0, document: 1, assignationId: '$_id' } },
    ])
    .toArray();
}

/** Assignations whose document does not exist anymore or is free */
export function findAssignationsOfMissingOrFreeDocuments() {
  return assignations().aggregate<Pick<assignationType, '_id' | 'treatmentId'>>(
    [
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [{ $project: { _id: 0, status: 1 } }],
        },
      },
      { $match: { $or: [{ document: { $size: 0 } }, { 'document.status': 'free' }] } },
      { $project: { _id: 1, treatmentId: 1 } },
    ],
    { allowDiskUse: true },
  );
}
