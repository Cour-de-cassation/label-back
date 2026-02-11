import { userType } from '@src/core';
import { userRepository } from '../../repository/userRepository';

export { fetchUserRole };

async function fetchUserRole(userId: userType['_id']) {
  const repo = userRepository();

  const user = await repo.findOne({ _id: userId });

  return user.role;
}
