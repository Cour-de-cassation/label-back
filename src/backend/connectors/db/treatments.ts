import { Filter, ObjectId } from 'mongodb';
import { treatmentType } from '@src/core';
import { mongo } from '../../utils';

const treatments = () => mongo.getDb().collection<treatmentType>('treatments');

export async function ensureTreatmentsIndexes() {
  await treatments().createIndex({ documentId: 1 });
  await treatments().createIndex({ documentId: 1, order: 1 }, { unique: true });
  await treatments().createIndex({ lastUpdateDate: 1 });
}

export async function insertTreatment(treatment: treatmentType) {
  await treatments().insertOne(treatment);
}

export async function findTreatments(filter: Filter<treatmentType> = {}) {
  return treatments().find(filter).toArray();
}

export async function findTreatmentById(_id: ObjectId) {
  const treatment = await treatments().findOne({ _id });
  if (!treatment) {
    throw new Error(`No matching treatments for _id ${_id}`);
  }
  return treatment;
}

export async function countTreatments(filter: Filter<treatmentType> = {}) {
  return treatments().countDocuments(filter);
}

export async function updateTreatmentById(_id: ObjectId, fields: Partial<treatmentType>) {
  await treatments().updateOne({ _id }, { $set: fields });
}

export async function deleteTreatmentById(_id: ObjectId) {
  const { deletedCount } = await treatments().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No treatments with _id ${_id.toHexString()}`);
  }
}

export async function deleteTreatments(filter: Filter<treatmentType>) {
  await treatments().deleteMany(filter);
}

export function findOrphanTreatmentIdsUpdatedBefore(date: number) {
  return treatments().aggregate<{ _id: ObjectId }>(
    [
      { $match: { lastUpdateDate: { $lt: date } } },
      { $project: { documentId: 1 } },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
        },
      },
      { $match: { document: { $size: 0 } } },
      { $project: { _id: 1 } },
    ],
    { allowDiskUse: true },
  );
}
