import { userType } from '@src/core';
import { userRepository } from '../../repository/userRepository';

export { updateUser };

async function updateUser({ userId, name, role }: { userId: userType['_id']; name: string; role: userType['role'] }) {
  const repo = userRepository();
  return await repo.updateNameAndRoleById(userId, name, role);
}
