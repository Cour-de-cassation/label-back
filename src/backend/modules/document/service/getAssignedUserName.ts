import { userType } from '@src/core';

export { getAssignedUserName };

function getAssignedUserName(assignedUsers: Pick<userType, '_id' | 'name'>[], userId: userType['_id']) {
  const user = assignedUsers.find((assignedUser) => assignedUser._id.equals(userId));
  if (!user) {
    throw new Error(`Couldn't find the user with id: ${userId.toHexString()}`);
  }
  return user.name;
}
