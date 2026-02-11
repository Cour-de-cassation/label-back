import { userRepository } from '../../repository/userRepository';

export { fetchUsers };

async function fetchUsers() {
  const repo = userRepository();
  return repo.find({});
}
