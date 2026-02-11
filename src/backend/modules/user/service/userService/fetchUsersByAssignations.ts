import { assignationType, userType } from '@src/core';
import { userRepository } from '../../repository/userRepository';

export { fetchUsersByAssignations };

async function fetchUsersByAssignations(assignations: assignationType[]) {
  const repo = userRepository();
  const userIds = assignations.map((assignation) => assignation.userId);
  const users = await repo.find({ _id: { $in: userIds } } as any);

  const usersById = Object.fromEntries(users.map((user) => [user._id.toHexString(), user])) as Record<string, userType>;

  const usersByAssignationId = Object.fromEntries(
    assignations.map((assignation) => [assignation._id.toHexString(), usersById[assignation.userId.toHexString()]]),
  );
  return usersByAssignationId;
}
