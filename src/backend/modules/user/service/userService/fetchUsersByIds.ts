import { indexer } from '@src/core';
import { buildUserRepository } from '../../repository';
import { ObjectId } from 'mongodb';

export { fetchUsersByIds };

async function fetchUsersByIds(userIds: ObjectId[]) {
  const userRepository = buildUserRepository();
  const usersById = await userRepository.findAllByIds(userIds);

  indexer.assertEveryIdIsDefined(
    userIds.map((userId) => userId.toHexString()),
    usersById,
    (_id) => `Couldn't find the user with id: ${_id}`,
  );
  return usersById;
}
