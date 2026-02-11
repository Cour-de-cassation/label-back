import { userRepository } from '../../repository/userRepository';

export { fetchWorkingUsers };

async function fetchWorkingUsers() {
  const repo = userRepository();
  const users = await repo.find({});

  if (!users || users.length === 0) {
    throw new Error('No users found');
  }

  return users.map((user) => {
    const { _id, email, name, role } = user;
    return {
      _id,
      email,
      name,
      role,
    };
  });
}
