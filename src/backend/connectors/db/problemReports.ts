import { Filter, ObjectId } from 'mongodb';
import { problemReportType } from '@src/core';
import { mongo } from '../../utils';

const problemReports = () => mongo.getDb().collection<problemReportType>('problemReports');

export async function insertProblemReport(problemReport: problemReportType) {
  await problemReports().insertOne(problemReport);
}

export async function findProblemReports(filter: Filter<problemReportType> = {}) {
  return problemReports().find(filter).toArray();
}

export async function countProblemReports(filter: Filter<problemReportType> = {}) {
  return problemReports().countDocuments(filter);
}

export async function updateProblemReportById(_id: ObjectId, fields: Partial<problemReportType>) {
  await problemReports().updateOne({ _id }, { $set: fields });
}

export async function deleteProblemReportById(_id: ObjectId) {
  const { deletedCount } = await problemReports().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No problemReports with _id ${_id.toHexString()}`);
  }
}

export async function deleteProblemReports(filter: Filter<problemReportType>) {
  await problemReports().deleteMany(filter);
}
