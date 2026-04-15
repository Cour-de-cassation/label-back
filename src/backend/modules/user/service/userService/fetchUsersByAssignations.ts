import { assignationType, indexer } from '@src/core';
import { buildUserRepository } from '../../repository';

export { fetchUsersByAssignations };

async function fetchUsersByAssignations(assignations: assignationType[]) {
  const userRepository = buildUserRepository();
  const userIds = assignations.map((assignation) => assignation.userId);
  const usersById = await userRepository.findAllByIds(userIds);

  const usersByAssignationId = indexer.mapIndexBy(
    assignations,
    (assignation) => assignation._id.toHexString(),
    (assignation) => usersById[assignation.userId.toHexString()],
  );

  indexer.assertEveryIdIsDefined(
    assignations.map((assignation) => assignation._id.toHexString()),
    usersByAssignationId,
    (_id) => `The assignation ${_id} has no matching user`,
  );
  return usersByAssignationId;
}
