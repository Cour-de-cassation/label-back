import { Filter, ObjectId } from 'mongodb';
import { preAssignationType } from '@src/core';
import { mongo } from '../../utils';

const preAssignations = () => mongo.getDb().collection<preAssignationType>('preAssignations');

export async function insertPreAssignation(preAssignation: preAssignationType) {
  await preAssignations().insertOne(preAssignation);
}

export async function findPreAssignations(filter: Filter<preAssignationType> = {}) {
  return preAssignations().find(filter).toArray();
}

export async function findPreAssignation(filter: Filter<preAssignationType>) {
  return (await preAssignations().findOne(filter)) ?? undefined;
}

export async function deletePreAssignationById(_id: ObjectId) {
  await preAssignations().deleteOne({ _id });
}
