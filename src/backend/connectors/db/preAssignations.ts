import { Filter, ObjectId } from 'mongodb';
import { preAssignationType } from '@src/core';
import { mongo } from '../../utils';

const preAssignations = () => mongo.getDb().collection<preAssignationType>('preAssignations');

export async function insertPreAssignation(preAssignation: preAssignationType) {
  await preAssignations().insertOne(preAssignation);
}

export async function findPreAssignation(filter: Filter<preAssignationType>) {
  return (await preAssignations().findOne(filter)) ?? undefined;
}

export async function deletePreAssignationById(_id: ObjectId) {
  await preAssignations().deleteOne({ _id });
}

/** Pre-assignations with the name of their user, skipped if the user does not exist anymore */
export async function findPreAssignationsWithUserName() {
  return preAssignations()
    .aggregate<{ preAssignation: preAssignationType; userName: string }>([
      { $replaceWith: { preAssignation: '$$ROOT' } },
      {
        $lookup: {
          from: 'users',
          localField: 'preAssignation.userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: '$user' },
      { $project: { preAssignation: 1, userName: '$user.name' } },
    ])
    .toArray();
}
