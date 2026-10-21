import { Filter, ObjectId } from 'mongodb';
import { userType } from '@src/core';
import { mongo } from '../../utils';

const users = () => mongo.getDb().collection<userType>('users');

export async function ensureUsersIndexes() {
  await users().createIndex({ email: 1 }, { unique: true });
}

export async function insertUser(user: userType) {
  await users().insertOne(user);
}

export async function findUsers(filter: Filter<userType> = {}) {
  return users().find(filter).toArray();
}

export async function findUser(filter: Filter<userType>) {
  return users().findOne(filter);
}

export async function updateUserById(_id: ObjectId, fields: Partial<userType>) {
  await users().updateOne({ _id }, { $set: fields });
}
