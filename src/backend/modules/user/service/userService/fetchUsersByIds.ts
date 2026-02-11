import { userRepository } from '../../repository/userRepository';
import { ObjectId, WithId } from 'mongodb';
import { userType } from '@src/core';

export { fetchUsersByIds };

async function fetchUsersByIds(userIds: ObjectId[]) {
  const repo = userRepository();
  const users = await repo.find({ _id: { $in: userIds } } as any);

  const usersById = Object.fromEntries(users.map((user) => [user._id.toHexString(), user])) as Record<string, userType>;

  return usersById;
}
